require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Simple rate limiting
const requestCounts = new Map();
const RATE_LIMIT = 20; // requests per minute
const RATE_LIMIT_WINDOW = 60000; // 1 minute

// Fallback responses
const fallbackResponses = [
  "I'm currently experiencing technical difficulties. Please try again in a few moments.",
  "I'm temporarily unavailable. Please check back soon.",
  "Service is currently limited. Please try again later.",
  "I'm having trouble processing requests right now. Please wait a moment and try again.",
  "Temporary service interruption. Please try again shortly."
];

function getRandomFallbackResponse() {
  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
}

function checkRateLimit(ip) {
  const now = Date.now();
  const userRequests = requestCounts.get(ip) || [];
  
  const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT) {
    console.log(`⚠ Rate limit exceeded for IP: ${ip}`);
    return false;
  }
  
  recentRequests.push(now);
  requestCounts.set(ip, recentRequests);
  return true;
}

// Get AI response using Python server
async function getAIResponse(message, session_id) {
  try {
    const response = await axios.post('http://localhost:5002/chat', {
      message,
      session_id
    });
    return {
      reply: response.data.reply,
      provider: 'python-llm',
      session_id: response.data.session_id
    };
  } catch (error) {
    console.error('❌ Python LLM server failed:', error.message);
    throw new Error('Python LLM server failed');
  }
}

// Text endpoint (for both voice and text input)
app.post('/api/text', async (req, res) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  console.log(`📝 Text request from IP: ${clientIP}`);
  
  // Check rate limit
  if (!checkRateLimit(clientIP)) {
    console.log('⏰ Rate limit exceeded');
    return res.status(429).json({ 
      reply: 'Too many requests. Please wait a moment before trying again.',
      error: 'rate_limit_exceeded'
    });
  }

  const { message, session_id } = req.body;
  console.log('📨 Received message:', message);

  if (!message || typeof message !== 'string') {
    console.log('❌ Invalid message format');
    return res.status(400).json({ 
      reply: 'Please provide a valid message.',
      error: 'invalid_input'
    });
  }

  try {
    const result = await getAIResponse(message, session_id);
    
    console.log('✅ Sending response:', result);
    res.json({ 
      reply: result.reply,
      provider: result.provider,
      session_id: result.session_id
    });
  } catch (err) {
    console.error('❌ AI Error:', err);
    
    res.status(500).json({ 
      reply: getRandomFallbackResponse(),
      error: 'internal_error'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    apis: {
      gemini: false // Removed Gemini health check
    },
    features: {
      text_chat: true,
      voice_chat: true
    }
  });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log('🚀 Server started successfully!');
  console.log(`🌐 Server listening on port ${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log('📝 Text endpoint: POST http://localhost:${PORT}/api/text');
  console.log('🤖 Using Python LLM server');
  console.log('📊 Rate limit: 20 requests per minute');
});