# VIBE - Production Setup Guide

## Quick Start

1. **Set up Supabase Project**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Copy your project URL and anon key
   - Update `.env.local` with your credentials

2. **Configure Environment**
   - Edit `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Set up Database**
   - In Supabase dashboard, go to SQL Editor
   - Run the SQL from `supabase/schema.sql`

4. **Run the Application**
   ```bash
   npm run dev
   ```

## Production Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production
```
NEXT_PUBLIC_SUPABASE_URL=your_production_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
NEXT_PUBLIC_MAP_ATTRIBUTION=&copy; OpenStreetMap contributors
```

## Features
- ✅ Magic link authentication
- ✅ Real-time location sharing
- ✅ Nearby user discovery
- ✅ Vibe sending system
- ✅ Real-time chat
- ✅ Image sharing
- ✅ PWA support
- ✅ Responsive design

## Tech Stack
- Next.js 16
- React 19
- Supabase (Auth + Database + Storage)
- Tailwind CSS
- TypeScript
- Leaflet (Maps)
- Zustand (State management)
- Framer Motion (Animations)
