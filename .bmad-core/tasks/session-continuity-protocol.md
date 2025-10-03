# Session Continuity Protocol

## Overview
Comprehensive protocol to ensure zero context loss between development sessions.

## Context Recovery Requirements

### MANDATORY Session Startup (EVERY TIME)
1. **Read CURRENT_STATUS.md** - Must be first action in every session
2. **Check SESSION_LOG.md** - Understand recent progress and decisions
3. **Review TodoWrite status** - See pending/in-progress tasks
4. **Test current functionality** - Verify system state before changes
5. **Update session timestamp** - Log session start in CURRENT_STATUS.md

### Context Documentation Standards

#### CURRENT_STATUS.md Structure
```markdown
**Last Updated:** [DATE + TIME]
**Current Session:** [Session identifier]
**Agent:** [Agent name/type]

## 🎯 Current Focus
[What we're actively working on]

## ✅ What's Working
[Confirmed working features]

## ❌ What's Broken
[Known issues with specific details]

## 🔧 Recent Changes
[What changed in last session]

## 📋 Next Actions
[Immediate next steps]

## 🧪 Testing Status
[How to test current state]
```

#### SESSION_LOG.md Requirements
- **Every session must be logged**
- **Include context at session start**
- **Document key decisions made**
- **Note files created/modified**
- **Record any blockers or issues**

### Enhanced Context Files

#### Project Context Memory
- `PROJECT_CONTEXT.md` - High-level project understanding
- `TECHNICAL_DEBT.md` - Known issues and workarounds
- `DECISION_LOG.md` - Why certain approaches were chosen/rejected

### Automated Context Triggers

#### Session Start Checklist
- [ ] Read CURRENT_STATUS.md
- [ ] Check SESSION_LOG.md for recent activity
- [ ] Review TodoWrite for pending tasks
- [ ] Test current deployment (if applicable)
- [ ] Update session metadata

#### Session End Requirements
- [ ] Update CURRENT_STATUS.md with new state
- [ ] Log session results in SESSION_LOG.md
- [ ] Complete all TodoWrite items or document why pending
- [ ] Commit any working state
- [ ] Document any new issues discovered

### Context Loss Prevention

#### Redundant Documentation
- **Multiple sources** - Same critical info in multiple files
- **Cross-references** - Files reference each other
- **Timestamps** - Always know when something was last verified
- **Agent handoff notes** - Clear instructions for next agent

#### Critical Information Backup
```markdown
## Context Recovery Emergency Kit
- Primary: CURRENT_STATUS.md
- Secondary: SESSION_LOG.md
- Tertiary: git log --oneline -20
- Fallback: README.md project description
```

### Enhanced Continuity Features

#### Smart Context Recovery
When context is lost:
1. **Git history analysis** - What changed recently?
2. **File timestamp analysis** - What was worked on last?
3. **Testing protocol** - What's the current system state?
4. **Issue reconstruction** - What problems were being solved?

#### Predictive Context
- **Anticipate handoffs** - Document before switching contexts
- **Prepare for interruptions** - Always have current state documented
- **Cross-session planning** - Plan beyond current session

### Implementation Checklist

#### For Every Project
- [ ] CURRENT_STATUS.md exists and is current
- [ ] SESSION_LOG.md is maintained
- [ ] PROJECT_CONTEXT.md provides overview
- [ ] DEVELOPMENT_WORKFLOW.md has process
- [ ] .claude/BMAD_SESSION_CONTEXT.md for agent context

#### For Every Session
- [ ] Start with context recovery
- [ ] Use TodoWrite throughout
- [ ] Update status frequently
- [ ] End with session documentation
- [ ] Commit working state

#### For Every Agent
- [ ] Understands continuity protocol
- [ ] Follows documentation standards
- [ ] Updates context before handoff
- [ ] Tests before declaring "working"

## Success Metrics
- **Zero context loss** between sessions
- **Rapid context recovery** (< 2 minutes to understand state)
- **Clear handoff documentation** between agents
- **Accurate status tracking** throughout development

This protocol ensures that any agent can pick up development work at any time with full context and understanding of the current state.