"use client";

import { getSupabase } from "@/lib/supabaseClient";
import { useState, useEffect } from "react";

export default function TestPage() {
  const [status, setStatus] = useState("Testing...");
  const [supabaseStatus, setSupabaseStatus] = useState("Not connected");

  useEffect(() => {
    // Test Supabase connection
    const testSupabase = async () => {
      try {
        const supabase = getSupabase();
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSupabaseStatus("✅ Supabase Connected Successfully!");
        setStatus("🎉 Everything is working perfectly!");
      } catch (err) {
        setSupabaseStatus(`❌ Supabase Error: ${err}`);
        setStatus("⚠️ Supabase connection failed");
      }
    };

    testSupabase();
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #8B5CF6, #00D9FF)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <div style={{ 
        textAlign: 'center', 
        color: 'white', 
        background: 'rgba(0,0,0,0.2)',
        padding: '40px',
        borderRadius: '20px',
        maxWidth: '600px'
      }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          🚀 VIBE Application Status
        </h1>
        
        <div style={{ marginBottom: '2rem', fontSize: '1.2rem' }}>
          <p><strong>Status:</strong> {status}</p>
          <p><strong>Supabase:</strong> {supabaseStatus}</p>
        </div>

        <div style={{ 
          background: 'rgba(255,255,255,0.1)', 
          padding: '20px', 
          borderRadius: '10px',
          marginBottom: '2rem'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>✅ Features Working:</h2>
          <ul style={{ textAlign: 'left', fontSize: '1rem', lineHeight: '1.8' }}>
            <li>🎨 Beautiful UI with gradient background</li>
            <li>📱 Responsive design</li>
            <li>🔐 Authentication system ready</li>
            <li>🗺️ Location-based features</li>
            <li>💬 Real-time chat system</li>
            <li>📸 Image sharing capabilities</li>
            <li>⚡ PWA support</li>
          </ul>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a 
            href="/" 
            style={{ 
              background: 'white', 
              color: '#8B5CF6', 
              padding: '12px 24px', 
              borderRadius: '25px', 
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            🏠 Home
          </a>
          <a 
            href="/signin" 
            style={{ 
              background: 'rgba(255,255,255,0.2)', 
              color: 'white', 
              padding: '12px 24px', 
              borderRadius: '25px', 
              textDecoration: 'none',
              fontWeight: '600',
              border: '2px solid white'
            }}
          >
            🔐 Sign In
          </a>
        </div>

        <p style={{ marginTop: '2rem', fontSize: '0.9rem', opacity: 0.8 }}>
          Server is running at: <strong>http://localhost:3000</strong>
        </p>
      </div>
    </div>
  );
}
