// client/src/App.jsx
import React, { useState, useRef } from 'react';
import axios from 'axios';

const App = () => {
  const [text, setText] = useState('');
  const [reply, setReply] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const recognitionRef = useRef(null);

  const handleVoiceInput = async () => {
    try {
      console.log('🎤 Starting voice recognition...');
      setIsRecording(true);
      setTranscribedText('');
      
      // Use Web Speech API for real-time transcription
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('🎙 Voice recognition started...');
      };

      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('📝 Transcribed text:', transcript);
        setTranscribedText(transcript);
        setText(transcript);
        
        // Stop recording
        recognition.stop();
        setIsRecording(false);
        
        // Send to AI
        await sendToAI(transcript);
      };

      recognition.onerror = (event) => {
        console.error('❌ Speech recognition error:', event.error);
        setReply('Error with speech recognition. Please try again.');
        setIsRecording(false);
      };

      recognition.onend = () => {
        console.log('⏹ Voice recognition ended');
        setIsRecording(false);
      };

      recognition.start();

    } catch (error) {
      console.error('❌ Error starting voice recognition:', error);
      setReply('Error accessing microphone. Please check permissions.');
      setIsRecording(false);
    }
  };

  const sendToAI = async (message) => {
    if (!message.trim()) return;

    try {
      console.log('📝 Sending message to AI:', message);
      setIsProcessing(true);
      
      const response = await axios.post('http://localhost:5000/api/text', {
        message: message
      });

      console.log('✅ AI response:', response.data);
      setReply(response.data.reply);

      // Text-to-speech
      if (response.data.reply) {
        console.log('🔊 Speaking response...');
        const utterance = new SpeechSynthesisUtterance(response.data.reply);
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error('❌ Error sending message to AI:', error);
      setReply('Sorry, there was an error processing your message.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextInput = async () => {
    if (!text.trim()) return;
    await sendToAI(text);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      console.log('⏹ Recording stopped manually');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-center p-5">
      <h1 className="text-3xl font-bold mb-6">🎤 Voice Agent</h1>
      
      {/* Voice Input */}
      <div className="mb-6">
        <button
          onClick={handleVoiceInput}
          disabled={isRecording || isProcessing}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            isRecording 
              ? 'bg-red-500 text-white' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
          } disabled:opacity-50`}
        >
          {isRecording ? '🎙 Listening...' : '🎤 Start Voice Chat'}
        </button>
        
        {isRecording && (
          <button
            onClick={stopRecording}
            className="ml-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            ⏹ Stop
          </button>
        )}
      </div>

      {/* Text Input */}
      <div className="mb-6 w-full max-w-md">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Or type your message here..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyPress={(e) => e.key === 'Enter' && handleTextInput()}
        />
        <button
          onClick={handleTextInput}
          disabled={isProcessing || !text.trim()}
          className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          📝 Send Text
        </button>
      </div>

      {/* Status */}
      {isRecording && (
        <div className="mb-4 text-red-600 font-semibold">
          🎙 Speak now... (Listening)
        </div>
      )}
      
      {isProcessing && (
        <div className="mb-4 text-blue-600">
          ⏳ Processing your request...
        </div>
      )}

      {/* Results */}
      <div className="w-full max-w-2xl">
        {transcribedText && (
          <div className="mb-4 p-4 bg-green-50 rounded-lg shadow">
            <p className="font-semibold text-green-700">You said:</p>
            <p className="text-green-900">{transcribedText}</p>
          </div>
        )}
        
        {text && !transcribedText && (
          <div className="mb-4 p-4 bg-white rounded-lg shadow">
            <p className="font-semibold text-gray-700">You typed:</p>
            <p className="text-gray-900">{text}</p>
          </div>
        )}
        
        {reply && (
          <div className="p-4 bg-blue-50 rounded-lg shadow">
            <p className="font-semibold text-blue-700">Agent replied:</p>
            <p className="text-blue-900">{reply}</p>
          </div>
        )}
      </div>

      {/* Debug Info */}
      <div className="mt-6 text-sm text-gray-500">
        <p>Server: http://localhost:5000</p>
        <p>Status: {isRecording ? 'Listening' : isProcessing ? 'Processing' : 'Ready'}</p>
        <p>Speech Recognition: {window.SpeechRecognition || window.webkitSpeechRecognition ? 'Available' : 'Not Available'}</p>
      </div>
    </div>
  );
};

export default App;