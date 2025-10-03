# Mandatory Context Update Protocol

## ⚠️ CRITICAL REQUIREMENT
**Update context files after EVERY feature/task/move forward - NO EXCEPTIONS**

## The Rule
**"You must update the context file every time we move forward with another feature"**

This is a MANDATORY requirement that prevents context loss and ensures continuity.

## After Every Completed Task - ALWAYS Do This:

### 1. Update CURRENT_STATUS.md (Required)
```markdown
**Last Updated:** [Current timestamp]
**Current Session:** [Current session info]

## 🎯 Current Focus
[What was just completed + what's next]

## ✅ What's Working
[Add the feature/task just completed]

## Recent Progress This Session
[List what was just accomplished]
```

### 2. Update SESSION_LOG.md (Required)
```markdown
### [Timestamp] - [Task/Feature Name]
**Completed:** [What was accomplished]
**Changes Made:** [Files modified, commits made]
**Status:** [Current state]
**Next:** [What's coming next]
```

### 3. Git Commit (Required)
```bash
git add CURRENT_STATUS.md SESSION_LOG.md [any other changed files]
git commit -m "Context update: [task completed]"
git push
```

### 4. Update Timestamp (Required)
Always update the "Last Updated" timestamp to current session time.

## Examples of When This Rule Applies

### ✅ These Require Context Updates:
- Fixed a bug → Update context files
- Added a new feature → Update context files
- Completed a code refactor → Update context files
- Resolved an issue → Update context files
- Made any progress → Update context files
- Changed system behavior → Update context files

### ❌ These Don't Require Context Updates:
- Reading files for investigation (no progress made)
- Checking current status without changes
- Pure research without implementation

## Implementation in Workflow

### For Every Agent/Session:
1. **Before starting work** - Read current context
2. **After each completed task** - Update context files
3. **Before switching tasks** - Update context files
4. **At session end** - Final context update

### Context Update Template:
```bash
# After completing any task, run these commands:
1. Edit CURRENT_STATUS.md - add what was just completed
2. Edit SESSION_LOG.md - log the progress made
3. git add CURRENT_STATUS.md SESSION_LOG.md
4. git commit -m "Context update: [brief description]"
5. git push
```

## Quality Assurance

### Context Update Checklist:
- [ ] CURRENT_STATUS.md shows latest progress
- [ ] SESSION_LOG.md has entry for completed task
- [ ] Timestamp is current session time
- [ ] Git commit made with context files
- [ ] Changes pushed to remote repository

## Why This Matters

### Prevents:
- Context loss between sessions
- Confusion about current project state
- Duplicate work or forgetting progress
- Loss of development momentum

### Ensures:
- Any agent can pick up work immediately
- Clear audit trail of all progress
- Current status is always accurate
- Continuous documentation of decisions

## Enforcement

This rule is MANDATORY and must be followed without exception. Every task completion triggers a context file update.

**Remember: Progress without documentation is progress that can be lost.**