# ContentFlow - Project Context Memory

## Project Overview
**ContentFlow** is an AI-powered SEO and content research platform that helps users discover high-impact keywords and generate winning content ideas.

**Live Application:** https://www.getseowizard.com
**Repository:** https://github.com/mkhemlani2023/ContentFlow

## Architecture Summary
- **Frontend:** Single-page HTML application with JavaScript
- **Backend:** Netlify serverless functions (Node.js)
- **APIs:** Serper API (search), OpenRouter API (AI content)
- **Deployment:** Netlify with automatic GitHub integration

## Core Features
1. **Keyword Research** - Real-time search data from Serper API
2. **Article Ideas Generation** - AI-powered content suggestions via OpenRouter
3. **Competitor Analysis** - Search result analysis and insights
4. **Content Generation** - Full article creation with AI models

## Business Model
- Credit-based system for AI features
- Freemium with premium AI models
- Target audience: Content creators, marketers, SEO professionals

## Technical Stack
- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Backend:** Netlify Functions, Node.js 18
- **APIs:** Serper (search), OpenRouter (AI)
- **Deployment:** Netlify, automatic from main branch

## Critical Principles Established
1. **No Templates Rule** - Never use template-based data, always real API data
2. **Data Integrity** - All suggestions must be contextually relevant
3. **Real Search Behavior** - Extract keywords from actual search results
4. **Contextual Intelligence** - Detect topic types for appropriate suggestions

## Development History
- **Epic 1:** Serper API migration (✅ Complete - 97% cost reduction)
- **Epic 2:** Content processing pipeline (🔄 In Progress)
- **Epic 3-5:** Multi-platform publishing, credits, analytics (⏳ Planned)

## Known Architecture Decisions
- **Serverless Functions:** Chose Netlify over traditional server for scalability
- **Single Page App:** Simpler deployment and maintenance
- **Direct API Integration:** No backend database to reduce complexity
- **Credit System:** Prevents API abuse and creates revenue model

## Critical Files
- **Frontend:** `index.html` (complete application)
- **Backend:** `netlify/functions/api.js` (all endpoints)
- **Config:** `netlify.toml` (deployment and routing)
- **Continuity:** `CURRENT_STATUS.md`, `SESSION_LOG.md`

## Environment Variables (Netlify)
- `SERPER_API_KEY` - Search API access
- `OPENROUTER_API_KEY` - AI content generation
- `NODE_ENV` - Environment setting

## Testing Protocol
1. Visit https://www.getseowizard.com
2. Test keyword search (e.g., "content marketing")
3. Verify article ideas generation works
4. Check competitor analysis functionality
5. Monitor browser console for errors

## Emergency Context Recovery
If all context is lost, follow this sequence:
1. Read this file (PROJECT_CONTEXT.md)
2. Check CURRENT_STATUS.md for recent state
3. Review SESSION_LOG.md for recent activity
4. Run git log --oneline -10 to see recent commits
5. Test the live application functionality
6. Check browser console for any errors

This provides sufficient context to understand and continue development on any aspect of the ContentFlow platform.