#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building VIBE for Production');
console.log('===============================');

// Check if .env.local exists and has required variables
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local not found. Please create it with your Supabase credentials.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

const missingVars = requiredVars.filter(varName => {
  const line = envContent.split('\n').find(l => l.startsWith(varName));
  return !line || !line.split('=')[1] || line.split('=')[1].trim() === '';
});

if (missingVars.length > 0) {
  console.log('❌ Missing required environment variables:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\nPlease update your .env.local file with the required variables.');
  process.exit(1);
}

console.log('✅ Environment variables configured');

// Run linting
console.log('\n🔍 Running linter...');
try {
  execSync('npm run lint', { stdio: 'inherit' });
  console.log('✅ Linting passed');
} catch (error) {
  console.log('⚠️  Linting issues found, but continuing with build...');
}

// Build the application
console.log('\n🏗️  Building application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.log('❌ Build failed');
  process.exit(1);
}

// Check build output
const buildDir = path.join(__dirname, '.next');
if (fs.existsSync(buildDir)) {
  console.log('✅ Build artifacts created');
} else {
  console.log('❌ Build artifacts not found');
  process.exit(1);
}

console.log('\n🎉 Production build completed successfully!');
console.log('\nNext steps:');
console.log('1. Deploy to Vercel: vercel --prod');
console.log('2. Or run locally: npm start');
console.log('3. Make sure to set environment variables in your deployment platform');
