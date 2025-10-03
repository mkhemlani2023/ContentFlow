# Coding Standards & Critical Principles

## ⚠️ CRITICAL: NO TEMPLATES OR FAKE DATA RULE

### Fundamental Principle
**NEVER use template-based approaches for data generation. ALWAYS use real, accurate data from APIs.**

### Why This Matters
- Templates create inappropriate results (e.g., "brain plasticity for agencies")
- Users will complain about irrelevant suggestions
- Data integrity is paramount for user trust
- Real API data provides contextually relevant results

### Examples of What NOT to Do
```javascript
// ❌ NEVER DO THIS - Template-based approach
const badKeywords = [
  `${keyword} for agencies`,
  `${keyword} for small business`,
  `${keyword} tips`,
  `best ${keyword}`
];
```

### Examples of What TO Do
```javascript
// ✅ ALWAYS DO THIS - Real API data extraction
const extractRealKeywords = (apiResponse) => {
  const keywords = [];

  // Extract from real search results
  if (apiResponse.organic) {
    apiResponse.organic.forEach(result => {
      // Extract meaningful phrases from titles/snippets
      const realKeywords = extractFromText(result.title, result.snippet);
      keywords.push(...realKeywords);
    });
  }

  return keywords;
};
```

### Implementation Guidelines
1. **Always extract from API responses**: Use search results, titles, snippets, "People Also Ask"
2. **Use contextual intelligence**: Detect topic type (scientific/business/tech) for relevant suggestions
3. **No hardcoded templates**: Even "smart" templates are inappropriate
4. **Validate data relevance**: Ensure suggestions make contextual sense
5. **Document data sources**: Always trace data back to real API sources

### Quality Checks
- Does this keyword make sense for the topic?
- Would a real person search for this?
- Does it come from actual search behavior or user intent?
- Is it contextually appropriate for the domain?

### Historical Context
This principle was established after fixing ContentFlow's keyword generation system, where template-based approaches were generating inappropriate suggestions like "brain plasticity for agencies" instead of relevant terms like "brain plasticity research" or "neuroplasticity studies".

## Application to All Projects
This principle applies to:
- Keyword research systems
- Content suggestion engines
- Any data-driven user-facing features
- API integrations and data processing
- Search and discovery functionality

**Remember: Users trust us to provide real, valuable data. Templates break that trust.**