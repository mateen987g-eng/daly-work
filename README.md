# RecordFlow — Professional Daily & Professional Record Manager

A modern, professional SaaS application for managing both daily personal records and professional work records with cloud sync, secure storage, and powerful analytics.

## 🚀 Features

- **Dual Record Types**: Manage both daily personal records and professional work records
- **Cloud Sync**: Automatic synchronization across all devices
- **Secure Storage**: Enterprise-grade security with encryption
- **Smart Analytics**: Track progress with detailed insights
- **Advanced Search**: Find records instantly with powerful filters
- **Export/Import**: Export data in CSV/JSON formats
- **Modern UI**: Beautiful, responsive design with professional aesthetics

## 📋 Setup Instructions

### 1) Database Schema Setup

- Open your Supabase dashboard → SQL Editor
- Run the migration script: `migrations/001_create_schema.sql`
- This creates the `profiles` and `records` tables with RLS policies

### 2) Supabase Configuration

The project is already configured with your Supabase credentials:

- **Supabase URL**: `https://zapwmvochpxzbshvyvow.supabase.co`
- **Anon Key**: Configured in `supabaseClient.js`

Configuration is in `supabaseClient.js`:
```javascript
export const SUPABASE_URL = 'https://zapwmvochpxzbshvyvow.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_2BYuBh9ERCMLF0RT0jkPBQ_9_0RI-1E';
```

### 3) Test the Application

1. Open `index.html` in your browser
2. Click "Get Started" or "Login"
3. Create an account or sign in
4. Start managing your records!

## 📁 Project Structure

```
├── index.html          # Professional landing page
├── login.html          # Beautiful login page
├── signup.html         # Modern signup page
├── dashboard.html      # Main dashboard with record management
├── supabaseClient.js   # Supabase client configuration
├── script.js           # Main application logic
├── dashboard.js        # Dashboard initialization
├── styles.css          # Professional styling
└── migrations/         # Database schema migrations
```

## 🔒 Security Notes

- RLS (Row Level Security) policies are included in the migration
- Anon key is safe for client-side use (public key)
- Never expose your `service_role` key
- For production, consider using environment variables

## 🛠️ Troubleshooting

- **"Failed to fetch" error**: Check your internet connection and Supabase project status
- **Permission errors**: Ensure RLS policies are applied in Supabase dashboard
- **Email not confirmed**: Check Supabase Auth settings for email confirmation requirements

## 📝 Database Schema

- **profiles**: User profile information
- **records**: Daily and professional records with categories and status tracking

## 🎨 Design Features

- Modern gradient designs
- Responsive layout for all devices
- Professional testimonials section
- Trust indicators
- Feature showcase
- Pricing section

## 🚀 Deployment

For static hosting (Vercel, Netlify, GitHub Pages):
- Simply upload all files
- No build step required
- Works out of the box!

For server-side deployment:
- Add Supabase keys as environment variables
- Configure CORS in Supabase dashboard if needed
