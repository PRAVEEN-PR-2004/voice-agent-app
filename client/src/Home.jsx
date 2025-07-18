import React, { useState } from 'react';

const DEFAULT_AGENTS = [
  {
    label: 'Emotional Supporter',
    prompt: `You are a warm, empathetic, and supportive emotional supporter. Speak in a gentle, polite, and encouraging way. Listen to the user's feelings, offer comfort, and provide positive, uplifting advice. Help the user feel understood and better about their situation. Avoid judgment and always focus on emotional well-being.`
  },
  {
    label: 'Study Helper',
    prompt: `You are a motivating, organized, and practical study helper. Help students plan their study schedules, break down tasks, and stay focused. Offer encouragement, productivity tips, and practical advice for learning and exam preparation. Always be positive and supportive.`
  },
  {
    label: 'Career Mentor',
    prompt: `You are a practical, insightful, and supportive career mentor. Offer guidance on career choices, resume building, interview preparation, and professional growth. Encourage self-reflection, goal setting, and provide actionable advice for career development. Always be positive and constructive.`
  },
  {
    label: 'Health Advisor',
    prompt: `You are a friendly, knowledgeable health advisor. Offer general wellness tips, healthy habits, and lifestyle advice. Encourage users to maintain a balanced diet, exercise, and good mental health. Avoid giving medical diagnoses or treatment; always recommend consulting a healthcare professional for medical concerns.`
  },
  {
    label: 'Friend',
    prompt: `You're the user's fun, supportive, and slightly goofy best friend. Speak casually and cheerfully, use emojis and slang, and keep the conversation light and engaging. React expressively — say things like "Omg no way!", "Then what happened?!", or "Brooo that’s wild 😆". Be a great listener, share funny comments, give friendly advice, and always have their back. You're here to cheer them up, hype them up, and vibe with them like a true buddy.`
  }
];


const Home = ({ onCreateAgent }) => {
  const [prompt, setPrompt] = useState('');
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  const handleCreate = () => {
    const finalPrompt = selected !== null ? DEFAULT_AGENTS[selected].prompt : prompt;
    if (!finalPrompt.trim()) {
      setError('Please select or enter a description for your agent.');
      return;
    }
    setError('');
    onCreateAgent(finalPrompt);
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)', color: '#222' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '48px 16px' }}>
        <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 8px 32px rgba(60,60,120,0.08)', padding: 40, marginTop: 64 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16, background: 'linear-gradient(90deg, #6a5acd, #00b4d8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Welcome to Voice Agent AI
          </h1>
          <p style={{ fontSize: 18, color: '#555', marginBottom: 32 }}>
            Create your own intelligent voice agent!<br />
            Select a famous agent below or describe your own.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 32 }}>
            {DEFAULT_AGENTS.map((agent, idx) => (
              <div
                key={agent.label}
                onClick={() => { setSelected(idx); setPrompt(''); }}
                style={{
                  flex: '1 1 250px',
                  minWidth: 250,
                  background: selected === idx ? 'linear-gradient(90deg, #6a5acd20, #00b4d820)' : '#f1f5f9',
                  border: selected === idx ? '2px solid #6a5acd' : '1px solid #cbd5e1',
                  borderRadius: 16,
                  padding: 20,
                  cursor: 'pointer',
                  boxShadow: selected === idx ? '0 4px 16px #6a5acd22' : '0 2px 8px rgba(60,60,120,0.04)',
                  transition: 'all 0.2s',
                  marginBottom: 8
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{agent.label}</div>
                {selected === idx && (
                  <div style={{ color: '#00b4d8', fontWeight: 600, marginTop: 8 }}>Selected</div>
                )}
              </div>
            ))}
          </div>
          <div style={{ margin: '24px 0 8px 0', fontWeight: 600, fontSize: 16, color: '#333' }}>Or describe your own agent:</div>
          <input
            id="prompt"
            type="text"
            value={prompt}
            onChange={e => { setPrompt(e.target.value); setSelected(null); }}
            placeholder="e.g., I want to talk to a doctor"
            style={{
              width: '100%',
              padding: '14px 16px',
              margin: '8px 0 8px 0',
              borderRadius: 12,
              border: '1px solid #cbd5e1',
              fontSize: 16,
              background: '#f1f5f9',
              color: '#222',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border 0.2s',
            }}
            onFocus={e => e.target.style.border = '1.5px solid #6a5acd'}
            onBlur={e => e.target.style.border = '1px solid #cbd5e1'}
          />
          {error && <div style={{ color: '#e63946', marginBottom: 8 }}>{error}</div>}
          <button
            onClick={handleCreate}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(90deg, #6a5acd, #00b4d8)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 18,
              border: 'none',
              borderRadius: 12,
              marginTop: 16,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(60,60,120,0.08)',
              transition: 'background 0.2s',
            }}
          >
            Create Agent & Speak
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home; 