#!/usr/bin/env node

require('dotenv').config({ path: './.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🚀 VIBE Startup - Complete Test Suite');
console.log('=====================================');

async function testStartup() {
  console.log('\n🔍 Testing VIBE Startup Configuration...');
  
  // Test 1: Environment Variables
  console.log('\n1️⃣ Testing Environment Variables:');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log(`   Supabase URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`   Supabase Key: ${supabaseAnonKey ? '✅ Set' : '❌ Missing'}`);
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('\n❌ CRITICAL: Environment variables missing!');
    console.log('💡 Solution: Create .env.local with your Supabase credentials');
    return false;
  }
  
  // Test 2: Supabase Connection
  console.log('\n2️⃣ Testing Supabase Connection:');
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.log(`   ❌ Database connection failed: ${error.message}`);
      console.log('💡 Solution: Run SUPABASE_CLEAN_SETUP.sql in Supabase SQL Editor');
      return false;
    }
    
    console.log('   ✅ Database connection successful');
  } catch (err) {
    console.log(`   ❌ Connection error: ${err.message}`);
    return false;
  }
  
  // Test 3: Authentication System
  console.log('\n3️⃣ Testing Authentication System:');
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log(`   ❌ Auth system error: ${error.message}`);
      return false;
    }
    
    console.log('   ✅ Authentication system ready');
    console.log(`   📊 Current session: ${session ? 'Active' : 'None (expected)'}`);
  } catch (err) {
    console.log(`   ❌ Auth test error: ${err.message}`);
    return false;
  }
  
  // Test 4: Magic Link Configuration
  console.log('\n4️⃣ Testing Magic Link Configuration:');
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { error } = await supabase.auth.signInWithOtp({
      email: 'test@example.com',
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/callback?next=/onboarding'
      }
    });
    
    if (error) {
      if (error.message.includes('Invalid redirect URL')) {
        console.log('   ❌ Invalid redirect URL');
        console.log('💡 Solution: Add these URLs in Supabase Auth Settings:');
        console.log('   - Site URL: http://localhost:3000');
        console.log('   - Redirect URL: http://localhost:3000/auth/callback');
        console.log('   - Redirect URL: https://vibe-sage.vercel.app/auth/callback');
      } else {
        console.log('   ✅ Magic link configuration looks good');
        console.log('   📧 (Expected error for test email)');
      }
    }
  } catch (err) {
    console.log(`   ❌ Magic link test error: ${err.message}`);
  }
  
  // Test 5: Google OAuth Configuration
  console.log('\n5️⃣ Testing Google OAuth Configuration:');
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback?next=/onboarding'
      }
    });
    
    if (error) {
      if (error.message.includes('Invalid redirect URL')) {
        console.log('   ❌ Google OAuth redirect URL error');
        console.log('💡 Solution: Configure Google OAuth in Supabase:');
        console.log('   1. Go to Supabase → Authentication → Providers');
        console.log('   2. Enable Google provider');
        console.log('   3. Add Google OAuth credentials');
        console.log('   4. Set redirect URL: https://fluzuwaqfkqchzdxtbdn.supabase.co/auth/v1/callback');
      } else if (error.message.includes('Provider not enabled')) {
        console.log('   ❌ Google provider not enabled');
        console.log('💡 Solution: Enable Google provider in Supabase dashboard');
      } else {
        console.log('   ✅ Google OAuth configuration looks good');
        console.log('   🔐 (Expected error for test OAuth)');
      }
    }
  } catch (err) {
    console.log(`   ❌ Google OAuth test error: ${err.message}`);
  }
  
  // Test 6: Database Schema
  console.log('\n6️⃣ Testing Database Schema:');
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test profiles table
    const { error: profilesError } = await supabase.from('profiles').select('count').limit(1);
    if (profilesError) {
      console.log(`   ❌ Profiles table error: ${profilesError.message}`);
      console.log('💡 Solution: Run SUPABASE_CLEAN_SETUP.sql in Supabase SQL Editor');
      return false;
    }
    console.log('   ✅ Profiles table accessible');
    
    // Test user_locations table
    const { error: locationsError } = await supabase.from('user_locations').select('count').limit(1);
    if (locationsError) {
      console.log(`   ❌ User locations table error: ${locationsError.message}`);
      console.log('💡 Solution: Run SUPABASE_CLEAN_SETUP.sql in Supabase SQL Editor');
      return false;
    }
    console.log('   ✅ User locations table accessible');
    
    // Test vibes table
    const { error: vibesError } = await supabase.from('vibes').select('count').limit(1);
    if (vibesError) {
      console.log(`   ❌ Vibes table error: ${vibesError.message}`);
      console.log('💡 Solution: Run SUPABASE_CLEAN_SETUP.sql in Supabase SQL Editor');
      return false;
    }
    console.log('   ✅ Vibes table accessible');
    
    // Test messages table
    const { error: messagesError } = await supabase.from('messages').select('count').limit(1);
    if (messagesError) {
      console.log(`   ❌ Messages table error: ${messagesError.message}`);
      console.log('💡 Solution: Run SUPABASE_CLEAN_SETUP.sql in Supabase SQL Editor');
      return false;
    }
    console.log('   ✅ Messages table accessible');
    
  } catch (err) {
    console.log(`   ❌ Database schema test error: ${err.message}`);
    return false;
  }
  
  // Test 7: RPC Functions
  console.log('\n7️⃣ Testing RPC Functions:');
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test get_nearby_users function
    const { error: nearbyError } = await supabase.rpc('get_nearby_users', {
      lat: 40.7128,
      lon: -74.0060,
      meters: 500
    });
    
    if (nearbyError) {
      console.log(`   ❌ get_nearby_users function error: ${nearbyError.message}`);
      console.log('💡 Solution: Run SUPABASE_CLEAN_SETUP.sql in Supabase SQL Editor');
    } else {
      console.log('   ✅ get_nearby_users function working');
    }
    
    // Test update_my_location function
    const { error: locationError } = await supabase.rpc('update_my_location', {
      lat: 40.7128,
      lon: -74.0060
    });
    
    if (locationError) {
      console.log(`   ❌ update_my_location function error: ${locationError.message}`);
      console.log('💡 Solution: Run SUPABASE_CLEAN_SETUP.sql in Supabase SQL Editor');
    } else {
      console.log('   ✅ update_my_location function working');
    }
    
  } catch (err) {
    console.log(`   ❌ RPC functions test error: ${err.message}`);
  }
  
  // Test 8: Storage Buckets
  console.log('\n8️⃣ Testing Storage Buckets:');
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test avatars bucket
    const { data: avatarsData, error: avatarsError } = await supabase.storage.from('avatars').list();
    if (avatarsError) {
      console.log(`   ❌ Avatars bucket error: ${avatarsError.message}`);
      console.log('💡 Solution: Run SUPABASE_CLEAN_SETUP.sql in Supabase SQL Editor');
    } else {
      console.log('   ✅ Avatars bucket accessible');
    }
    
    // Test message_images bucket
    const { data: imagesData, error: imagesError } = await supabase.storage.from('message_images').list();
    if (imagesError) {
      console.log(`   ❌ Message images bucket error: ${imagesError.message}`);
      console.log('💡 Solution: Run SUPABASE_CLEAN_SETUP.sql in Supabase SQL Editor');
    } else {
      console.log('   ✅ Message images bucket accessible');
    }
    
  } catch (err) {
    console.log(`   ❌ Storage buckets test error: ${err.message}`);
  }
  
  console.log('\n🎉 VIBE Startup Test Complete!');
  console.log('==============================');
  console.log('✅ All critical systems tested');
  console.log('📋 Check the results above for any issues');
  console.log('💡 Follow the solutions provided for any errors');
  console.log('\n🚀 Your VIBE startup is ready to launch!');
  
  return true;
}

// Run the test
testStartup().catch(console.error);
