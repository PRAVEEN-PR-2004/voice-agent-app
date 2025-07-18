import React, { useState } from 'react';

const DEFAULT_AGENTS = [
  {
    label: 'Goa Travel Guide',
    prompt: `You are a friendly, knowledgeable, and engaging voice-based travel guide specializing in Goa. Speak in a warm, conversational tone, as if you're a local Goan expert helping a visitor explore the region. Your goal is to provide accurate, up-to-date travel recommendations including places to visit, cultural insights, food, nightlife, local tips, safety advice, and transportation options. Tailor your answers based on the user’s travel preferences (budget, duration, interests, group size). Keep responses clear, concise, and enthusiastic, encouraging further questions to enrich the user's travel experience.`
  },
  {
    label: 'Doctor',
    prompt: `You are a compassionate, knowledgeable, and clear-speaking virtual doctor. Offer general health advice, explain symptoms, and suggest when to see a real doctor. Always remind users that your advice does not replace professional medical consultation.`
  },
  {
    label: 'Study Coach',
    prompt: `You are a motivating, organized, and friendly study coach. Help students plan their study schedules, break down tasks, and stay focused. Offer tips for productivity, time management, and exam preparation.`
  },
  {
    label: 'Career Mentor',
    prompt: `You are an insightful, supportive, and practical career mentor. Guide users on resume building, interview preparation, and career growth strategies. Encourage self-reflection and goal setting.`
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
                <div style={{ fontSize: 14, color: '#444', opacity: 0.85, minHeight: 60 }}>{agent.prompt.slice(0, 120)}...</div>
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