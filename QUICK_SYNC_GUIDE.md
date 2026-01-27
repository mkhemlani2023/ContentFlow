# Quick Sync Guide - Get ContentFlow Running on Your Droplet

You already have Terminus + Claude Code. Here's how to get ContentFlow up and running.

---

## 🚀 Quick Start (15 minutes)

### Step 1: Clone Repository to Droplet

**In your Terminus terminal:**

```bash
# Navigate to your workspace
cd ~
mkdir -p projects
cd projects

# Clone ContentFlow
git clone https://github.com/mkhemlani2023/ContentFlow.git
cd ContentFlow

# Verify
ls -la
```

### Step 2: Install Dependencies

```bash
# Make sure you have Node.js (check version)
node --version  # Should be v18+

# If not installed:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Install project dependencies
npm install

# Install Netlify CLI globally
npm install -g netlify-cli
```

### Step 3: Set Up Environment Variables

```bash
cd ~/projects/ContentFlow

# Create .env file for Netlify functions
nano netlify/functions/.env
```

**Add your API keys:**
```env
SERPER_API_KEY=your_serper_api_key
OPENROUTER_API_KEY=your_openrouter_api_key
PEXELS_API_KEY=your_pexels_api_key
SUPABASE_URL=https://gjfjacoshfakyuluemza.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Get your current keys from your local machine:**

On your Mac (before switching to droplet):
```bash
cd /Users/mkhemlani/content-flow
cat netlify/functions/.env
```

Copy those values to your droplet.

Save in nano: `CTRL+O`, Enter, `CTRL+X`

### Step 4: Link to Netlify

```bash
# Login to Netlify
netlify login
# This opens a browser - use the URL on your iPad

# Link to your existing site
netlify link
# Choose: "Use existing site"
# Select: getseowizard.com site
```

### Step 5: Test It Works

```bash
# Start development server
netlify dev

# Should start on port 8888
# You'll see output like:
# ◈ Server now ready on http://localhost:8888
```

**Access from iPad:**
Open Safari: `http://YOUR_DROPLET_IP:8888`

---

## 🎯 Daily Workflow

### Morning: Start Coding

```bash
# 1. Connect via Terminus
ssh your-droplet

# 2. Navigate to project
cd ~/projects/ContentFlow

# 3. Pull latest changes
git pull

# 4. Start development server (in background)
netlify dev > /dev/null 2>&1 &

# 5. Start Claude Code
claude
```

### During Day: Make Changes

**Option A - Use Claude Code in Terminal:**
```bash
# In Claude Code, you can say:
"Edit index.html and add a new feature to the niche validator"
"Fix the bug in the competitor analysis section"
"Show me the last 5 git commits"
```

**Option B - Edit Files Directly:**
```bash
# Use nano for quick edits
nano index.html

# Or vim if you prefer
vim index.html
```

### Evening: Push Changes

```bash
# Check what changed
git status

# See the diff
git diff

# Add all changes
git add .

# Commit with message
git commit -m "Your descriptive message here"

# Push to GitHub
git push

# Netlify automatically deploys!
```

---

## 🔧 Essential Commands

### Git Commands
```bash
# Pull latest
git pull

# Check status
git status

# View recent commits
git log --oneline -10

# Create new branch
git checkout -b feature-name

# Switch branches
git checkout main
```

### Netlify Commands
```bash
# Start dev server
netlify dev

# Check deploy status
netlify status

# View environment variables
netlify env:list

# Open site in browser
netlify open
```

### Project Commands
```bash
# Navigate to project
cd ~/projects/ContentFlow

# List all files
ls -la

# Search for text in files
grep -r "function name" .

# Find specific file
find . -name "filename.js"
```

---

## 🎨 Using Claude Code Effectively

### Common Tasks

**1. Making Code Changes:**
```
You: "Edit index.html line 9750 to fix the competitor count display"
Claude: [Shows current code, makes changes, explains]
```

**2. Finding Code:**
```
You: "Find where the niche validation score is calculated"
Claude: [Searches, shows location, explains logic]
```

**3. Debugging:**
```
You: "Why is the competitor analysis returning a 500 error?"
Claude: [Analyzes code, identifies issue, suggests fix]
```

**4. Git Operations:**
```
You: "Show me what files changed since last commit"
Claude: [Runs git diff, shows changes]

You: "Commit these changes with message: Fixed affiliate program display"
Claude: [Stages, commits, and pushes]
```

**5. Testing:**
```
You: "Test the /api/validate-niche endpoint with sample data"
Claude: [Makes API call, shows response]
```

---

## 🔥 Pro Tips

### 1. Use Tmux for Persistent Sessions

```bash
# Create session
tmux new -s dev

# Inside tmux, start Netlify dev
netlify dev

# Detach (keeps running): CTRL+B, then D

# Reattach later
tmux attach -t dev

# Your server is still running!
```

### 2. Set Up Git Aliases

```bash
# Add to ~/.bashrc
echo 'alias gs="git status"' >> ~/.bashrc
echo 'alias gp="git pull"' >> ~/.bashrc
echo 'alias gps="git push"' >> ~/.bashrc
echo 'alias gc="git commit -m"' >> ~/.bashrc
source ~/.bashrc

# Now you can use:
gs    # instead of git status
gp    # instead of git pull
gps   # instead of git push
```

### 3. Keep .env Backed Up

```bash
# Backup your env file
cp netlify/functions/.env ~/env-backup.txt
chmod 600 ~/env-backup.txt
```

### 4. Quick File Edits

```bash
# Open file in nano at specific line
nano +9750 index.html

# Open file in vim at specific line
vim +9750 index.html
```

---

## 🚨 Common Issues

### Issue: "netlify dev" fails

**Solution:**
```bash
# Make sure .env exists
ls netlify/functions/.env

# Check Node version
node --version  # Should be 18+

# Reinstall dependencies
rm -rf node_modules
npm install
```

### Issue: Can't push to GitHub

**Solution:**
```bash
# Set up GitHub SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"
cat ~/.ssh/id_ed25519.pub
# Add to GitHub: https://github.com/settings/keys

# Test connection
ssh -T git@github.com
```

### Issue: Port 8888 not accessible

**Solution:**
```bash
# Check if firewall allows it
sudo ufw allow 8888/tcp
sudo ufw status

# Check if service is running
ps aux | grep netlify
```

---

## ✅ Verification Checklist

**Check that everything works:**

- [ ] Can navigate to project: `cd ~/projects/ContentFlow`
- [ ] Can pull from GitHub: `git pull`
- [ ] Can run dev server: `netlify dev`
- [ ] Can access in browser: `http://YOUR_DROPLET_IP:8888`
- [ ] Environment variables loaded: Check dev server logs
- [ ] Claude Code can access files: Ask it to read a file
- [ ] Can commit: `git add .` and `git commit -m "test"`
- [ ] Can push: `git push`
- [ ] Changes deploy to Netlify automatically

---

## 🎉 You're Ready!

Your droplet is now in sync with your local development. You can:

✅ Edit files using Claude Code in terminal
✅ Run development server and test locally
✅ Commit and push changes from iPad
✅ Auto-deploy to production via Netlify
✅ Access full project history and branches

**Next:** Try making a small change and pushing it!

```bash
# Example:
echo "# Remote Development" >> README_REMOTE.md
git add .
git commit -m "Test commit from droplet"
git push
```

Check GitHub to see your commit!
