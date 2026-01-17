# Siteground WordPress Automation Setup Guide

## Overview
This guide explains how to set up **fully automated WordPress site creation** on Siteground using GitHub Actions and SSH.

## Architecture

```
ContentFlow App → Netlify Function → GitHub Actions API → Siteground SSH → WordPress Installed
```

---

## Prerequisites

### 1. Siteground Account Setup

#### A. Enable SSH Access
1. Log into Siteground → **Site Tools**
2. Go to **Dev** → **SSH Keys Manager**
3. Click **Generate New Key**
4. Download the private key file (`id_rsa`)
5. Note your SSH credentials:
   - **Host**: `your-account.siteground.com`
   - **Port**: `18765` (default)
   - **Username**: Your Siteground username

#### B. Get Database Credentials
1. In Site Tools → **MySQL** → **MySQL Manager**
2. Note your MySQL username and password
3. These will be used to create databases for new sites

### 2. GitHub Repository Setup

#### A. Add SSH Key as Secret
1. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add these secrets:

```
SITEGROUND_SSH_KEY = [paste contents of id_rsa file]
SITEGROUND_HOST = your-account.siteground.com
SITEGROUND_USER = your_ssh_username
SITEGROUND_DB_USER = your_mysql_username
SITEGROUND_DB_PASS = your_mysql_password
CONTENTFLOW_API_KEY = [generate a random secure key]
```

#### B. Generate Personal Access Token (PAT)
1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **Generate new token (classic)**
3. Select scopes:
   - ✅ `workflow` (to trigger GitHub Actions)
   - ✅ `repo` (full control of repositories)
4. Copy the token (you won't see it again!)
5. Save as `GITHUB_PAT` in your Netlify environment variables

### 3. Netlify Environment Variables

Add these to Netlify → **Site settings** → **Environment variables**:

```
GITHUB_PAT = your_personal_access_token
GITHUB_REPO_OWNER = your_github_username
GITHUB_REPO_NAME = content-flow
CONTENTFLOW_API_KEY = [same as GitHub secret]
```

---

## How It Works

### Step 1: User Validates Niche
```javascript
// In ContentFlow app
1. User enters niche → "hydrogen water"
2. AI validates niche → Score: 85
3. User clicks "Create Blog for This Niche"
```

### Step 2: Domain Selection
```javascript
4. AI generates domain suggestions
5. User selects domain → "hydrowaterguide.com"
6. User configures:
   - Admin email
   - Theme (GeneratePress)
   - Initial articles (10)
   - Auto-affiliate (Yes)
```

### Step 3: Trigger GitHub Actions
```javascript
7. ContentFlow API calls:
   POST /api/trigger-site-deployment
   {
     domain: "hydrowaterguide.com",
     niche_keyword: "hydrogen water",
     site_title: "Hydrogen Water Guide",
     admin_email: "user@example.com",
     theme: "generatepress",
     content_count: 10
   }

8. Netlify function triggers GitHub Actions workflow
```

### Step 4: GitHub Actions Deploys Site
```bash
9. GitHub Actions workflow runs:
   ✅ Create MySQL database
   ✅ Download WordPress
   ✅ Configure wp-config.php
   ✅ Install WordPress via WP-CLI
   ✅ Install theme (GeneratePress)
   ✅ Install plugins (Yoast, TablePress, Pretty Links, etc.)
   ✅ Create pages (About, Privacy, Terms, Cookie Policy, etc.)
   ✅ Configure GDPR cookie consent
   ✅ Setup contact form
```

### Step 5: Notify ContentFlow
```javascript
10. GitHub Actions calls back:
    POST /api/site-deployment-complete
    {
      domain: "hydrowaterguide.com",
      status: "success",
      wp_admin_url: "https://hydrowaterguide.com/wp-admin",
      admin_username: "admin",
      admin_password: "[generated password]"
    }

11. ContentFlow saves credentials and shows success
12. User can now log into WordPress
```

---

## Complete Workflow Timeline

| Step | Action | Time | Automated? |
|------|--------|------|------------|
| 1 | Niche validation | ~30s | ✅ Yes |
| 2 | Domain suggestions | ~3s | ✅ Yes |
| 3 | User selects domain | ~1m | ❌ Manual |
| 4 | Register domain | ~2m | ⚠️ Manual* |
| 5 | Point DNS to Siteground | ~5m | ⚠️ Manual* |
| 6 | Trigger GitHub Actions | instant | ✅ Yes |
| 7 | Create database | ~10s | ✅ Yes |
| 8 | Install WordPress | ~30s | ✅ Yes |
| 9 | Install theme & plugins | ~1m | ✅ Yes |
| 10 | Create pages | ~30s | ✅ Yes |
| 11 | Generate initial articles | ~5m | ✅ Yes** |
| 12 | Apply to affiliate programs | ~10m | ✅ Yes** |
| 13 | Site ready! | - | ✅ Yes |

**Total automation time: ~8 minutes** (excluding manual domain registration)

\* Domain registration can be automated via APIs like Namecheap/GoDaddy
\** To be implemented in next phase

---

## Security Considerations

### SSH Key Security
- ✅ Private key stored as GitHub secret (encrypted)
- ✅ Never exposed in logs
- ✅ Automatic cleanup after deployment
- ✅ Limited to specific Siteground account

### Database Security
- ✅ Unique database name per site
- ✅ Unique database user per site
- ✅ Randomly generated passwords (24 chars)
- ✅ MySQL user has access only to their database

### WordPress Security
- ✅ Strong admin passwords (32 chars with special chars)
- ✅ Wordfence security plugin installed
- ✅ Proper file permissions (755 for dirs, 644 for files)
- ✅ WordPress salts generated from API
- ✅ Admin credentials sent via encrypted channel

---

## Cost Analysis

### Using GitHub Actions + Siteground

| Component | Cost | Notes |
|-----------|------|-------|
| **GitHub Actions** | Free | 2,000 minutes/month free tier |
| **Siteground Hosting** | $4.99-24.99/mo | Unlimited sites on GrowBig+ |
| **Domain Registration** | ~$12.99/year | Namecheap/GoDaddy |
| **SSL Certificate** | Free | Let's Encrypt (via Siteground) |
| **Total per site** | ~$13/year | (After initial Siteground plan) |

### GitHub Actions Usage
Each deployment uses approximately:
- **Time**: ~8 minutes
- **Billable minutes**: 8 (on free tier, 2,000/month available)
- **Sites per month**: Up to 250 sites (within free tier)

---

## Next Phase: Content & Affiliate Automation

### Article Auto-Generation & Scheduling
```javascript
// To be implemented
POST /api/generate-article
{
  site_id: "hydrowaterguide_com",
  article_index: 1,
  content_strategy: validation.content_strategy.first_20_articles[0]
}

// Scheduled via cron or GitHub Actions
- Generate article using AI
- Add affiliate links automatically
- Schedule post for publication
- Repeat daily/weekly per schedule
```

### Affiliate Program Automation
```javascript
// To be implemented
POST /api/apply-to-affiliates
{
  site_id: "hydrowaterguide_com",
  programs: validation.affiliate_programs.recommended_programs
}

// For each program:
1. Generate personalized application email
2. Send via user's email (or auto-send if authorized)
3. Track application status
4. Get affiliate links when approved
5. Auto-update content with affiliate links
```

### Affiliate Link Automation
```javascript
// To be implemented
- Store affiliate links in database
- Auto-replace product mentions with affiliate links
- Track clicks and conversions
- Generate affiliate link reports
```

---

## Troubleshooting

### SSH Connection Fails
```bash
# Test SSH connection manually:
ssh -i ~/.ssh/id_rsa -p 18765 username@host.siteground.com

# Check key permissions:
chmod 600 ~/.ssh/id_rsa

# Verify host in known_hosts:
ssh-keyscan -p 18765 host.siteground.com >> ~/.ssh/known_hosts
```

### WordPress Installation Fails
```bash
# Check if directory exists:
ls -la /home/username/public_html/domain.com

# Check database:
mysql -u username -p -e "SHOW DATABASES;"

# Check WP-CLI:
./wp-cli.phar --info
```

### Workflow Doesn't Trigger
- Verify `GITHUB_PAT` has correct permissions
- Check Netlify function logs for errors
- Ensure GitHub Actions is enabled in repo settings
- Verify all secrets are set correctly

---

## Manual Fallback

If automation fails, you can still use the guided setup:
1. ContentFlow generates all content and configs
2. User downloads setup package
3. User follows step-by-step checklist
4. Manual setup takes ~20 minutes vs 8 minutes automated

---

## Future Enhancements

1. **Domain Registration API Integration**
   - Namecheap API for auto-registration
   - Auto-configure DNS settings
   - Truly hands-off domain setup

2. **Email Automation**
   - SendGrid/Mailgun integration
   - Auto-send affiliate applications
   - Track responses and approvals

3. **Content Pipeline**
   - Queue-based article generation
   - Scheduled publishing (daily/weekly)
   - Auto-optimization based on performance

4. **Analytics Integration**
   - Auto-setup Google Analytics
   - Auto-setup Google Search Console
   - Track site performance

5. **Backup & Monitoring**
   - Automated daily backups
   - Uptime monitoring
   - Performance alerts

---

## Support

For issues with:
- **Siteground SSH**: Contact Siteground support
- **GitHub Actions**: Check workflow logs in Actions tab
- **ContentFlow App**: Check Netlify function logs

---

## Summary

This automation system reduces WordPress site setup from **20+ hours** to **8 minutes**, while creating a professional, GDPR-compliant affiliate site with:

✅ Legal pages (Privacy, Terms, Cookie Policy)
✅ GDPR cookie consent
✅ SEO optimization (Yoast)
✅ Contact form
✅ Security (Wordfence)
✅ Affiliate disclosure
✅ Ready for content

**Cost: $0 extra** (uses existing Siteground plan + free GitHub Actions tier)
