# Remote Development Setup - iPad + Terminus + Digital Ocean

Complete guide to transition ContentFlow development to iPad using Terminus and Digital Ocean droplet.

---

## 📋 Prerequisites

- iPad with Terminus app installed
- Digital Ocean account
- GitHub account with SSH key
- This repository: https://github.com/mkhemlani2023/ContentFlow

---

## 🚀 Step 1: Create Digital Ocean Droplet

### 1.1 Create Droplet via Digital Ocean Dashboard

**Recommended Specifications:**
- **Image**: Ubuntu 22.04 LTS
- **Plan**: Basic
- **CPU Options**: Regular (2 GB RAM / 1 CPU) - $12/month
  - OR Premium (4 GB RAM / 2 CPUs) - $24/month (recommended for better performance)
- **Datacenter**: Choose closest to your location
- **Authentication**: SSH Key (add your iPad's SSH key)
- **Hostname**: `contentflow-dev` (or your preference)

### 1.2 Add SSH Key from iPad

**On iPad (in Terminus):**
```bash
# Generate SSH key if you don't have one
ssh-keygen -t ed25519 -C "your_email@example.com"

# Display public key to copy
cat ~/.ssh/id_ed25519.pub
```

Copy the output and paste it into Digital Ocean when creating the droplet.

---

## 🔧 Step 2: Initial Server Setup

### 2.1 Connect from Terminus

```bash
# Replace YOUR_DROPLET_IP with your droplet's IP address
ssh root@YOUR_DROPLET_IP
```

### 2.2 Create Non-Root User (Security Best Practice)

```bash
# Create user
adduser mahesh
usermod -aG sudo mahesh

# Copy SSH keys to new user
rsync --archive --chown=mahesh:mahesh ~/.ssh /home/mahesh

# Test new user (open new terminal)
# ssh mahesh@YOUR_DROPLET_IP
```

### 2.3 Update System

```bash
sudo apt update
sudo apt upgrade -y
```

---

## 📦 Step 3: Install Development Tools

### 3.1 Install Node.js (v18 LTS)

```bash
# Install NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install Node.js
nvm install 18
nvm use 18
nvm alias default 18

# Verify
node --version  # Should show v18.x.x
npm --version
```

### 3.2 Install Git

```bash
sudo apt install git -y

# Configure Git
git config --global user.name "Mahesh Khemlani"
git config --global user.email "mahesh.khemlani@gmail.com"
```

### 3.3 Install Essential Tools

```bash
# Install build tools
sudo apt install build-essential -y

# Install tmux (for persistent sessions)
sudo apt install tmux -y

# Install vim or nano (text editors)
sudo apt install vim nano -y

# Install curl and wget
sudo apt install curl wget -y
```

### 3.4 Install Claude Code CLI (Optional but Recommended)

```bash
# Install Claude Code for terminal-based development
npm install -g @anthropic/claude-code

# Verify
claude --version
```

---

## 📂 Step 4: Clone Repository

### 4.1 Set Up GitHub SSH Access

```bash
# Generate SSH key for GitHub
ssh-keygen -t ed25519 -C "mahesh.khemlani@gmail.com"

# Start SSH agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Display public key
cat ~/.ssh/id_ed25519.pub
```

**Copy the key and add to GitHub:**
1. Go to https://github.com/settings/keys
2. Click "New SSH key"
3. Paste the key
4. Save

### 4.2 Clone ContentFlow Repository

```bash
# Create workspace directory
mkdir -p ~/projects
cd ~/projects

# Clone repository
git clone git@github.com:mkhemlani2023/ContentFlow.git
cd ContentFlow

# Verify
ls -la
```

---

## 🔐 Step 5: Set Up Environment Variables

### 5.1 Create Netlify Environment File

```bash
cd ~/projects/ContentFlow

# Create .env file for Netlify functions
nano netlify/functions/.env
```

**Add your API keys (get from your current setup):**
```env
# Serper API (Search Data)
SERPER_API_KEY=your_serper_api_key_here

# OpenRouter API (AI Models)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Pexels API (Images)
PEXELS_API_KEY=your_pexels_api_key_here

# Supabase
SUPABASE_URL=https://gjfjacoshfakyuluemza.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Save: `CTRL+O`, Enter, `CTRL+X`

### 5.2 Secure the Environment File

```bash
# Restrict permissions
chmod 600 netlify/functions/.env

# Add to .gitignore (should already be there)
echo "netlify/functions/.env" >> .gitignore
```

---

## 🛠️ Step 6: Install Project Dependencies

```bash
cd ~/projects/ContentFlow

# Install dependencies
npm install

# Install Netlify CLI globally
npm install -g netlify-cli

# Verify
netlify --version
```

---

## 🌐 Step 7: Set Up Netlify for Development

### 7.1 Link to Netlify Site

```bash
# Login to Netlify
netlify login

# This will open a browser - use the URL on your iPad
# After authorizing, return to terminal

# Link to existing site
netlify link
# Choose "Use existing site"
# Select your ContentFlow site
```

### 7.2 Test Local Development

```bash
# Start development server
netlify dev

# Should start on port 8888
# Access via: http://YOUR_DROPLET_IP:8888
```

---

## 🎨 Step 8: Set Up Code-Server (VS Code in Browser)

This gives you a full VS Code experience in your iPad's browser.

### 8.1 Install Code-Server

```bash
curl -fsSL https://code-server.dev/install.sh | sh
```

### 8.2 Configure Code-Server

```bash
# Create config directory
mkdir -p ~/.config/code-server

# Create config file
nano ~/.config/code-server/config.yaml
```

**Add configuration:**
```yaml
bind-addr: 0.0.0.0:8080
auth: password
password: YOUR_SECURE_PASSWORD_HERE
cert: false
```

### 8.3 Create Systemd Service (Auto-Start)

```bash
sudo nano /etc/systemd/system/code-server.service
```

**Add:**
```ini
[Unit]
Description=code-server
After=network.target

[Service]
Type=simple
User=mahesh
WorkingDirectory=/home/mahesh/projects/ContentFlow
Environment=PASSWORD=YOUR_SECURE_PASSWORD_HERE
ExecStart=/usr/bin/code-server --bind-addr 0.0.0.0:8080 /home/mahesh/projects/ContentFlow
Restart=always

[Install]
WantedBy=multi-user.target
```

**Start service:**
```bash
sudo systemctl enable code-server
sudo systemctl start code-server
sudo systemctl status code-server
```

**Access code-server:**
Open Safari on iPad: `http://YOUR_DROPLET_IP:8080`

---

## 🔒 Step 9: Secure Your Droplet (Important!)

### 9.1 Set Up UFW Firewall

```bash
# Allow SSH
sudo ufw allow OpenSSH

# Allow code-server
sudo ufw allow 8080/tcp

# Allow Netlify dev
sudo ufw allow 8888/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### 9.2 Set Up Fail2Ban (Prevent Brute Force)

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 9.3 Disable Root Login

```bash
sudo nano /etc/ssh/sshd_config
```

**Find and change:**
```
PermitRootLogin no
PasswordAuthentication no
```

**Restart SSH:**
```bash
sudo systemctl restart sshd
```

---

## 🎯 Step 10: Terminus Configuration

### 10.1 Create SSH Config on iPad

In Terminus, create a new host:

**Host Configuration:**
```
Host contentflow
    HostName YOUR_DROPLET_IP
    User mahesh
    Port 22
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

### 10.2 Create Tmux Session (Persistent Terminal)

```bash
# Create named session
tmux new -s contentflow

# Inside tmux:
cd ~/projects/ContentFlow
netlify dev

# Detach: CTRL+B, then D
# Reattach: tmux attach -t contentflow
```

### 10.3 Useful Tmux Commands

```bash
# List sessions
tmux ls

# Attach to session
tmux attach -t contentflow

# Kill session
tmux kill-session -t contentflow

# Split panes
CTRL+B, then % (vertical split)
CTRL+B, then " (horizontal split)

# Switch panes
CTRL+B, then arrow keys

# Create new window
CTRL+B, then C

# Switch windows
CTRL+B, then 0-9
```

---

## 📱 Step 11: iPad Workflow

### Option A: Using Terminus (Terminal)

**For quick edits:**
```bash
# Connect to droplet
ssh contentflow

# Attach to tmux session
tmux attach -t contentflow

# Navigate to file
cd ~/projects/ContentFlow

# Edit with vim or nano
nano index.html

# Commit and push
git add .
git commit -m "Update from iPad"
git push
```

### Option B: Using Code-Server (Browser)

**For extensive coding:**
1. Open Safari on iPad
2. Go to: `http://YOUR_DROPLET_IP:8080`
3. Enter password
4. Full VS Code experience in browser!
5. Use integrated terminal for git commands

### Option C: Using Claude Code (Recommended)

**For AI-assisted development:**
```bash
# In Terminus, attach to tmux
tmux attach -t contentflow

# Start Claude Code
claude

# Ask Claude to help with code changes
# Example: "Add a new feature to the niche validator"
# Example: "Fix the bug in the competitor analysis"
```

---

## 🔄 Step 12: Git Workflow from iPad

### 12.1 Daily Workflow

```bash
# 1. Connect
ssh contentflow
tmux attach -t contentflow

# 2. Pull latest changes
cd ~/projects/ContentFlow
git pull

# 3. Make changes (via nano, vim, or code-server)

# 4. Check status
git status

# 5. Commit
git add .
git commit -m "Your commit message"

# 6. Push
git push

# 7. Netlify will auto-deploy!
```

### 12.2 Useful Git Aliases

```bash
# Add to ~/.bashrc or ~/.zshrc
echo 'alias gs="git status"' >> ~/.bashrc
echo 'alias ga="git add ."' >> ~/.bashrc
echo 'alias gc="git commit -m"' >> ~/.bashrc
echo 'alias gp="git push"' >> ~/.bashrc
echo 'alias gl="git log --oneline -10"' >> ~/.bashrc

# Reload
source ~/.bashrc
```

---

## 🧪 Step 13: Testing Your Setup

### 13.1 Test Netlify Functions

```bash
# Start dev server
netlify dev

# Test in browser (on iPad)
# Go to: http://YOUR_DROPLET_IP:8888
```

### 13.2 Test API Endpoints

```bash
# Test niche validation
curl -X POST http://localhost:8888/api/validate-niche-step1 \
  -H "Content-Type: application/json" \
  -d '{"niche_keyword": "test niche"}'
```

### 13.3 Test Git Push

```bash
# Make a small change
echo "# Remote Dev Setup" >> README_REMOTE.md

# Commit and push
git add .
git commit -m "Test commit from droplet"
git push

# Verify on GitHub
```

---

## 📊 Step 14: Monitoring and Maintenance

### 14.1 Monitor Droplet Resources

```bash
# Check disk space
df -h

# Check memory
free -h

# Check CPU
htop  # (install: sudo apt install htop)

# Check running services
sudo systemctl status code-server
sudo systemctl status fail2ban
```

### 14.2 Keep System Updated

```bash
# Weekly updates
sudo apt update
sudo apt upgrade -y

# Clean up
sudo apt autoremove -y
sudo apt autoclean
```

### 14.3 Backup Important Files

```bash
# Backup .env files
cp netlify/functions/.env ~/backups/env-$(date +%Y%m%d).bak

# Backup SSH keys
cp -r ~/.ssh ~/backups/ssh-$(date +%Y%m%d).bak
```

---

## 🎓 Step 15: iPad Pro Tips

### 15.1 Terminus Tips

**Keyboard Shortcuts:**
- `CMD+T`: New tab
- `CMD+W`: Close tab
- `CMD+D`: Split pane
- `CMD+[` / `CMD+]`: Switch tabs

**Connection Profiles:**
- Create different profiles for different tasks
- Save frequently used commands as snippets

### 15.2 Safari Tips for Code-Server

**Enable Desktop Mode:**
- Tap AA in address bar → "Request Desktop Website"

**Add to Home Screen:**
- Share button → "Add to Home Screen"
- Creates app-like experience

### 15.3 External Keyboard Recommended

For best experience, use:
- Magic Keyboard for iPad
- Or any Bluetooth keyboard
- Enables keyboard shortcuts in both Terminus and code-server

---

## 🚨 Troubleshooting

### Issue: Can't Connect via SSH

```bash
# Check if droplet is running (on DO dashboard)
# Check firewall: sudo ufw status
# Check SSH service: sudo systemctl status sshd
```

### Issue: Netlify Dev Not Accessible

```bash
# Check if running: ps aux | grep netlify
# Check port: sudo netstat -tlnp | grep 8888
# Check firewall: sudo ufw status
```

### Issue: Code-Server Not Loading

```bash
# Check status: sudo systemctl status code-server
# Check logs: sudo journalctl -u code-server -f
# Restart: sudo systemctl restart code-server
```

### Issue: Out of Memory

```bash
# Check memory: free -h
# Kill heavy processes: kill PID
# Consider upgrading droplet size
```

---

## 📚 Resources

**Digital Ocean:**
- https://docs.digitalocean.com/

**Terminus:**
- https://termius.com/

**Code-Server:**
- https://github.com/coder/code-server

**Tmux Cheat Sheet:**
- https://tmuxcheatsheet.com/

**Git from Terminal:**
- https://git-scm.com/docs

---

## ✅ Quick Start Checklist

- [ ] Create Digital Ocean droplet
- [ ] Add SSH key from iPad
- [ ] Connect via Terminus
- [ ] Install Node.js, Git, tools
- [ ] Clone ContentFlow repository
- [ ] Set up environment variables
- [ ] Install code-server
- [ ] Configure firewall
- [ ] Test Netlify dev server
- [ ] Test code-server in Safari
- [ ] Create tmux session
- [ ] Make test commit and push
- [ ] Bookmark this guide!

---

## 🎉 You're All Set!

Your remote development environment is ready. You can now:
- Code from your iPad anywhere
- Use Terminus for quick terminal work
- Use code-server for full IDE experience
- Commit and push directly from the droplet
- Netlify auto-deploys your changes

**Happy coding from your iPad!** 🚀
