# Context Recovery Guide - For When Claude Loses Context

## 🚨 When Claude Says "I Don't Have Context"

Follow these steps **in order** to quickly restore full development context:

### Step 1: Point Claude to Project Context (30 seconds)
```
Copy and paste this message to Claude:
"Read PROJECT_CONTEXT.md and CURRENT_STATUS.md to understand the current project state and recent work."
```
**Why:** These files contain comprehensive project overview and current status

### Step 2: Direct to Session History (30 seconds)
```
Copy and paste this message to Claude:
"Check SESSION_LOG.md for recent session activity and then review the last 5 git commits with 'git log --oneline -5'"
```
**Why:** Shows recent development activity and code changes

### Step 3: Activate Appropriate Agent (If Using BMAD)
```
For development work:
"Load the /analyst agent and follow the session continuity protocol"

For general coding:
"Use the TodoWrite tool to track our current work and check what we were doing"
```
**Why:** Ensures proper agent context and work tracking

### Step 4: Provide Current Focus (60 seconds)
Tell Claude what you were specifically working on:
```
"We were working on [specific feature/issue].
The current problem is [describe the issue].
Check the live site at www.getseowizard.com to see current state."
```

## 🔄 Quick Context Recovery Scripts

### For Feature Development Issues
```
"Read CURRENT_STATUS.md and PROJECT_CONTEXT.md. We were fixing [issue name].
Test the live application at www.getseowizard.com and help me continue where we left off."
```

### For Bug Fixes
```
"Check CURRENT_STATUS.md for recent issues. We were debugging [specific problem].
Review the recent commits and help me continue the fix."
```

### For New Features
```
"Read PROJECT_CONTEXT.md to understand the ContentFlow project.
Check SESSION_LOG.md for recent development.
I want to continue working on [specific feature]."
```

## 📁 Key Files to Reference (In Priority Order)

1. **`CURRENT_STATUS.md`** - Most recent project state and known issues
2. **`PROJECT_CONTEXT.md`** - Complete project overview and architecture
3. **`SESSION_LOG.md`** - Recent development activity and decisions
4. **`DEVELOPMENT_WORKFLOW.md`** - How we work and critical principles
5. **`README.md`** - Basic project information

## 🎯 Context Recovery Checklist

When Claude loses context, have Claude check:

- [ ] **Current Status** - What's working/broken right now?
- [ ] **Recent Activity** - What was done in last session?
- [ ] **Current Focus** - What specific issue/feature are we on?
- [ ] **Testing Status** - How to verify current state?
- [ ] **Next Actions** - What should be done next?

## 🚨 Emergency Recovery Commands

### If Files Are Missing or Corrupted
```
"Look at the git history to understand recent work:
git log --oneline -10
git diff HEAD~2 HEAD
Then help me recreate the missing context files."
```

### If You Need to Start Over
```
"This is the ContentFlow project - a keyword research and content generation platform.
Live site: www.getseowizard.com
Repository: https://github.com/mkhemlani2023/ContentFlow
Read any available documentation files and help me understand the current state."
```

## 📋 What NOT to Do

- **Don't start over from scratch** - Use the context files
- **Don't assume what's working** - Test the live application first
- **Don't skip TodoWrite** - Always track current session work
- **Don't ignore git history** - Recent commits show what changed

## 🔧 Technical Recovery

### If Code Issues
```
"Check the netlify/functions/api.js file for recent changes.
Compare with git history to see what might have broken.
Test the live API at www.getseowizard.com/api/status"
```

### If Deployment Issues
```
"Check netlify.toml configuration.
Review recent commits that might have affected deployment.
Test the live site functionality."
```

## 💡 Pro Tips for Faster Recovery

1. **Be Specific**: Tell Claude exactly what you were working on
2. **Provide Context**: Share any error messages or specific issues
3. **Reference Files**: Point to specific documentation files
4. **Test Together**: Have Claude test the live application
5. **Use TodoWrite**: Start tracking current work immediately

## 🎯 Success Criteria

You'll know context is fully recovered when Claude can:
- Understand the current project state
- Identify what's working vs broken
- Continue the last development task
- Test and verify current functionality
- Plan next development steps

## Template Recovery Message

```
"Context Recovery Request:

Project: ContentFlow (keyword research & content platform)
Live Site: www.getseowizard.com
Issue: [describe what you were working on]

Please:
1. Read PROJECT_CONTEXT.md and CURRENT_STATUS.md
2. Check recent git commits for context
3. Test the live application functionality
4. Use TodoWrite to track our current work
5. Help me continue with [specific task]"
```

Copy this template and fill in the specific details when you need fast context recovery!