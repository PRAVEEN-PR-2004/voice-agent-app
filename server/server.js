require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDRfjlK4WZrX_po-irJl-Cvxj3aLH6-vxo';
console.log('🔑 Initializing Gemini API with key:', GEMINI_API_KEY.substring(0, 10) + '...');

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

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

// Get AI response using Gemini
async function getAIResponse(message) {
  console.log('🤖 Processing message with Gemini:', message);
  
  try {
    // Try gemini-1.5-flash first
    console.log('🔄 Trying gemini-1.5-flash...');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(message);
    const response = await result.response;
    const reply = response.text();
    
    console.log('✅ gemini response received:', reply);
    return {
      reply: reply,
      provider: 'gemini-1.5-flash'
    };
  } catch (error) {
    console.log('❌ gemini-1.5-flash failed:', error.message);
    console.log('🔄 Trying gemini-1.5-pro...');
    
    try {
      // Fallback to gemini-1.5-pro
      const model2 = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const result2 = await model2.generateContent(message);
      const response2 = await result2.response;
      const reply2 = response2.text();
      
      console.log('✅ Gemini pro response received:', reply2);
      return {
        reply: reply2,
        provider: 'gemini-1.5-pro'
      };
    } catch (error2) {
      console.error('❌ All Gemini models failed:', error2.message);
      throw new Error('Gemini API failed');
    }
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

  const { message } = req.body;
  console.log('📨 Received message:', message);

  if (!message || typeof message !== 'string') {
    console.log('❌ Invalid message format');
    return res.status(400).json({ 
      reply: 'Please provide a valid message.',
      error: 'invalid_input'
    });
  }

  try {
    const result = await getAIResponse(message);
    
    console.log('✅ Sending response:', result);
    res.json({ 
      reply: result.reply,
      provider: result.provider
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
      gemini: !!GEMINI_API_KEY
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
  console.log('🤖 Using Gemini API only');
  console.log('📊 Rate limit: 20 requests per minute');
});