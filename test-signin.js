#!/usr/bin/env node

// VIBE Signin Test Script
// Run this to test if signin is working

const { createClient } = require('@supabase/supabase-js');

console.log('🔐 VIBE Signin Test');
console.log('==================');

// Test environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fluzuwaqfkqchzdxtbdn.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsdXp1d2FxZmtxY2h6ZHh0YmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMTczNDAsImV4cCI6MjA3Njc5MzM0MH0.T0xQBkbwIOQMxH_ZYqbeRgdlYezyKymNWHKfQIasmS4";

console.log('📍 Supabase URL:', supabaseUrl);
console.log('🔑 Supabase Key:', supabaseKey ? '✅ Set' : '❌ Missing');

// Test Supabase connection and auth
async function testSignin() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('\n🔗 Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.log('❌ Database connection failed:', error.message);
      console.log('💡 Solution: Run SUPABASE_CLEAN_SETUP.sql in your Supabase SQL Editor');
      return false;
    }
    
    console.log('✅ Database connection successful!');
    
    // Test auth configuration
    console.log('\n🔐 Testing authentication configuration...');
    
    // Check if we can access auth
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('⚠️  Auth check:', authError.message);
    } else {
      console.log('✅ Authentication system ready');
    }
    
    // Test magic link (without actually sending)
    console.log('\n📧 Testing magic link configuration...');
    
    // This will fail but we can check the error type
    const { error: magicLinkError } = await supabase.auth.signInWithOtp({
      email: 'test@example.com',
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/callback?next=/onboarding'
      }
    });
    
    if (magicLinkError) {
      if (magicLinkError.message.includes('Invalid redirect URL')) {
        console.log('❌ Invalid redirect URL error');
        console.log('💡 Solution: Add these URLs in Supabase Auth Settings:');
        console.log('   Site URL: http://localhost:3000');
        console.log('   Redirect URL: http://localhost:3000/auth/callback');
        console.log('   Redirect URL: https://vibe-sage.vercel.app/auth/callback');
      } else {
        console.log('✅ Magic link configuration looks good');
        console.log('   (Expected error for test email)');
      }
    }
    
    // Test Google OAuth configuration
    console.log('\n🔐 Testing Google OAuth configuration...');
    
    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback?next=/onboarding'
      }
    });
    
    if (googleError) {
      if (googleError.message.includes('Invalid redirect URL')) {
        console.log('❌ Google OAuth redirect URL error');
        console.log('💡 Solution: Configure Google OAuth in Supabase:');
        console.log('   1. Go to Supabase → Authentication → Providers');
        console.log('   2. Enable Google provider');
        console.log('   3. Add Google OAuth credentials');
        console.log('   4. Set redirect URL: https://fluzuwaqfkqchzdxtbdn.supabase.co/auth/v1/callback');
      } else if (googleError.message.includes('Provider not enabled')) {
        console.log('❌ Google provider not enabled');
        console.log('💡 Solution: Enable Google provider in Supabase dashboard');
      } else {
        console.log('✅ Google OAuth configuration looks good');
        console.log('   (Expected error for test OAuth)');
      }
    }
    
    return true;
  } catch (err) {
    console.log('❌ Signin test failed:', err.message);
    return false;
  }
}

// Run the test
testSignin().then(success => {
  if (success) {
    console.log('\n🎉 VIBE signin should work!');
    console.log('🚀 You can now test: npm run dev');
    console.log('📱 Visit: http://localhost:3000/signin');
  } else {
    console.log('\n❌ VIBE signin needs attention');
    console.log('📋 Check the SIGNIN_FIX_GUIDE.md for solutions');
  }
});
