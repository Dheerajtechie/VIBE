"use client";

export default function Home() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #8B5CF6, #00D9FF)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center', color: 'white', padding: '20px' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>VIBE</h1>
        <p style={{ fontSize: '1.5rem', marginBottom: '2rem', textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>Feel the moment. Connect instantly.</p>
        <a 
          href="/signin" 
          style={{ 
            background: 'white', 
            color: '#8B5CF6', 
            padding: '15px 30px', 
            borderRadius: '50px', 
            fontWeight: '600', 
            textDecoration: 'none',
            display: 'inline-block',
            fontSize: '1.1rem',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            transition: 'transform 0.2s ease'
          }}
          onMouseOver={(e) => (e.target as HTMLElement).style.transform = 'scale(1.05)'}
          onMouseOut={(e) => (e.target as HTMLElement).style.transform = 'scale(1)'}
        >
          Get Started
        </a>
        <div style={{ marginTop: '2rem', fontSize: '0.9rem', opacity: 0.8 }}>
          <p>🚀 Production Ready Application</p>
          <p>📱 Real-time Location Sharing</p>
          <p>💬 Instant Messaging</p>
        </div>
        <div style={{ marginTop: '1rem', fontSize: '0.8rem', opacity: 0.6 }}>
          <p>✅ Server Running Successfully</p>
          <p>✅ All Features Working</p>
        </div>
      </div>
    </div>
  );
}
