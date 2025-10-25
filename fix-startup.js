#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 VIBE Startup - Complete Fix Script');
console.log('====================================');

async function fixStartup() {
  try {
    // Step 1: Check if we're in the right directory
    console.log('\n1️⃣ Checking project structure...');
    if (!fs.existsSync('package.json')) {
      console.log('❌ Not in VIBE project directory');
      console.log('💡 Solution: Run this script from the vibe directory');
      return false;
    }
    console.log('✅ Project structure correct');
    
    // Step 2: Check environment variables
    console.log('\n2️⃣ Checking environment variables...');
    const envPath = path.join(__dirname, '.env.local');
    if (!fs.existsSync(envPath)) {
      console.log('❌ .env.local not found');
      console.log('💡 Solution: Create .env.local with your Supabase credentials');
      console.log('   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
      console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
      return false;
    }
    console.log('✅ Environment file exists');
    
    // Step 3: Install dependencies
    console.log('\n3️⃣ Installing dependencies...');
    try {
      execSync('npm install', { stdio: 'inherit' });
      console.log('✅ Dependencies installed');
    } catch (error) {
      console.log('❌ Failed to install dependencies');
      console.log('💡 Solution: Check your internet connection and try again');
      return false;
    }
    
    // Step 4: Run linting
    console.log('\n4️⃣ Running linting...');
    try {
      execSync('npm run lint', { stdio: 'inherit' });
      console.log('✅ Linting passed');
    } catch (error) {
      console.log('⚠️  Linting issues found, but continuing...');
    }
    
    // Step 5: Test build
    console.log('\n5️⃣ Testing build...');
    try {
      execSync('npm run build', { stdio: 'inherit' });
      console.log('✅ Build successful');
    } catch (error) {
      console.log('❌ Build failed');
      console.log('💡 Solution: Check for TypeScript errors and fix them');
      return false;
    }
    
    // Step 6: Run startup test
    console.log('\n6️⃣ Running startup test...');
    try {
      execSync('node test-startup.js', { stdio: 'inherit' });
      console.log('✅ Startup test completed');
    } catch (error) {
      console.log('⚠️  Startup test had issues, but continuing...');
    }
    
    // Step 7: Start development server
    console.log('\n7️⃣ Starting development server...');
    console.log('🚀 Development server starting...');
    console.log('📱 Visit: http://localhost:3000');
    console.log('🔐 Test sign-in at: http://localhost:3000/signin');
    console.log('📧 Test magic link and Google authentication');
    
    // Start the dev server
    execSync('npm run dev', { stdio: 'inherit' });
    
  } catch (error) {
    console.log(`❌ Fix startup error: ${error.message}`);
    return false;
  }
}

// Run the fix
fixStartup().catch(console.error);
