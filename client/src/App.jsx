import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Mic, MicOff, Send, Square, Volume2, MessageSquare, Zap, Sparkles, Bot } from 'lucide-react';
import Home from './Home.jsx';

const SUPPORTED_LANGUAGES = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'fr-FR', label: 'French' },
  { code: 'es-ES', label: 'Spanish' },
  { code: 'de-DE', label: 'German' },
  { code: 'ta-IN', label: 'Tamil' },
  { code: 'ml-IN', label: 'Malayalam' }, // Added Malayalam
  // Add more as needed
];

const App = () => {
  const [text, setText] = useState('');
  const [reply, setReply] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [page, setPage] = useState('home');
  const [systemPrompt, setSystemPrompt] = useState('');
  const recognitionRef = useRef(null);
  const speechRef = useRef(null);
  const abortControllerRef = useRef(null);
  const [selectedLang, setSelectedLang] = useState('en-US');
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [showNoVoiceMsg, setShowNoVoiceMsg] = useState(false);
  const [hasWelcomed, setHasWelcomed] = useState(false);

  // Load voices for speech synthesis
  useEffect(() => {
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      const filtered = allVoices.filter(v => v.lang === selectedLang);
      setVoices(filtered);
      setSelectedVoice(filtered[0] || null);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    // Cleanup
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, [selectedLang]);

  // Update showNoVoiceMsg when voices change
  useEffect(() => {
    setShowNoVoiceMsg(voices.length === 0);
  }, [voices]);

  // Welcome message when entering chat page
  useEffect(() => {
    if (page === 'chat' && !hasWelcomed) {
      setHasWelcomed(true);
      setReply('👋 Welcome! I am your voice agent. You can speak or type your message below.');
      // Optionally, speak the welcome message
      if (voices.length > 0 && selectedVoice) {
        const utterance = new window.SpeechSynthesisUtterance('Welcome! I am your voice agent. You can speak or type your message below.');
        utterance.lang = selectedLang;
        utterance.voice = selectedVoice;
        window.speechSynthesis.speak(utterance);
      }
    }
    if (page === 'home') setHasWelcomed(false);
    // eslint-disable-next-line
  }, [page, voices, selectedVoice, selectedLang]);

  const handleCreateAgent = (prompt) => {
    setSystemPrompt(prompt);
    setPage('chat');
  };

  const handleVoiceInput = async () => {
    try {
      // Stop any ongoing agent speech before listening
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      console.log('🎤 Starting voice recognition...');
      setIsRecording(true);
      setTranscribedText('');
      
      // Use Web Speech API for real-time transcription
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = selectedLang;
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
      
      // Add language instruction to system prompt
      let langInstruction = '';
      const langObj = SUPPORTED_LANGUAGES.find(l => l.code === selectedLang);
      if (langObj) {
        langInstruction = `Respond in ${langObj.label}.`;
      }
      const response = await axios.post('http://localhost:5001/chat', {
        message: message,
        system_prompt: (langInstruction ? langInstruction + '\n' : '') + (systemPrompt || ''),
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
        utterance.lang = selectedLang;
        if (selectedVoice) utterance.voice = selectedVoice;
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

  if (page === 'home') {
    return <Home onCreateAgent={handleCreateAgent} />;
  }

  // Light theme chat page with professional UI
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)', color: '#222', position: 'relative' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, background: 'linear-gradient(90deg, #6a5acd, #00b4d8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
            Voice Agent Chat
          </h2>
          <button
            onClick={() => setPage('home')}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(90deg, #e0e7ef, #6a5acd20)',
              color: '#6a5acd',
              fontWeight: 700,
              fontSize: 16,
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(60,60,120,0.04)',
              transition: 'background 0.2s',
            }}
          >
            ← Back to Home
          </button>
        </div>
        {/* Language and Voice Selectors */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
          <div>
            <label style={{ fontWeight: 600, fontSize: 15 }}>Language:</label><br />
            <select value={selectedLang} onChange={e => setSelectedLang(e.target.value)} style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }}>
              {SUPPORTED_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontWeight: 600, fontSize: 15 }}>Voice:</label><br />
            <select value={selectedVoice ? selectedVoice.name : ''} onChange={e => setSelectedVoice(voices.find(v => v.name === e.target.value))} style={{ padding: 8, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 15 }}>
              {voices.map(voice => (
                <option key={voice.name} value={voice.name}>{voice.name}</option>
              ))}
            </select>
          </div>
        </div>
        {showNoVoiceMsg && (
          <div style={{ color: '#e63946', background: '#fff3f3', border: '1px solid #e63946', borderRadius: 8, padding: 12, marginBottom: 16, fontWeight: 600 }}>
            No voices are available for the selected language on your system/browser. Please try another language, use a different browser (like Edge), or install the language pack in your OS.
          </div>
        )}
        <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 24px rgba(60,60,120,0.08)', padding: 32, marginBottom: 32 }}>
          {/* Voice Input Section */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
            <button
              onClick={handleVoiceInput}
              disabled={isRecording || isProcessing}
              style={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                background: isRecording ? 'linear-gradient(90deg, #e63946, #ffb4a2)' : 'linear-gradient(90deg, #6a5acd, #00b4d8)',
                color: '#fff',
                fontSize: 32,
                fontWeight: 700,
                border: 'none',
                boxShadow: isRecording ? '0 0 0 8px #e6394622' : '0 2px 8px #6a5acd22',
                marginBottom: 16,
                cursor: isRecording || isProcessing ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={isRecording ? 'Listening...' : 'Start Voice Chat'}
            >
              {isRecording ? <MicOff size={40} /> : <Mic size={40} />}
            </button>
            <div style={{ fontSize: 18, fontWeight: 600, color: isRecording ? '#e63946' : '#6a5acd', marginBottom: 8 }}>
              {isRecording ? 'Listening...' : 'Start Voice Chat'}
            </div>
            {isRecording && (
              <button
                onClick={stopRecording}
                style={{
                  padding: '10px 24px',
                  background: 'linear-gradient(90deg, #e63946, #ffb4a2)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 16,
                  border: 'none',
                  borderRadius: 8,
                  marginTop: 8,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px #e6394622',
                  transition: 'background 0.2s',
                }}
              >
                <Square size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} /> Stop Recording
              </button>
            )}
          </div>
          {/* Text Input Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type your message here..."
              style={{
                flex: 1,
                padding: '14px 16px',
                borderRadius: 10,
                border: '1px solid #cbd5e1',
                fontSize: 16,
                background: '#f1f5f9',
                color: '#222',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border 0.2s',
              }}
              onKeyPress={e => e.key === 'Enter' && handleTextInput()}
            />
            <button
              onClick={handleTextInput}
              disabled={isProcessing || !text.trim()}
              style={{
                padding: '14px 24px',
                background: 'linear-gradient(90deg, #6a5acd, #00b4d8)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 18,
                border: 'none',
                borderRadius: 10,
                cursor: isProcessing || !text.trim() ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px #6a5acd22',
                transition: 'background 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <Send size={22} />
            </button>
          </div>
          {/* Stop Response Button */}
          {(isProcessing || isSpeaking) && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
              <button
                onClick={stopResponse}
                style={{
                  padding: '12px 32px',
                  background: 'linear-gradient(90deg, #e63946, #ffb4a2)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 16,
                  border: 'none',
                  borderRadius: 10,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px #e6394622',
                  transition: 'background 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <Square size={20} /> Stop Response
              </button>
            </div>
          )}
          {/* Results */}
          <div style={{ marginTop: 24 }}>
            {transcribedText && (
              <div style={{ background: 'linear-gradient(90deg, #e0e7ef, #b2f7ef)', borderRadius: 12, padding: 18, marginBottom: 16, color: '#222', fontWeight: 500 }}>
                <Mic size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                <span style={{ color: '#00b4d8', fontWeight: 700 }}>You said:</span> {transcribedText}
              </div>
            )}
            {text && !transcribedText && (
              <div style={{ background: 'linear-gradient(90deg, #e0e7ef, #b2f7ef)', borderRadius: 12, padding: 18, marginBottom: 16, color: '#222', fontWeight: 500 }}>
                <Send size={18} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                <span style={{ color: '#6a5acd', fontWeight: 700 }}>You typed:</span> {text}
              </div>
            )}
            {reply && (
              <div style={{ background: 'linear-gradient(90deg, #f1f5f9, #e0e7ef)', borderRadius: 12, padding: 24, marginBottom: 16, color: '#222', fontWeight: 500, boxShadow: '0 2px 8px #6a5acd11' }}>
                <Bot size={22} style={{ marginRight: 8, verticalAlign: 'middle', color: '#6a5acd' }} />
                <span style={{ color: '#6a5acd', fontWeight: 700 }}>Agent replied:</span>
                <div style={{ marginTop: 8, fontSize: 18, lineHeight: 1.6 }}>{reply}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;