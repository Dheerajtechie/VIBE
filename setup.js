#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 VIBE Setup Script');
console.log('==================');

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('❌ .env.local not found. Please create it first.');
  process.exit(1);
}

// Read current .env.local
const envContent = fs.readFileSync(envPath, 'utf8');
console.log('📝 Current environment configuration:');
console.log('------------------------------------');

const lines = envContent.split('\n');
lines.forEach(line => {
  if (line.trim() && !line.startsWith('#')) {
    const [key] = line.split('=');
    if (key) {
      console.log(`✅ ${key}: ${line.includes('=') && line.split('=')[1] ? 'Set' : 'Not set'}`);
    }
  }
});

console.log('\n🔧 Setup Checklist:');
console.log('===================');
console.log('1. Create a Supabase project at https://supabase.com');
console.log('2. Copy your project URL and anon key');
console.log('3. Update .env.local with your credentials');
console.log('4. Run the database schema in Supabase SQL Editor');
console.log('5. Run: npm run dev');
console.log('\n📚 For detailed instructions, see SETUP.md');

// Check if all required env vars are set
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

const missingVars = requiredVars.filter(varName => {
  const line = lines.find(l => l.startsWith(varName));
  return !line || !line.split('=')[1] || line.split('=')[1].trim() === '';
});

if (missingVars.length === 0) {
  console.log('\n🎉 All required environment variables are set!');
  console.log('You can now run: npm run dev');
} else {
  console.log('\n⚠️  Missing required environment variables:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
}
