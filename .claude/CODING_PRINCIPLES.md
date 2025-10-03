# Claude Code - Critical Coding Principles

## 🚨 FUNDAMENTAL DATA INTEGRITY RULE

### Core Principle
**NEVER use template-based approaches for data generation. ALWAYS use real, accurate data from APIs.**

### Context
This principle was established during ContentFlow development where template-based keyword generation was producing inappropriate results like "brain plasticity for agencies" instead of contextually relevant terms like "brain plasticity research".

### Why This Matters
1. **User Trust**: Templates break user trust with irrelevant suggestions
2. **Data Quality**: Real API data provides contextually appropriate results
3. **User Complaints**: Template-based approaches lead to user dissatisfaction
4. **Professional Standards**: Data integrity is paramount in professional applications

### Implementation Requirements
- Extract data from actual API responses (search results, titles, snippets)
- Use contextual intelligence to detect topic types
- Validate that suggestions make contextual sense
- Never rely on hardcoded patterns or templates
- Always trace data back to real sources

### Code Examples

#### ❌ NEVER DO THIS
```javascript
const templates = [
  `${keyword} for agencies`,
  `${keyword} for small business`,
  `best ${keyword}`,
  `${keyword} tips`
];
```

#### ✅ ALWAYS DO THIS
```javascript
const extractRealData = (apiResponse) => {
  const realKeywords = [];

  // Extract from actual search results
  if (apiResponse.organic) {
    apiResponse.organic.forEach(result => {
      const keywords = extractFromText(result.title, result.snippet);
      realKeywords.push(...keywords.filter(isContextuallyRelevant));
    });
  }

  return realKeywords;
};
```

### Quality Checks
Before implementing any data generation:
1. Does this data come from a real API source?
2. Is it contextually appropriate for the topic?
3. Would a real user find this valuable?
4. Can we trace this back to actual user behavior or search patterns?

### Application Areas
This principle applies to:
- Keyword research and SEO tools
- Content suggestion systems
- Search and discovery features
- Data-driven recommendations
- Any user-facing data generation

**Remember: Real data builds trust. Templates destroy it.**