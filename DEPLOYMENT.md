# VIBE - Deployment Guide

## 🚀 Quick Deployment to Vercel (Recommended)

### Prerequisites
1. GitHub account
2. Vercel account
3. Supabase project set up

### Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/vibe.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://fluzuwaqfkqchzdxtbdn.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
     NEXT_PUBLIC_MAP_ATTRIBUTION=&copy; OpenStreetMap contributors
     ```
   - Click "Deploy"

3. **Set up Supabase Database**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `DATABASE_SETUP.sql`
   - Run the script

## 🔧 Manual Deployment

### Build for Production
```bash
npm run build:prod
```

### Run Locally
```bash
npm start
```

### Environment Variables
Make sure these are set in your deployment environment:

```env
NEXT_PUBLIC_SUPABASE_URL=https://fluzuwaqfkqchzdxtbdn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsdXp1d2FxZmtxY2h6ZHh0YmRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyMTczNDAsImV4cCI6MjA3Njc5MzM0MH0.T0xQBkbwIOQMxH_ZYqbeRgdlYezyKymNWHKfQIasmS4
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
NEXT_PUBLIC_MAP_ATTRIBUTION=&copy; OpenStreetMap contributors
```

## 📱 PWA Configuration

The app is already configured as a PWA with:
- Service worker for offline functionality
- Web app manifest for installability
- Responsive design for mobile devices

## 🔐 Security Features

- Row Level Security (RLS) enabled on all tables
- User authentication via Supabase Auth
- Secure file uploads to Supabase Storage
- Location-based access controls

## 🎯 Features Included

- ✅ Magic link authentication
- ✅ Real-time location sharing
- ✅ Nearby user discovery
- ✅ Vibe sending system (20 per day limit)
- ✅ Real-time chat with proximity requirements
- ✅ Image sharing in messages
- ✅ PWA support for mobile installation
- ✅ Responsive design
- ✅ Dark mode support

## 🚨 Important Notes

1. **Database Setup**: Make sure to run the `DATABASE_SETUP.sql` script in your Supabase project
2. **Location Permissions**: Users will need to grant location access for the app to work
3. **Proximity Requirements**: Messages can only be sent when users are within 1000m of each other
4. **Daily Limits**: Users can send up to 20 vibes per day
5. **Real-time Updates**: The app uses Supabase real-time subscriptions for live updates

## 🔍 Testing

1. Open the deployed app
2. Sign up with a test email
3. Complete onboarding
4. Grant location permissions
5. Test the discovery and vibe features

## 📞 Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify environment variables are set correctly
3. Ensure the database schema is applied
4. Check Supabase project settings
