# Fix Supabase CORS Error - Step by Step

## ⚠️ IMPORTANT: CORS Cannot Be Fixed with SQL

The CORS error you're seeing **must be fixed through the Supabase Dashboard UI**. SQL scripts cannot modify authentication/CORS settings.

---

## 🔧 How to Fix (5 Minutes)

### **Step 1: Go to Supabase Dashboard**
1. Visit: https://app.supabase.com
2. Login with your account
3. Select your project: `gjfjacoshfakyuluemza`

### **Step 2: Update Authentication Settings**

#### Option A: Using Authentication Settings (Recommended)
1. Click **Authentication** in left sidebar
2. Click **URL Configuration**
3. Update these fields:

   **Site URL:**
   ```
   https://getseowizard.com
   ```

   **Redirect URLs:** (add all of these, one per line)
   ```
   https://getseowizard.com
   https://getseowizard.com/*
   https://www.getseowizard.com
   https://www.getseowizard.com/*
   http://localhost:3000
   http://localhost:3000/*
   ```

4. Click **Save**

#### Option B: Using Project Settings (Alternative)
1. Click **Settings** (gear icon) in left sidebar
2. Click **API**
3. Scroll to **CORS Settings** or **Allowed Origins**
4. Add:
   ```
   https://getseowizard.com
   https://www.getseowizard.com
   ```
5. Click **Save**

### **Step 3: Verify the Fix**

1. Wait **1-2 minutes** for changes to propagate
2. Open your site: https://getseowizard.com
3. Open browser DevTools (F12)
4. Go to **Console** tab
5. Clear console (right-click → Clear)
6. Refresh page (Ctrl+F5 or Cmd+Shift+R)
7. Check for CORS errors:
   - ✅ **FIXED**: No CORS errors appear
   - ❌ **NOT FIXED**: Still seeing CORS errors → double-check settings

---

## 🔍 What You're Seeing Now

**Current Error:**
```
Access to fetch at 'https://gjfjacoshfakyuluemza.supabase.co/auth/v1/token?grant_type=refresh_token'
from origin 'https://getseowizard.com' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**What This Means:**
- Supabase is rejecting requests from `getseowizard.com`
- Your domain is not in the allowed origins list
- Authentication cannot work until this is fixed

---

## ✅ After Fixing

You should see in the console:
```
✅ Supabase client initialized successfully
✅ User session loaded
✅ Auth state changed: SIGNED_IN
```

And **NO** CORS errors.

---

## 🧪 Optional: Verify Database Setup

While you're in Supabase, you can run this SQL verification script:

1. Go to **SQL Editor**
2. Click **New Query**
3. Paste the contents of `supabase-verify-setup.sql`
4. Click **Run**
5. Review results to ensure all tables, policies, and triggers exist

---

## 📞 Still Having Issues?

If CORS errors persist after updating settings:

1. **Clear browser cache completely**
   - Chrome: Settings → Privacy → Clear browsing data
   - Firefox: Settings → Privacy → Clear Data
   - Select "Cached images and files"

2. **Try incognito/private window**
   - This ensures no cached data interferes

3. **Check Supabase status**
   - Visit: https://status.supabase.com
   - Ensure all systems operational

4. **Verify your project URL**
   - In Supabase Settings → API
   - Confirm project URL matches what's in your code
   - Should be: `https://gjfjacoshfakyuluemza.supabase.co`

---

## 🎯 Quick Checklist

- [ ] Logged into Supabase dashboard
- [ ] Found Authentication → URL Configuration
- [ ] Set Site URL to `https://getseowizard.com`
- [ ] Added all redirect URLs listed above
- [ ] Clicked Save
- [ ] Waited 1-2 minutes
- [ ] Cleared browser cache
- [ ] Hard refreshed page (Ctrl+F5)
- [ ] Checked console - no CORS errors
- [ ] Tested login/signup - working

---

**Once CORS is fixed, all authentication features will work:**
- ✅ User signup
- ✅ User login
- ✅ Password reset
- ✅ Session management
- ✅ Blog management
- ✅ Article publishing
- ✅ Internal linking (new feature!)
