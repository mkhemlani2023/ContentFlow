# Supabase Setup Guide for ContentFlow

This guide will help you set up Supabase as the backend storage solution for ContentFlow.

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: ContentFlow
   - **Database Password**: (create a strong password and save it)
   - **Region**: Choose closest to your users
6. Click "Create new project"
7. Wait for setup to complete (~2 minutes)

## Step 2: Run the Database Schema

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy the entire contents of `supabase-schema.sql`
4. Paste into the SQL editor
5. Click **Run** or press `Ctrl/Cmd + Enter`
6. Verify success - you should see:
   - ✅ Tables created
   - ✅ Indexes created
   - ✅ RLS policies enabled
   - ✅ Triggers created

## Step 3: Configure Email Authentication

1. Go to **Authentication** → **Providers** (left sidebar)
2. Enable **Email** provider (should be on by default)
3. Configure email settings:
   - Go to **Authentication** → **Email Templates**
   - Customize confirmation email (optional)
4. Enable **Email Confirmations**:
   - Go to **Authentication** → **Settings**
   - Under "User Signups", ensure **Enable email confirmations** is checked

## Step 4: Get Your API Credentials

1. Go to **Settings** → **API** (left sidebar)
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOi...` (long string)

## Step 5: Add Environment Variables to Netlify

1. Go to your Netlify dashboard
2. Select your ContentFlow site
3. Go to **Site settings** → **Environment variables**
4. Add these variables:
   - **Name**: `SUPABASE_URL`
     - **Value**: Your Project URL from Step 4
   - **Name**: `SUPABASE_ANON_KEY`
     - **Value**: Your anon/public key from Step 4
5. Click **Save**
6. Trigger a new deploy or click **Clear cache and deploy site**

## Step 6: Create Environment Variables Script

Create a file `public/_headers` with:

```
/*
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

Create `netlify/functions/env-config.js`:

```javascript
exports.handler = async (event, context) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600'
    },
    body: `window.ENV = {
      SUPABASE_URL: '${process.env.SUPABASE_URL}',
      SUPABASE_ANON_KEY: '${process.env.SUPABASE_ANON_KEY}'
    };`
  };
};
```

Then add to your HTML `<head>`:

```html
<script src="/.netlify/functions/env-config"></script>
```

## Step 7: Verify Database Structure

In Supabase, go to **Table Editor** and verify these tables exist:
- ✅ `articles` - Stores generated articles
- ✅ `blogs` - Stores WordPress/blog configurations
- ✅ `publish_logs` - Publishing history
- ✅ `website_metrics` - Website tracking data
- ✅ `credit_transactions` - Credit usage history
- ✅ `user_profiles` - User data and credits

## Step 8: Test Authentication

1. Deploy your site to Netlify
2. Open your ContentFlow app
3. Click "Sign Up"
4. Enter email and password
5. Check your email for confirmation link
6. Click confirmation link
7. You should be logged in!

## Database Schema Overview

### Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `articles` | Stores generated articles | title, content, metadata, images |
| `blogs` | WordPress/blog configs | name, platform, url, credentials |
| `publish_logs` | Publishing history | article_id, blog_id, post_url, status |
| `website_metrics` | Website tracking | url, metrics, created_at |
| `credit_transactions` | Credit usage log | type, amount, balance_after |
| `user_profiles` | User data | email, credits, full_name |

### Row Level Security (RLS)

All tables have RLS enabled, ensuring:
- Users can only access their own data
- No user can see another user's articles, blogs, or logs
- Automatic data isolation by user ID

### Automatic Features

- **Auto Profile Creation**: When a user signs up, a profile is automatically created with 50,000 starting credits
- **Timestamps**: All tables have `created_at` and `updated_at` (where applicable)
- **UUIDs**: All primary keys use UUID v4 for security

## Troubleshooting

### "relation does not exist" Error
- Ensure you ran the entire `supabase-schema.sql` file
- Check SQL Editor for any errors
- Try refreshing the Table Editor

### Authentication Not Working
- Verify email confirmation is enabled
- Check Netlify environment variables are set
- Check browser console for errors
- Ensure anon key is correct

### RLS Preventing Access
- Make sure you're logged in
- Verify `user_id` is being set correctly
- Check RLS policies in Supabase dashboard

## Security Notes

1. **Never commit credentials**: Keep Supabase keys in environment variables only
2. **Use RLS**: All tables have Row Level Security enabled
3. **Encrypt sensitive data**: Blog credentials are base64 encoded (consider upgrading to proper encryption)
4. **Email confirmation**: Required for all new users
5. **HTTPS only**: Supabase requires HTTPS connections

## Next Steps

Once setup is complete, you can:
- ✅ Save generated articles to database
- ✅ Load articles from your library
- ✅ Store blog configurations securely
- ✅ Track publishing history
- ✅ Manage credits per user
- ✅ Multi-user support with data isolation

## Support

If you encounter issues:
1. Check Supabase logs: **Database** → **Logs**
2. Check Network tab in browser DevTools
3. Verify environment variables in Netlify
4. Review SQL schema was applied correctly
