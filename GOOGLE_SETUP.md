# Google OAuth Setup for Bakery Bliss

This guide will help you set up Google OAuth authentication in your Supabase project to enable Gmail sign-up functionality.

## Prerequisites

- A Supabase project
- A Google Cloud Console project
- Admin access to your Supabase project

## Step 1: Google Cloud Console Setup

### 1.1 Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (if not already enabled)

### 1.2 Configure OAuth Consent Screen
1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: "Bakery Bliss"
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
5. Add test users (your email for testing)

### 1.3 Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback`
   - `http://localhost:54321/auth/v1/callback` (for local development)
5. Copy the Client ID and Client Secret

## Step 2: Supabase Configuration

### 2.1 Enable Google Provider
1. Go to your Supabase project dashboard
2. Navigate to "Authentication" > "Providers"
3. Find "Google" and click "Enable"
4. Enter the credentials from Google Cloud Console:
   - Client ID: Your Google OAuth Client ID
   - Client Secret: Your Google OAuth Client Secret
5. Save the configuration

### 2.2 Configure Redirect URLs
1. In Supabase, go to "Authentication" > "URL Configuration"
2. Set your site URL (e.g., `http://localhost:3000` for development)
3. Add redirect URLs:
   - `http://localhost:3000/redirect` (for development)
   - `https://yourdomain.com/redirect` (for production)

## Step 3: Environment Variables

Make sure your `.env` file contains:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 4: Testing

1. Start your development server
2. Go to the login or signup page
3. Click "Continue with Google"
4. You should be redirected to Google's OAuth consent screen
5. After authorization, you'll be redirected back to your app

## Troubleshooting

### Common Issues:

1. **"Invalid redirect URI" error**
   - Check that your redirect URIs in Google Cloud Console match exactly
   - Ensure Supabase redirect URLs are configured correctly

2. **"OAuth consent screen not configured"**
   - Make sure you've completed the OAuth consent screen setup
   - Add your email as a test user

3. **"Provider not enabled"**
   - Verify Google provider is enabled in Supabase
   - Check that Client ID and Secret are correct

### Debug Steps:

1. Check browser console for error messages
2. Verify Supabase logs in the dashboard
3. Ensure all environment variables are set correctly
4. Test with a fresh incognito/private browser window

## Security Notes

- Never commit your Google Client Secret to version control
- Use environment variables for sensitive configuration
- Regularly rotate your OAuth credentials
- Monitor your OAuth usage in Google Cloud Console

## Support

If you encounter issues:
1. Check Supabase documentation on OAuth providers
2. Review Google Cloud Console error logs
3. Verify your redirect URI configurations
4. Test with the provided debugging console logs

---

**Note**: This setup enables users to sign up and log in using their Google accounts. The system will automatically create customer profiles for new Google users and redirect them appropriately based on their role.

