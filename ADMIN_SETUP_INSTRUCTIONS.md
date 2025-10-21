# Admin Setup Instructions

## Quick Setup (3 Steps)

### Step 1: Run User Roles Setup
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the contents of `setup-user-roles.sql`
5. Click **Run** (or press Ctrl/Cmd + Enter)
6. Wait for success confirmation

### Step 2: Set Your Account as Admin
1. Still in **SQL Editor**, click **New Query** again
2. Copy and paste the contents of `set-mahesh-as-admin.sql`
3. Click **Run**
4. You should see your profile with:
   - email: mahesh.khemlani@gmail.com
   - role: admin
   - subscription_tier: unlimited
   - credits: 999999

### Step 3: Refresh Your Session
1. Go to ContentFlow (www.getseowizard.com)
2. **Log out** completely
3. **Log back in** with mahesh.khemlani@gmail.com
4. Your credits should now show **999,999**
5. All features will work without deducting credits

---

## User Role System

### Roles
- **paid_user** (default) - Normal customers who purchase credits
- **admin** - Platform administrators with unlimited access

### Subscription Tiers
- **starter** (default) - Pay-per-use credits, basic features
- **professional** - Better rates, more features
- **enterprise** - Bulk discounts, priority support
- **unlimited** - Admin/testing tier with infinite credits

---

## How Admin Mode Works

When you're logged in as admin:
1. ✅ Credit checks are bypassed (see index.html line 1065, 1296, 1307)
2. ✅ You get 999,999 credits (essentially unlimited)
3. ✅ No charges for any operations
4. ✅ Full access to all features for testing

The frontend code checks:
```javascript
if (userProfile.role === 'admin') {
    console.log('Admin user - unlimited credits enabled');
}
```

---

## Troubleshooting

### "UPDATE returned 0 rows"
- Your email might not exist in user_profiles yet
- Solution: Sign up first at www.getseowizard.com, then run the SQL

### "Column role does not exist"
- You need to run `setup-user-roles.sql` first
- This adds the role, subscription_tier, and subscription_status columns

### Credits still showing 0
- Log out completely and log back in
- Check browser console for "Admin user - unlimited credits enabled"
- Clear browser cache if needed

### Still deducting credits
- Verify your email in the database matches exactly: mahesh.khemlani@gmail.com
- Check SQL query result to confirm role = 'admin'
- Make sure you're logged in with the correct account

---

## Reverting to Normal User

If you want to test as a normal paid user:
```sql
UPDATE user_profiles
SET
    role = 'paid_user',
    subscription_tier = 'starter',
    credits = 1000
WHERE email = 'mahesh.khemlani@gmail.com';
```

Then log out and log back in.

---

## Next Steps After Setup

Once you're admin:
1. ✅ Test keyword research (should not deduct credits)
2. ✅ Test article generation (unlimited access)
3. ✅ Add WordPress blog for autopost testing
4. ✅ Test article publishing workflow
5. ✅ Test all features without worry about credits
