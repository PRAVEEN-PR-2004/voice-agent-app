import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Mic, MicOff, Send, Square, Volume2, MessageSquare, Zap, Sparkles, Bot } from 'lucide-react';

const App = () => {
  const [text, setText] = useState('');
  const [reply, setReply] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const recognitionRef = useRef(null);
  const speechRef = useRef(null);
  const abortControllerRef = useRef(null);

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
        console.log('🎙️ Voice recognition started...');
      };

      recognition.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('📝 Transcribed text:', transcript);
        setTranscribedText(transcript);
        
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
        console.log('⏹️ Voice recognition ended');
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
      
      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();
      
      const response = await axios.post('http://localhost:5000/api/text', {
        message: message
      }, {
        signal: abortControllerRef.current.signal
      });

      console.log('✅ AI response:', response.data);
      setReply(response.data.reply);

      // Text-to-speech
      if (response.data.reply) {
        console.log('🔊 Speaking response...');
        setIsSpeaking(true);
        const utterance = new SpeechSynthesisUtterance(response.data.reply);
        speechRef.current = utterance;
        
        utterance.onend = () => {
          console.log('🔊 Finished speaking');
          setIsSpeaking(false);
        };
        
        utterance.onerror = () => {
          console.log('🔊 Speech error');
          setIsSpeaking(false);
        };
        
        speechSynthesis.speak(utterance);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('❌ Request cancelled');
        setReply('Response cancelled.');
      } else {
        console.error('❌ Error sending message to AI:', error);
        setReply('Sorry, there was an error processing your message.');
      }
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
      console.log('⏹️ Recording stopped manually');
    }
  };

  const stopResponse = () => {
    console.log('🛑 Stopping response...');
    
    // Cancel the API request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Stop speech synthesis
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
      console.log('🔊 Speech stopped');
    }
    
    setIsProcessing(false);
    setIsSpeaking(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white relative overflow-hidden">
      {/* Animated Background Element */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50 shadow-2xl">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-violet-500 rounded-2xl flex items-center justify-center shadow-2xl">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-violet-400 bg-clip-text text-transparent mb-2">
                Voice Agent AI
              </h1>
              <p className="text-slate-400 text-lg">Your intelligent conversation partner</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {/* Voice Input Section */}
        <div className="mb-12">
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-10 border border-slate-700/50 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500">
            <div className="flex flex-col items-center space-y-8">
              
              {/* Voice Button */}
              <div className="relative">
                <div className={`absolute -inset-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-20 blur-xl transition-all duration-500 ${
                  isRecording ? 'animate-pulse scale-110' : ''
                }`}></div>
                
                <button
                  onClick={handleVoiceInput}
                  disabled={isRecording || isProcessing}
                  className={`relative w-28 h-28 rounded-full flex items-center justify-center text-2xl font-bold transition-all duration-500 shadow-2xl transform ${
                    isRecording 
                      ? 'bg-gradient-to-r from-red-500 to-pink-500 animate-pulse shadow-red-500/50 scale-110' 
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-purple-500/50 hover:scale-110'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isRecording ? <MicOff className="w-12 h-12 animate-bounce" /> : <Mic className="w-12 h-12" />}
                </button>
                
                {isRecording && (
                  <div className="absolute -inset-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full opacity-20 animate-ping"></div>
                )}
              </div>

              <div className="text-center">
                <p className="text-2xl font-bold mb-3 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                  {isRecording ? 'Listening...' : 'Start Voice Chat'}
                </p>
                <p className="text-slate-400 text-lg max-w-md">
                  {isRecording ? 'Speak clearly, I\'m actively listening to you' : 'Click the microphone to begin your conversation'}
                </p>
              </div>

              {isRecording && (
                <button
                  onClick={stopRecording}
                  className="group px-8 py-4 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-red-500/30 transform hover:scale-105"
                >
                  <Square className="w-5 h-5 inline mr-3 group-hover:animate-pulse" />
                  Stop Recording
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Text Input Section */}
        <div className="mb-12">
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl p-8 border border-slate-700/50 shadow-2xl hover:shadow-blue-500/20 transition-all duration-500">
            <div className="flex flex-col space-y-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Type Your Message
                </span>
              </div>
              
              <div className="flex space-x-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type your message here..."
                    className="w-full px-6 py-4 bg-slate-800/60 border border-slate-600/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400 text-lg backdrop-blur-sm transition-all duration-300"
                    onKeyPress={(e) => e.key === 'Enter' && handleTextInput()}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 rounded-2xl pointer-events-none"></div>
                </div>
                <button
                  onClick={handleTextInput}
                  disabled={isProcessing || !text.trim()}
                  className="group px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-green-500/30 transform hover:scale-105"
                >
                  <Send className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stop Response Button */}
        {(isProcessing || isSpeaking) && (
          <div className="mb-12 flex justify-center">
            <button
              onClick={stopResponse}
              className="group px-10 py-5 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 rounded-2xl font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-red-500/40 transform hover:scale-105"
            >
              <Square className="w-6 h-6 inline mr-3 group-hover:animate-pulse" />
              Stop Response
            </button>
          </div>
        )}

        {/* Status Indicators */}
        <div className="mb-12 flex justify-center">
          {isRecording && (
            <div className="flex items-center space-x-3 px-6 py-3 bg-red-500/20 border border-red-500/30 rounded-2xl backdrop-blur-sm animate-pulse">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
              <span className="text-red-300 font-bold text-lg">Recording...</span>
              <Zap className="w-5 h-5 text-red-400 animate-bounce" />
            </div>
          )}
          
          {isProcessing && (
            <div className="flex items-center space-x-3 px-6 py-3 bg-blue-500/20 border border-blue-500/30 rounded-2xl backdrop-blur-sm">
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-spin"></div>
              <span className="text-blue-300 font-bold text-lg">Processing...</span>
              <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
            </div>
          )}

          {isSpeaking && (
            <div className="flex items-center space-x-3 px-6 py-3 bg-green-500/20 border border-green-500/30 rounded-2xl backdrop-blur-sm">
              <Volume2 className="w-5 h-5 text-green-400 animate-pulse" />
              <span className="text-green-300 font-bold text-lg">Speaking...</span>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="space-y-8">
          {transcribedText && (
            <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 backdrop-blur-xl rounded-3xl p-8 border border-green-500/30 shadow-2xl hover:shadow-green-500/20 transition-all duration-500 transform hover:scale-[1.02]">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Mic className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl text-green-300">You said:</span>
              </div>
              <p className="text-green-100 text-xl leading-relaxed font-medium">{transcribedText}</p>
            </div>
          )}
          
          {text && !transcribedText && (
            <div className="bg-gradient-to-r from-slate-800/40 to-slate-700/40 backdrop-blur-xl rounded-3xl p-8 border border-slate-500/30 shadow-2xl hover:shadow-slate-500/20 transition-all duration-500 transform hover:scale-[1.02]">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-slate-500 to-slate-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Send className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl text-slate-300">You typed:</span>
              </div>
              <p className="text-slate-100 text-xl leading-relaxed font-medium">{text}</p>
            </div>
          )}
          
          {reply && (
            <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 backdrop-blur-xl rounded-3xl p-8 border border-purple-500/30 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 transform hover:scale-[1.02]">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl text-purple-300">Agent replied:</span>
              </div>
              <p className="text-purple-100 text-xl leading-relaxed font-medium">{reply}</p>
            </div>
          )}
        </div>

        {/* Debug Info */}
        <div className="mt-16 bg-slate-900/40 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/30 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg shadow-green-500/50"></div>
              <span className="text-slate-300 font-medium">Server: localhost:5000</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full shadow-lg ${
                isRecording ? 'bg-red-500 shadow-red-500/50 animate-pulse' : 
                isProcessing ? 'bg-blue-500 shadow-blue-500/50 animate-spin' : 
                isSpeaking ? 'bg-green-500 shadow-green-500/50 animate-pulse' : 'bg-slate-500 shadow-slate-500/50'
              }`}></div>
              <span className="text-slate-300 font-medium">
                Status: {isRecording ? 'Listening' : isProcessing ? 'Processing' : isSpeaking ? 'Speaking' : 'Ready'}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full shadow-lg ${
                window.SpeechRecognition || window.webkitSpeechRecognition ? 'bg-green-500 shadow-green-500/50' : 'bg-red-500 shadow-red-500/50'
              }`}></div>
              <span className="text-slate-300 font-medium">
                Speech: {window.SpeechRecognition || window.webkitSpeechRecognition ? 'Available' : 'Not Available'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;