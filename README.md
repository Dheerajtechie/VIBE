# VIBE - Feel the Moment

A real-time location-based social app built with Next.js, Supabase, and React. Connect with people nearby and start meaningful conversations.

## 🚀 Features

- **Real-time Location Sharing** - Discover people within 500m radius
- **Instant Messaging** - Chat with matched users in real-time
- **Magic Link Authentication** - Secure, passwordless login
- **Interactive Maps** - Visualize nearby users with Leaflet maps
- **Status Updates** - Share your current vibe with others
- **Image Sharing** - Send photos in conversations
- **Progressive Web App** - Install on mobile devices

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Maps**: Leaflet with OpenStreetMap
- **Deployment**: Vercel
- **Database**: PostgreSQL with PostGIS for location data

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd vibe
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp ENV.sample .env.local
   ```
   
   Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
   NEXT_PUBLIC_MAP_ATTRIBUTION=&copy; OpenStreetMap contributors
   ```

4. **Set up the database**
   - Go to your Supabase project
   - Run the SQL from `DATABASE_SETUP.sql` in the SQL Editor
   - This will create all necessary tables, functions, and policies

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 How to Use

1. **Sign In** - Enter your email to receive a magic link
2. **Onboarding** - Set your name and upload a profile picture
3. **Discover** - See people nearby on the map or in the discovery feed
4. **Send Vibes** - Tap "Send Vibe" to connect with someone
5. **Chat** - When you both send vibes, you'll be matched and can chat!

## 🗄️ Database Schema

The app uses PostgreSQL with PostGIS for location-based features:

- **profiles** - User profile information
- **user_locations** - Real-time location data with PostGIS
- **presence** - Online status tracking
- **vibes** - Connection requests between users
- **conversations** - Chat rooms
- **messages** - Chat messages with text and images

## 🚀 Deployment

### Deploy to Vercel

1. **Connect to GitHub**
   - Push your code to GitHub
   - Connect your repository to Vercel

2. **Configure Environment Variables**
   In Vercel dashboard, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_MAP_TILE_URL`
   - `NEXT_PUBLIC_MAP_ATTRIBUTION`

3. **Deploy**
   - Vercel will automatically deploy on every push to main branch

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🔧 Configuration

### Supabase Setup

1. Create a new Supabase project
2. Enable the following extensions:
   - PostGIS
   - pgcrypto
3. Run the database setup script
4. Configure storage buckets for avatars and message images
5. Set up Row Level Security policies

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `NEXT_PUBLIC_MAP_TILE_URL` | Map tile server URL | No |
| `NEXT_PUBLIC_MAP_ATTRIBUTION` | Map attribution text | No |

## 📱 PWA Features

The app is a Progressive Web App with:
- Service Worker for offline functionality
- Web App Manifest for installation
- Responsive design for mobile devices
- Push notifications (coming soon)

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- User authentication via Supabase Auth
- Location data is encrypted and secured
- File uploads are validated and compressed
- Rate limiting on vibe sending

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:
1. Check the console for errors
2. Verify your environment variables
3. Ensure the database is properly set up
4. Check Supabase logs for backend issues

## 🎯 Roadmap

- [ ] Push notifications
- [ ] Video chat integration
- [ ] Group conversations
- [ ] Advanced filtering
- [ ] User verification
- [ ] Moderation tools

---

**Built with ❤️ using Next.js, Supabase, and modern web technologies.**