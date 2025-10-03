# ContentFlow - BMAD Development Workflow Guide

## 🚀 Starting Any Development Session

### 1. Enhanced Context Recovery (MANDATORY)
```bash
# NEVER skip these steps - they prevent context loss:
1. Read CURRENT_STATUS.md - understand current state
2. Read PROJECT_CONTEXT.md - get full project understanding
3. Check SESSION_LOG.md - review recent session history
4. Run: git log --oneline -5 - see recent changes
5. Run: git status - check for uncommitted changes
6. Test live application - verify current functionality
7. Use TodoWrite - create session todos immediately
8. Update session timestamp in CURRENT_STATUS.md
```

### 2. Context Loss Prevention Protocol
```bash
# During every session:
- Update CURRENT_STATUS.md when issues change
- Log significant decisions in SESSION_LOG.md
- Use TodoWrite consistently throughout work
- Commit working states before major changes
- Document any new discoveries or blockers

# At session end:
- Complete SESSION_LOG.md entry
- Update CURRENT_STATUS.md with final state
- Mark all TodoWrite items complete or document why pending
- Commit any working progress
```

### 3. Context Recovery Resources
- **`CONTEXT_RECOVERY_GUIDE.md`** - Step-by-step guide for when Claude loses context
- **`PROJECT_CONTEXT.md`** - Complete project overview and architecture
- **`.bmad-core/tasks/session-continuity-protocol.md`** - Comprehensive continuity protocol

### 4. Session Documentation - MANDATORY AFTER EVERY MOVE
⚠️ **CRITICAL RULE: Update context files after EVERY feature/task completion**

**After EVERY completed task, ALWAYS:**
1. **Update CURRENT_STATUS.md** with new progress
2. **Log the change in SESSION_LOG.md**
3. **Commit changes to Git** immediately
4. **Update timestamps** to current session time

**Never proceed to next task without updating context files first**

## 📋 BMAD System Integration

### TodoWrite Usage
```javascript
// Always start sessions with TodoWrite
TodoWrite([
  {content: "Understand current development context", status: "in_progress", activeForm: "Understanding current development context"},
  {content: "Identify specific issues to fix", status: "pending", activeForm: "Identifying specific issues to fix"},
  // ... more todos
])

// Update frequently as work progresses
// Mark completed immediately, never batch completions
```

### Sharded Document Management
- **PRD Documents**: `/docs/prd/` - Use for reference and updates
- **Stories**: `/docs/stories/` - Track Epic progress
- **Architecture**: `/docs/architecture/` - Technical decisions

### BMAD Commands Available
- `*help` - Show available commands
- `*brainstorm {topic}` - Structured brainstorming
- `*create-project-brief` - Generate project documentation
- `*elicit` - Advanced requirement gathering

## 🔧 Development Best Practices

### ⚠️ CRITICAL CODING PRINCIPLE
**NO TEMPLATES OR FAKE DATA - EVER**
- **NEVER** use template-based approaches for data generation
- **ALWAYS** use real, accurate data from APIs
- **Templates are inappropriate** and users will complain
- **Data integrity is paramount** - only show genuine results

### Before Making Changes
1. **Test Current State**: Always run the app first
2. **Create Branch**: For significant changes
3. **Backup Working State**: Commit before major refactors
4. **Plan with TodoWrite**: Break work into trackable tasks
5. **Verify Real Data**: Ensure all data comes from actual API sources

### During Development
1. **Test Incrementally**: Small changes, frequent testing
2. **Update Documentation**: Keep CURRENT_STATUS.md current
3. **Log Issues**: Document problems as you discover them
4. **Commit Working States**: Don't wait until "perfect"

### After Changes
1. **Full Testing**: End-to-end workflow verification
2. **Update Status Files**: Reflect current state accurately
3. **Log Session**: Complete session log entry
4. **Clean TodoWrite**: Mark all todos as completed

## 🚨 Critical Failure Prevention

### Context Loss Prevention
- **NEVER** work without updating CURRENT_STATUS.md
- **ALWAYS** use TodoWrite for session tracking
- **LOG** all significant discoveries and changes
- **COMMIT** working states before major changes

### Breaking Change Protocol
```bash
# Before major refactors:
1. git add -A && git commit -m "Working state before [change description]"
2. Update CURRENT_STATUS.md with planned changes
3. Create todos for rollback plan
4. Test critical paths after changes
5. Update all documentation if successful
```

### Recovery Protocol
```bash
# If system breaks:
1. git log --oneline -10  # Review recent commits
2. git diff HEAD~1        # See what changed
3. Test rollback: git checkout HEAD~1 -- [problematic files]
4. Document the issue in CURRENT_STATUS.md
5. Create recovery todos in TodoWrite
```

## 📁 File Organization

### Session Continuity Files
- `CURRENT_STATUS.md` - Always read first, update frequently
- `SESSION_LOG.md` - Log every session
- `DEVELOPMENT_WORKFLOW.md` - This guide

### Development Files
- `package.json` - Dependencies and scripts
- `server.js` - Backend API server
- `index.html` - Frontend application
- `.env` - Environment configuration (check .env.example)

### Documentation Structure
```
docs/
├── prd/                 # Sharded PRD documents
├── stories/             # Development stories and epics
├── architecture/        # Technical architecture
└── qa/                  # Quality assurance documents
```

## 🎯 Epic-Specific Workflows

### Epic 1: API Migration (✅ COMPLETE)
- No active development needed
- Reference for API patterns and architecture

### Epic 2: Content Processing (🔄 ACTIVE)
- Focus on keyword research and content generation
- Key files: `index.html`, `server.js`, content generation functions
- Test workflow: Upload → Process → Generate → Review

### Epic 3: Multi-Platform Publishing (⏳ PENDING)
- Depends on Epic 2 completion
- Will need platform API integrations

### Epic 4: Credit System (⏳ PENDING)
- Business logic for usage tracking
- Integration with payment systems

### Epic 5: Analytics (⏳ PENDING)
- Performance tracking and insights
- Cross-platform data aggregation

## ⚡ Quick Reference Commands

```bash
# Development
npm run dev              # Start development server
npm test                 # Run test suite
npm run build           # Build production version

# Git
git status              # Check current state
git log --oneline -5    # Recent commits
git diff                # See changes

# Debugging
tail -f logs/app.log    # Monitor application logs (if exists)
```

Remember: **Context is king**. Always prioritize maintaining continuity over speed.