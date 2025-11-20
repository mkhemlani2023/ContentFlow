/**
 * Netlify Function for Content Flow API - Zero Dependencies
 * Handles all /api/* requests as serverless functions
 * Uses native Node.js and browser APIs only
 */

// Configuration from environment variables
const SERPER_API_KEY = process.env.SERPER_API_KEY;
const SERPER_BASE_URL = process.env.SERPER_BASE_URL || 'https://google.serper.dev';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_BASE_URL = 'https://api.anthropic.com/v1';
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const PEXELS_BASE_URL = 'https://api.pexels.com/v1';
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UNSPLASH_BASE_URL = 'https://api.unsplash.com';

// DataForSEO credentials
const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN || 'info@getseowizard.com';
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD || '380e0892107eaca7';
const DATAFORSEO_BASE_URL = 'https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_suggestions/live';

// Domain Authority and Backlink Estimation Functions
const estimateDomainAuthority = (domain) => {
  // High authority domains (80-95 DA)
  const highAuthority = [
    'google.com', 'youtube.com', 'facebook.com', 'wikipedia.org', 'twitter.com',
    'linkedin.com', 'instagram.com', 'microsoft.com', 'apple.com', 'amazon.com',
    'forbes.com', 'cnn.com', 'bbc.com', 'nytimes.com', 'reddit.com'
  ];

  // Medium-High authority domains (60-79 DA)
  const mediumHighAuthority = [
    'hubspot.com', 'moz.com', 'semrush.com', 'ahrefs.com', 'searchengineland.com',
    'neil Patel.com', 'backlinko.com', 'contentmarketinginstitute.com', 'mashable.com',
    'techcrunch.com', 'entrepreneur.com', 'inc.com', 'medium.com', 'quora.com'
  ];

  // Medium authority domains (40-59 DA)
  const mediumAuthority = [
    'blog.', 'www.', '.org', '.edu', '.gov'
  ];

  // Check exact matches first
  if (highAuthority.includes(domain)) {
    return Math.floor(Math.random() * 15) + 80; // 80-95
  }

  if (mediumHighAuthority.includes(domain)) {
    return Math.floor(Math.random() * 20) + 60; // 60-79
  }

  // Check for patterns
  if (domain.includes('blog.') || domain.endsWith('.edu') || domain.endsWith('.gov') || domain.endsWith('.org')) {
    return Math.floor(Math.random() * 20) + 40; // 40-59
  }

  // For unknown domains, use a realistic distribution
  // Most websites are in the 20-50 range
  return Math.floor(Math.random() * 30) + 20; // 20-49
};

const estimateBacklinks = (domain, domainAuthority) => {
  // Backlinks roughly correlate with DA
  if (domainAuthority >= 80) {
    return Math.floor(Math.random() * 500000) + 100000; // 100k-600k
  } else if (domainAuthority >= 60) {
    return Math.floor(Math.random() * 100000) + 20000; // 20k-120k
  } else if (domainAuthority >= 40) {
    return Math.floor(Math.random() * 20000) + 5000; // 5k-25k
  } else {
    return Math.floor(Math.random() * 5000) + 500; // 500-5.5k
  }
};

const estimateContentLength = (snippet) => {
  // Estimate based on snippet length and content type
  const baseLength = snippet ? snippet.length * 8 : 1000;
  const variation = Math.floor(Math.random() * 800) + 600; // 600-1400 variation
  return Math.min(Math.max(baseLength + variation, 800), 4000); // 800-4000 words
};

// Utility functions
const calculateDifficulty = (position) => {
  if (position <= 3) return 'High';
  if (position <= 6) return 'Medium';
  return 'Low';
};

const determineIntent = (keyword) => {
  if (!keyword) return 'Informational';

  const commercial = ['buy', 'price', 'cost', 'cheap', 'discount', 'deal'];
  const transactional = ['download', 'signup', 'register', 'subscribe'];
  const navigational = ['login', 'website', 'official'];

  const lower = keyword.toLowerCase();

  if (commercial.some(word => lower.includes(word))) return 'Commercial';
  if (transactional.some(word => lower.includes(word))) return 'Transactional';
  if (navigational.some(word => lower.includes(word))) return 'Navigational';

  return 'Informational';
};

// Article content analysis functions
const extractKeywordsFromContent = (title, content) => {
  if (!title || !content) return [];

  // Extract the main keyword from the title (first meaningful word/phrase)
  const titleWords = title.toLowerCase().split(' ').filter(word =>
    word.length > 2 && !['the', 'and', 'for', 'with', 'how', 'to', 'what', 'why', 'when', 'where', 'best', 'guide', 'complete'].includes(word)
  );

  // Use the first 1-3 meaningful words as the main keyword
  const mainKeyword = titleWords.slice(0, Math.min(3, titleWords.length)).join(' ');

  // Extract related keywords from content
  const words = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
  const wordFreq = {};

  words.forEach(word => {
    if (word && !['this', 'that', 'with', 'from', 'they', 'were', 'been', 'have', 'their', 'said', 'each', 'which', 'them', 'many', 'some', 'time', 'very', 'when', 'much', 'more', 'most', 'other', 'such', 'make', 'like', 'into', 'only', 'over', 'think', 'also', 'back', 'after', 'first', 'well', 'should', 'could', 'would'].includes(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });

  // Get top keywords by frequency
  const topKeywords = Object.entries(wordFreq)
    .filter(([word, freq]) => freq >= 2)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);

  // Combine main keyword with related keywords
  const allKeywords = [mainKeyword, ...topKeywords].filter(Boolean);

  return [...new Set(allKeywords)].slice(0, 12);
};

const calculateSimpleReadabilityScore = (content) => {
  if (!content) return 'Unknown';

  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = content.split(/\s+/).filter(w => w.length > 0);

  if (sentences.length === 0 || words.length === 0) return 'Unknown';

  const avgWordsPerSentence = words.length / sentences.length;

  if (avgWordsPerSentence <= 15) return 'Very Easy';
  if (avgWordsPerSentence <= 20) return 'Easy';
  if (avgWordsPerSentence <= 25) return 'Good';
  if (avgWordsPerSentence <= 30) return 'Difficult';
  return 'Very Difficult';
};

const createMetaDescription = (title, content, focusKeyword) => {
  if (!content) return `Learn about ${focusKeyword}. Comprehensive guide with expert insights and practical tips.`;

  // Find the first meaningful paragraph (skip headings and short lines)
  const paragraphs = content.split('\n\n').filter(p =>
    p.trim().length > 100 &&
    !p.startsWith('#') &&
    !p.startsWith('##') &&
    !p.startsWith('Table of Contents') &&
    !p.startsWith('FAQ') &&
    !p.includes('Frequently Asked Questions') &&
    !p.includes('**') // Skip heavily formatted sections
  );

  if (paragraphs.length === 0) {
    return `Complete guide to ${focusKeyword}. Learn everything you need to know with practical tips and expert insights.`;
  }

  // Clean the first paragraph and create meta description
  let metaDesc = paragraphs[0]
    .replace(/[#*\[\]]/g, '') // Remove markdown
    .replace(/\n/g, ' ') // Replace newlines with spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Ensure it includes the focus keyword if not already present
  if (!metaDesc.toLowerCase().includes(focusKeyword.toLowerCase())) {
    metaDesc = `${focusKeyword}: ${metaDesc}`;
  }

  // Smart truncation to avoid cutting off mid-word or mid-sentence
  if (metaDesc.length > 160) {
    let truncated = metaDesc.substring(0, 157);

    // Find the last complete word before the cutoff
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    if (lastSpaceIndex > 140) { // Only if we have a reasonable amount of text
      truncated = truncated.substring(0, lastSpaceIndex);
    }

    metaDesc = truncated + '...';
  }

  // Final validation - ensure minimum length
  if (metaDesc.length < 120) {
    metaDesc = `${focusKeyword}: ${metaDesc}. Expert insights and practical guidance included.`;
  }

  return metaDesc.substring(0, 160); // Hard limit at 160 chars
};

const generateAutocompleteSuggestions = (keyword) => {
  // Use the same contextual intelligence as keyword generation
  // This ensures autocomplete suggestions are meaningful and relevant
  const contextualSuggestions = generateContextualKeywords(keyword);

  // Return 8-12 contextually relevant suggestions
  return contextualSuggestions
    .filter(suggestion => suggestion !== keyword)
    .slice(0, Math.floor(Math.random() * 5) + 8)
    .map(suggestion => suggestion.toLowerCase());
};

// Serper API functions
const callSerperAPI = async (query, location = 'us', language = 'en', num = 10) => {
  try {
    const requestData = {
      q: query,
      gl: location,
      hl: language,
      num: num
    };

    const startTime = Date.now();

    const response = await fetch(`${SERPER_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const responseTime = Date.now() - startTime;

    return { data, responseTime, success: true };
  } catch (error) {
    throw new Error(`Serper API error: ${error.message}`);
  }
};

// Serper Autocomplete API - Get real Google autocomplete suggestions
const callSerperAutocompleteAPI = async (query, location = 'us') => {
  try {
    const requestData = {
      q: query,
      gl: location
    };

    const startTime = Date.now();

    const response = await fetch(`${SERPER_BASE_URL}/autocomplete`, {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const responseTime = Date.now() - startTime;

    console.log('✅ Serper Autocomplete API response:', JSON.stringify(data, null, 2));

    return { data, responseTime, success: true };
  } catch (error) {
    throw new Error(`Serper Autocomplete API error: ${error.message}`);
  }
};

// DataForSEO API - Get real search volume, CPC, and competition data
const callDataForSEOAPI = async (keyword, location = 2840, limit = 25) => {
  try {
    const startTime = Date.now();

    // Create Basic Auth header
    const authString = Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString('base64');

    const response = await fetch(DATAFORSEO_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{
        keyword: keyword, // SINGULAR - one seed keyword
        location_code: location, // 2840 = USA
        language_code: 'en',
        limit: limit,
        include_seed_keyword: true,
        include_serp_info: false
      }])
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const responseTime = Date.now() - startTime;

    console.log('✅ DataForSEO API response status:', data.status_message);
    console.log('   Cost:', data.cost, '| Time:', data.time);

    // CRITICAL: Correct response parsing path
    if (data.tasks && data.tasks[0] && data.tasks[0].result && data.tasks[0].result.length > 0) {
      const resultData = data.tasks[0].result[0];
      if (resultData && resultData.items && resultData.items.length > 0) {
        return {
          data: resultData.items,
          responseTime,
          success: true,
          cost: data.cost || 0
        };
      }
    }

    throw new Error('No items found in DataForSEO response');
  } catch (error) {
    console.error('❌ DataForSEO API error:', error.message);
    throw new Error(`DataForSEO API error: ${error.message}`);
  }
};

// DataForSEO Content Generation API - Generate SEO-optimized content
const callDataForSEOContentAPI = async (topic, wordCount, options = {}) => {
  try {
    const {
      subTopics = [],
      metaKeywords = [],
      description = '',
      creativityIndex = 0.8,
      includeConclusion = true
    } = options;

    // DataForSEO has 1000-word limit, so we need to batch for longer articles
    // Use maximum 1000 words per request to minimize API calls and avoid timeout
    const maxWordsPerRequest = 1000;
    const needsBatching = wordCount > maxWordsPerRequest;

    if (!needsBatching) {
      // Single request for articles <= 1000 words
      return await generateSingleDataForSEOContent(topic, wordCount, {
        subTopics,
        metaKeywords,
        description,
        creativityIndex,
        includeConclusion
      });
    }

    // Batch processing for longer articles - use 2 chunks max to avoid timeout
    // For 1800 words: 2 chunks of 900 words each
    // For 2000 words: 2 chunks of 1000 words each
    console.log(`📝 Article requires ${wordCount} words - batching into multiple requests`);

    // Optimize: use 2 chunks maximum to stay within Netlify timeout
    const numChunks = Math.min(2, Math.ceil(wordCount / maxWordsPerRequest));
    const wordsPerChunk = Math.floor(wordCount / numChunks);

    let fullContent = '';
    let totalCost = 0;
    let supplementToken = null;

    for (let i = 0; i < numChunks; i++) {
      const isLastChunk = i === numChunks - 1;
      const chunkWords = isLastChunk ? (wordCount - (wordsPerChunk * i)) : wordsPerChunk;

      console.log(`   Chunk ${i + 1}/${numChunks}: Generating ${chunkWords} words...`);

      const result = await generateSingleDataForSEOContent(
        i === 0 ? topic : `Continue writing about ${topic}`,
        chunkWords,
        {
          subTopics: i === 0 ? subTopics : [],
          metaKeywords: i === 0 ? metaKeywords : [],
          description: i === 0 ? description : '',
          creativityIndex,
          includeConclusion: isLastChunk && includeConclusion,
          supplementToken
        }
      );

      fullContent += (i > 0 ? '\n\n' : '') + result.content;
      totalCost += result.cost;
      supplementToken = result.supplementToken;
    }

    console.log(`✅ Batched generation complete: ${numChunks} chunks, ${wordCount} words, $${totalCost.toFixed(4)}`);

    return {
      content: fullContent,
      cost: totalCost,
      wordCount: wordCount,
      chunks: numChunks
    };
  } catch (error) {
    console.error('❌ DataForSEO Content API error:', error.message);
    throw new Error(`DataForSEO Content Generation failed: ${error.message}`);
  }
};

// Helper function for single DataForSEO content generation request
const generateSingleDataForSEOContent = async (topic, wordCount, options) => {
  const authString = Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString('base64');

  const requestBody = [{
    topic: topic,
    word_count: wordCount,
    creativity_index: options.creativityIndex || 0.8,
    include_conclusion: options.includeConclusion !== false
  }];

  // Add optional parameters if provided
  if (options.subTopics && options.subTopics.length > 0) {
    requestBody[0].sub_topics = options.subTopics.slice(0, 10);
  }
  if (options.metaKeywords && options.metaKeywords.length > 0) {
    requestBody[0].meta_keywords = options.metaKeywords.slice(0, 10);
  }
  if (options.description) {
    requestBody[0].description = options.description;
  }
  if (options.supplementToken) {
    requestBody[0].supplement_token = options.supplementToken;
  }

  const response = await fetch('https://api.dataforseo.com/v3/content_generation/generate_text/live', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authString}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();

  if (data.tasks && data.tasks[0] && data.tasks[0].result && data.tasks[0].result.length > 0) {
    const result = data.tasks[0].result[0];
    return {
      content: result.text || '',
      cost: data.cost || 0,
      supplementToken: result.supplement_token,
      inputTokens: result.input_token_count,
      outputTokens: result.output_token_count
    };
  }

  throw new Error('No content generated from DataForSEO');
};

// Hybrid processing: Combine Serper Autocomplete + DataForSEO metrics
const processHybridKeywords = async (autocompleteData, originalKeyword) => {
  const keywords = [];
  const seenKeywords = new Set();

  // Collect Google autocomplete suggestions
  const googleSuggestions = [originalKeyword];
  if (autocompleteData.suggestions && Array.isArray(autocompleteData.suggestions)) {
    autocompleteData.suggestions.forEach((suggestion) => {
      const suggestionText = typeof suggestion === 'string' ? suggestion : suggestion.value;
      if (suggestionText && !seenKeywords.has(suggestionText.toLowerCase())) {
        googleSuggestions.push(suggestionText);
        seenKeywords.add(suggestionText.toLowerCase());
      }
    });
  }

  console.log(`🔍 Fetching keyword suggestions with metrics from DataForSEO for: "${originalKeyword}"`);

  try {
    // Get keyword suggestions with real metrics from DataForSEO
    const dataForSEOResult = await callDataForSEOAPI(originalKeyword);
    const metricsMap = new Map();

    // Create a map of DataForSEO keyword -> metrics
    dataForSEOResult.data.forEach(item => {
      const kw = item.keyword?.toLowerCase();
      if (kw) {
        metricsMap.set(kw, {
          keyword: item.keyword, // Keep original casing
          searchVolume: item.keyword_info?.search_volume || 0,
          cpc: item.keyword_info?.cpc || 0,
          competition: item.keyword_info?.competition || 0,
          competitionLevel: item.keyword_info?.competition_level || 'UNKNOWN',
          lowBid: item.keyword_info?.low_top_of_page_bid || 0,
          highBid: item.keyword_info?.high_top_of_page_bid || 0
        });
      }
    });

    console.log(`✅ DataForSEO returned ${metricsMap.size} keywords with metrics`);

    // Priority 1: Add DataForSEO keywords with real metrics
    metricsMap.forEach((metrics, kwLower) => {
      const isOriginal = kwLower === originalKeyword.toLowerCase();
      keywords.push({
        keyword: metrics.keyword,
        searchVolume: metrics.searchVolume,
        cpc: metrics.cpc > 0 ? `$${metrics.cpc.toFixed(2)}` : '$0.00',
        difficulty: metrics.competitionLevel,
        competition: metrics.competition,
        intent: determineIntent(metrics.keyword),
        opportunity: calculateOpportunityScore(metrics.searchVolume, metrics.competition),
        source: isOriginal ? 'Original Query' : 'DataForSEO Suggestion',
        lowBid: metrics.lowBid,
        highBid: metrics.highBid,
        dataSource: 'Real data from DataForSEO'
      });
      seenKeywords.add(kwLower);
    });

    // Priority 2: Add unique Google autocomplete suggestions (without metrics)
    googleSuggestions.forEach((suggestion) => {
      const kwLower = suggestion.toLowerCase();
      if (!seenKeywords.has(kwLower)) {
        keywords.push({
          keyword: suggestion,
          searchVolume: 0,
          cpc: '$0.00',
          difficulty: 'UNKNOWN',
          competition: 0,
          intent: determineIntent(suggestion),
          opportunity: 0,
          source: 'Google Autocomplete',
          dataSource: 'No metrics available'
        });
        seenKeywords.add(kwLower);
      }
    });

    console.log(`✅ Final result: ${keywords.length} keywords (${metricsMap.size} with metrics, ${keywords.length - metricsMap.size} from autocomplete only)`);

    return {
      success: true,
      keywords: keywords,
      totalKeywords: keywords.length,
      dataSource: 'Hybrid: Serper Autocomplete + DataForSEO Metrics',
      cost: dataForSEOResult.cost,
      analysis: {
        autocompleteResults: autocompleteData.suggestions?.length || 0,
        metricsEnriched: metricsMap.size
      }
    };
  } catch (error) {
    console.error('❌ DataForSEO enrichment failed:', error.message);
    console.log('⚠️ Falling back to autocomplete-only data');

    // Fallback to autocomplete-only if DataForSEO fails
    googleSuggestions.forEach((keyword, index) => {
      keywords.push({
        keyword: keyword,
        difficulty: calculateKeywordDifficulty(keyword, index),
        intent: determineIntent(keyword),
        source: index === 0 ? 'Original Query' : 'Google Autocomplete',
        dataSource: 'Google Autocomplete only (DataForSEO unavailable)'
      });
    });

    return {
      success: true,
      keywords: keywords,
      totalKeywords: keywords.length,
      dataSource: 'Google Autocomplete only',
      warning: 'DataForSEO metrics unavailable',
      analysis: {
        autocompleteResults: autocompleteData.suggestions?.length || 0
      }
    };
  }
};

// Legacy function - kept for backward compatibility
const processAutocompleteKeywords = (autocompleteData, responseTime, originalKeyword) => {
  const keywords = [];
  const seenKeywords = new Set();

  // Add original keyword first
  keywords.push({
    keyword: originalKeyword,
    difficulty: calculateKeywordDifficulty(originalKeyword, 0),
    intent: determineIntent(originalKeyword),
    source: 'Original Query'
  });
  seenKeywords.add(originalKeyword.toLowerCase());

  // Process autocomplete suggestions (real Google suggestions)
  if (autocompleteData.suggestions && Array.isArray(autocompleteData.suggestions)) {
    autocompleteData.suggestions.forEach((suggestion, index) => {
      const suggestionText = typeof suggestion === 'string' ? suggestion : suggestion.value;

      if (suggestionText && !seenKeywords.has(suggestionText.toLowerCase())) {
        keywords.push({
          keyword: suggestionText,
          difficulty: calculateKeywordDifficulty(suggestionText, index + 1),
          intent: determineIntent(suggestionText),
          source: 'Google Autocomplete'
        });
        seenKeywords.add(suggestionText.toLowerCase());
      }
    });
  }

  console.log(`✅ Processed ${keywords.length} keywords from Google Autocomplete`);

  return {
    success: true,
    keywords: keywords,
    totalKeywords: keywords.length,
    responseTime,
    cached: false,
    dataSource: 'Google Autocomplete via Serper API',
    analysis: {
      autocompleteResults: autocompleteData.suggestions?.length || 0
    }
  };
};

const processKeywords = (searchData, responseTime, originalKeyword) => {
  const keywords = [];

  // Extract real keywords from Serper API search data
  const realKeywords = extractRealKeywordsFromSearchData(searchData, originalKeyword);

  // Add each real keyword with calculated SEO metrics
  realKeywords.forEach((keyword, index) => {
    const searchVolume = calculateSearchVolume(keyword, originalKeyword);
    const difficulty = calculateKeywordDifficulty(keyword, index);
    const cpc = calculateCPC(keyword);
    const opportunity = calculateOpportunityScore(searchVolume, difficulty);

    keywords.push({
      keyword: keyword,
      searchVolume: searchVolume,
      difficulty: difficulty,
      cpc: cpc,
      intent: determineIntent(keyword),
      opportunity: opportunity,
      source: 'Keyword Variations'
    });
  });

  // Add related searches if available
  if (searchData.relatedSearches) {
    searchData.relatedSearches.forEach(related => {
      const searchVolume = Math.floor(Math.random() * 5000) + 2000;
      const difficulty = calculateKeywordDifficulty(related.query, keywords.length);

      keywords.push({
        keyword: related.query,
        searchVolume: searchVolume,
        difficulty: difficulty,
        cpc: calculateCPC(related.query),
        intent: determineIntent(related.query),
        opportunity: calculateOpportunityScore(searchVolume, difficulty),
        source: 'Related Searches'
      });
    });
  }

  // Add long-tail keywords from People Also Ask
  if (searchData.peopleAlsoAsk) {
    searchData.peopleAlsoAsk.forEach(paa => {
      const keywordFromQuestion = paa.question
        .toLowerCase()
        .replace(/^(what|how|why|when|where|who|which|is|are|can|do|does)\s+/i, '')
        .replace(/\?$/, '')
        .trim();

      if (keywordFromQuestion.length > 3 && keywordFromQuestion.length < 60) {
        const searchVolume = Math.floor(Math.random() * 2000) + 800; // Lower volume for long-tail
        const difficulty = 'Low'; // Long-tail usually easier to rank

        keywords.push({
          keyword: keywordFromQuestion,
          searchVolume: searchVolume,
          difficulty: difficulty,
          cpc: calculateCPC(keywordFromQuestion),
          intent: 'Informational',
          opportunity: calculateOpportunityScore(searchVolume, difficulty),
          source: 'Long-tail Questions',
          originalQuestion: paa.question
        });
      }
    });
  }

  // Sort by opportunity score (high volume, low competition = high opportunity)
  keywords.sort((a, b) => b.opportunity - a.opportunity);

  return {
    success: true,
    keywords: keywords.slice(0, 25),
    totalKeywords: Math.min(keywords.length, 25),
    responseTime,
    cached: false,
    analysis: {
      competitorArticles: searchData.organic?.length || 0,
      relatedSearches: searchData.relatedSearches?.length || 0,
      peopleAlsoAsk: searchData.peopleAlsoAsk?.length || 0
    }
  };
};

// Extract real keywords from Serper API search data instead of using templates
const extractRealKeywordsFromSearchData = (searchData, originalKeyword) => {
  const realKeywords = [originalKeyword]; // Start with original keyword
  const seenKeywords = new Set([originalKeyword.toLowerCase()]);

  try {
    // Extract keywords from organic search results (titles and snippets)
    if (searchData.organic) {
      searchData.organic.forEach(result => {
        if (result.title) {
          // Extract meaningful phrases from titles
          const titleKeywords = extractKeywordsFromText(result.title, originalKeyword);
          titleKeywords.forEach(kw => {
            if (!seenKeywords.has(kw.toLowerCase()) && kw.length > 3) {
              realKeywords.push(kw);
              seenKeywords.add(kw.toLowerCase());
            }
          });
        }

        if (result.snippet) {
          // Extract meaningful phrases from snippets
          const snippetKeywords = extractKeywordsFromText(result.snippet, originalKeyword);
          snippetKeywords.forEach(kw => {
            if (!seenKeywords.has(kw.toLowerCase()) && kw.length > 3) {
              realKeywords.push(kw);
              seenKeywords.add(kw.toLowerCase());
            }
          });
        }
      });
    }

    // Extract from "People also ask" questions
    if (searchData.peopleAlsoAsk) {
      searchData.peopleAlsoAsk.forEach(question => {
        if (question.question) {
          const questionKeywords = extractKeywordsFromText(question.question, originalKeyword);
          questionKeywords.forEach(kw => {
            if (!seenKeywords.has(kw.toLowerCase()) && kw.length > 3) {
              realKeywords.push(kw);
              seenKeywords.add(kw.toLowerCase());
            }
          });
        }
      });
    }

    // Extract from related searches
    if (searchData.relatedSearches) {
      searchData.relatedSearches.forEach(search => {
        if (search.query && !seenKeywords.has(search.query.toLowerCase())) {
          realKeywords.push(search.query);
          seenKeywords.add(search.query.toLowerCase());
        }
      });
    }

    // If we don't have enough real keywords, add some contextually relevant ones
    if (realKeywords.length < 10) {
      const contextualKeywords = generateContextualKeywords(originalKeyword);
      contextualKeywords.forEach(kw => {
        if (!seenKeywords.has(kw.toLowerCase()) && realKeywords.length < 15) {
          realKeywords.push(kw);
          seenKeywords.add(kw.toLowerCase());
        }
      });
    }

  } catch (error) {
    console.error('Error extracting real keywords:', error);
    // Fallback to contextual keywords if extraction fails
    return generateContextualKeywords(originalKeyword);
  }

  return realKeywords.slice(0, 20); // Limit to 20 keywords
};

// Extract meaningful keyword phrases from text
const extractKeywordsFromText = (text, originalKeyword) => {
  if (!text) return [];

  const keywords = [];
  const words = originalKeyword.toLowerCase().split(' ');
  const mainTopic = words[0]; // Get the main topic (e.g., "brain" from "brain plasticity")

  // Split text into phrases and filter for relevant ones
  const phrases = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2);

  // Look for phrases that contain the main topic or related concepts
  for (let i = 0; i < phrases.length - 1; i++) {
    const phrase2 = phrases[i] + ' ' + phrases[i + 1];
    const phrase3 = i < phrases.length - 2 ? phrase2 + ' ' + phrases[i + 2] : '';

    // Check 2-word phrases
    if (phrase2.includes(mainTopic) || isRelatedToKeyword(phrase2, originalKeyword)) {
      keywords.push(phrase2);
    }

    // Check 3-word phrases
    if (phrase3 && (phrase3.includes(mainTopic) || isRelatedToKeyword(phrase3, originalKeyword))) {
      keywords.push(phrase3);
    }
  }

  return [...new Set(keywords)]; // Remove duplicates
};

// Generate contextually relevant keywords based on keyword analysis
const generateContextualKeywords = (originalKeyword) => {
  const contextual = [originalKeyword];
  const lowerKeyword = originalKeyword.toLowerCase();
  const words = lowerKeyword.split(' ');
  const mainTopic = words[0];

  // Medical/Scientific keywords
  if (isScientificTopic(lowerKeyword)) {
    contextual.push(
      `${originalKeyword} research`,
      `${originalKeyword} studies`,
      `${originalKeyword} mechanisms`,
      `${originalKeyword} benefits`,
      `${originalKeyword} examples`,
      `${originalKeyword} definition`,
      `${originalKeyword} explained`,
      `how ${originalKeyword} works`,
      `${originalKeyword} applications`
    );
  }
  // Business keywords
  else if (isBusinessTopic(lowerKeyword)) {
    contextual.push(
      `${originalKeyword} strategy`,
      `${originalKeyword} tools`,
      `${originalKeyword} best practices`,
      `${originalKeyword} examples`,
      `${originalKeyword} guide`,
      `${originalKeyword} tips`,
      `how to ${originalKeyword}`,
      `${originalKeyword} benefits`,
      `${originalKeyword} methods`
    );
  }
  // Technology keywords
  else if (isTechTopic(lowerKeyword)) {
    contextual.push(
      `${originalKeyword} tutorial`,
      `${originalKeyword} guide`,
      `${originalKeyword} examples`,
      `${originalKeyword} tools`,
      `${originalKeyword} features`,
      `best ${originalKeyword}`,
      `${originalKeyword} comparison`,
      `${originalKeyword} review`,
      `${originalKeyword} alternatives`
    );
  }
  // General keywords
  else {
    contextual.push(
      `${originalKeyword} guide`,
      `${originalKeyword} tips`,
      `${originalKeyword} benefits`,
      `${originalKeyword} examples`,
      `how to ${originalKeyword}`,
      `${originalKeyword} explained`,
      `${originalKeyword} basics`,
      `${originalKeyword} overview`,
      `${originalKeyword} information`
    );
  }

  return contextual.slice(0, 15);
};

// Helper function to check if phrase is related to the main keyword
const isRelatedToKeyword = (phrase, originalKeyword) => {
  const keywords = originalKeyword.toLowerCase().split(' ');
  return keywords.some(word => phrase.includes(word));
};

// Helper functions to determine topic type
const isScientificTopic = (keyword) => {
  const scientificTerms = ['brain', 'neural', 'neuron', 'plasticity', 'cognitive', 'psychology', 'biology', 'research', 'study', 'medical', 'health'];
  return scientificTerms.some(term => keyword.includes(term));
};

const isBusinessTopic = (keyword) => {
  const businessTerms = ['marketing', 'business', 'strategy', 'management', 'sales', 'finance', 'entrepreneur', 'startup', 'company', 'corporate'];
  return businessTerms.some(term => keyword.includes(term));
};

const isTechTopic = (keyword) => {
  const techTerms = ['software', 'app', 'technology', 'digital', 'programming', 'code', 'development', 'tech', 'computer', 'algorithm'];
  return techTerms.some(term => keyword.includes(term));
};


// Calculate realistic search volume based on keyword type
const calculateSearchVolume = (keyword, originalKeyword) => {
  const baseVolume = Math.floor(Math.random() * 15000) + 5000;

  // Modifiers affect volume
  if (keyword.includes('best') || keyword.includes('top')) return Math.floor(baseVolume * 1.2);
  if (keyword.includes('how to')) return Math.floor(baseVolume * 0.8);
  if (keyword.includes('beginner')) return Math.floor(baseVolume * 0.6);
  if (keyword.includes('free')) return Math.floor(baseVolume * 1.4);
  if (keyword.includes('professional') || keyword.includes('advanced')) return Math.floor(baseVolume * 0.4);

  // Longer keywords = lower volume
  if (keyword.split(' ').length > 4) return Math.floor(baseVolume * 0.5);

  return baseVolume;
};

// Calculate keyword difficulty based on competition indicators
const calculateKeywordDifficulty = (keyword, index) => {
  const competitiveTerms = ['best', 'top', 'review', 'vs', 'comparison'];
  const easyTerms = ['how to', 'what is', 'beginner', 'tips'];

  if (competitiveTerms.some(term => keyword.toLowerCase().includes(term))) {
    return 'High';
  }

  if (easyTerms.some(term => keyword.toLowerCase().includes(term))) {
    return 'Low';
  }

  // Longer keywords are generally easier
  if (keyword.split(' ').length > 4) return 'Low';

  return 'Medium';
};

// Calculate CPC based on keyword intent and competitiveness
const calculateCPC = (keyword) => {
  const commercialTerms = ['buy', 'price', 'cost', 'cheap', 'discount', 'service', 'software'];
  const highValueTerms = ['professional', 'agency', 'enterprise', 'business'];

  let baseCPC = Math.random() * 2 + 0.5; // Base $0.50-$2.50

  if (commercialTerms.some(term => keyword.toLowerCase().includes(term))) {
    baseCPC *= 2; // Commercial intent = higher CPC
  }

  if (highValueTerms.some(term => keyword.toLowerCase().includes(term))) {
    baseCPC *= 1.5; // Business terms = higher CPC
  }

  return '$' + Math.min(baseCPC, 8).toFixed(2); // Cap at $8
};

// Calculate opportunity score: High volume + Low competition = High opportunity
const calculateOpportunityScore = (searchVolume, difficulty) => {
  let score = 50; // Base score

  // Volume impact
  if (searchVolume > 10000) score += 20;
  else if (searchVolume > 5000) score += 10;
  else if (searchVolume < 2000) score -= 10;

  // Difficulty impact
  if (difficulty === 'Low') score += 25;
  else if (difficulty === 'High') score -= 15;

  // Add some randomness
  score += Math.floor(Math.random() * 20) - 10;

  return Math.max(Math.min(score, 95), 15); // Keep between 15-95
};



// OpenRouter API functions
const getModelConfig = (modelType) => {
  const modelMap = {
    'free': 'openai/gpt-3.5-turbo',
    'budget': 'openai/gpt-4o-mini',
    'premium': 'openai/gpt-4',
    'enterprise': 'openai/gpt-4',
    'dataforseo': 'dataforseo/content-generation' // DataForSEO Content Generation API
  };

  const creditCosts = {
    'free': 5,
    'budget': 10,
    'premium': 25,
    'enterprise': 100,
    'dataforseo': 8 // Similar to budget tier
  };

  return {
    model: modelMap[modelType] || modelMap.free,
    cost: creditCosts[modelType] || creditCosts.free,
    provider: modelType === 'dataforseo' ? 'dataforseo' : 'openrouter'
  };
};

const callOpenRouterAPI = async (keyword, modelType = 'free') => {
  try {
    const { model } = getModelConfig(modelType);

    // Create context-aware, intelligent prompt based on keyword analysis
    const currentYear = new Date().getFullYear();

    const prompt = `You are an expert SEO content strategist. Analyze the keyword "${keyword}" and generate 10 highly relevant, contextually appropriate article ideas that real users would actually search for.

STEP 1 - KEYWORD ANALYSIS:
First, determine what "${keyword}" represents:
- What industry/category does it belong to?
- What type of user typically searches for this?
- What problems/needs does this keyword address?
- What's the typical search intent and user journey stage?

STEP 2 - CONTEXT-AWARE ARTICLE GENERATION:
Create article ideas that:
✅ Directly address user problems related to "${keyword}"
✅ Reflect natural search behavior patterns for this topic
✅ Match appropriate content depth and user expertise level
✅ Include relevant subtopics and related questions
✅ Consider ${currentYear} trends and current relevance
✅ Provide genuine value to the target audience

❌ STRICTLY FORBIDDEN:
- Generic templates that could work for any keyword
- Forcing unrelated topics together (like "fermented foods for business")
- Outdated year references (always use ${currentYear})
- Commercial angles where they don't naturally fit
- Overly broad or vague titles
- Topics that don't match user search intent
- Generic title patterns: "Complete Guide", "Comprehensive Guide", "Ultimate Guide", "Everything You Need to Know", "Key Insights", "Deep Dive", "Essential Guide"
- Templated phrases: "in today's world", "it's no secret that", "needless to say"
- Vague language: "experts say", "research shows", "studies indicate" (without specific attribution)
- Word counts over 2500 (keep articles focused and realistic)
- One-size-fits-all approaches that lack topic-specific context

ARTICLE TYPES TO CONSIDER (where naturally relevant):
- How-to guides and tutorials
- Problem-solving articles
- Comparison and review content
- Educational/informational pieces
- Best practices and tips
- Troubleshooting guides
- Industry insights and trends
- Case studies and examples
- Tools and resource lists
- FAQ and Q&A formats

OUTPUT REQUIREMENTS:
For each article idea, provide:
- title: Specific, contextual title that naturally includes "${keyword}" and addresses real user need
  * Must be unique and topic-specific (not a template)
  * Must directly address searcher intent
  * Must avoid all forbidden generic patterns
  * Examples of GOOD titles: "How [Topic] Affects [Specific Outcome]", "Understanding [Specific Mechanism] in [Context]", "[Number] Ways [Topic] Impacts [Specific Area]"
  * Examples of BAD titles: "Complete Guide to X", "Key Insights on X", "Everything About X"
- audience: Specific demographic who would genuinely search for this
- wordCount: Realistic length based on topic complexity (1000-2000 words max, shorter is better)
- intent: Actual search intent (informational, commercial, navigational, transactional)
- description: Clear explanation of what problem this solves or value it provides (be specific, not generic)

Format as clean JSON array: [{title, audience, wordCount, intent, description}, ...]

Generate ideas that users would actually find valuable when searching for "${keyword}".`;

    const startTime = Date.now();

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://content-flow.netlify.app',
        'X-Title': 'Content Flow - SEO Wizard'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const responseTime = Date.now() - startTime;

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenRouter API');
    }

    const content = data.choices[0].message.content;

    // Handle markdown code blocks properly
    let cleanContent = content;
    if (content.includes('```json')) {
      cleanContent = content.replace(/```json\s*/, '').replace(/\s*```$/, '');
    } else if (content.includes('```')) {
      cleanContent = content.replace(/```\s*/, '').replace(/\s*```$/, '');
    }

    let articles;
    try {
      articles = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('JSON parsing failed for content:', cleanContent.substring(0, 200));
      // Fallback: Try to extract JSON from the response
      const jsonMatch = cleanContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          articles = JSON.parse(jsonMatch[0]);
        } catch (secondParseError) {
          throw new Error(`Failed to parse article ideas: ${parseError.message}`);
        }
      } else {
        throw new Error('No valid JSON array found in API response');
      }
    }

    if (!Array.isArray(articles)) {
      console.error('Articles is not an array:', typeof articles, articles);
      throw new Error('API response is not a valid array');
    }

    if (articles.length === 0) {
      // Return a fallback response instead of throwing an error
      articles = [{
        title: `How to Get Started with ${keyword}`,
        audience: 'Beginners and enthusiasts',
        wordCount: 1200,
        intent: 'informational',
        description: `Practical introduction to ${keyword} with actionable tips and real-world examples`
      }];
    }

    return { articles, responseTime, success: true };

  } catch (error) {
    throw new Error(`OpenRouter API error: ${error.message}`);
  }
};

const generateFullArticle = async (title, wordCount = 2000, difficulty = 'medium', intent = 'informational', modelType = 'basic') => {
  try {
    const { model } = getModelConfig(modelType);
    const currentYear = new Date().getFullYear();

    // Create intelligent, human-like prompt for high-ranking content
    const prompt = `As a seasoned content strategist with 15+ years of experience in ${title.toLowerCase().includes('digital') || title.toLowerCase().includes('marketing') || title.toLowerCase().includes('business') ? 'digital marketing and business strategy' : title.toLowerCase().includes('health') || title.toLowerCase().includes('wellness') ? 'health and wellness journalism' : title.toLowerCase().includes('tech') || title.toLowerCase().includes('software') ? 'technology and software development' : 'industry expertise'}, write an authoritative, research-backed article that genuinely helps readers while naturally achieving top search rankings.

TOPIC: "${title}"

STRATEGIC APPROACH:
• Target ${intent} search intent with ${wordCount}-word comprehensive coverage
• Write for ${difficulty} understanding level with depth that satisfies both beginners and experts
• Establish genuine expertise through specific, actionable insights
• Create content worthy of citations and natural backlinks
• Address real user questions and pain points comprehensively

CONTENT REQUIREMENTS:

1. OPENING AUTHORITY (200-250 words)
Begin with a compelling hook that immediately demonstrates expertise. Share a specific insight, recent development, or counterintuitive truth about the topic. Establish credibility naturally without claims - show through knowledge depth. Preview the unique value readers will gain.

2. CORE EXPERTISE SECTIONS (4-6 sections, 300-500 words each)
Structure around user questions and natural information hierarchy. Each section should:
- Lead with the most valuable insight first
- Include specific examples, case studies, or data points
- Provide actionable steps readers can implement immediately
- Address common misconceptions or advanced considerations
- Use natural, conversational transitions between ideas

3. PRACTICAL APPLICATION (250-350 words)
Provide a clear implementation framework or step-by-step process. Include realistic timelines, potential challenges, and success metrics. Make it immediately actionable for your target audience.

4. EXPERT INSIGHTS & FUTURE OUTLOOK (200-300 words)
Share industry trends, emerging best practices, or evolving strategies. Position yourself as forward-thinking while grounding advice in current reality.

5. CONCLUSION & NEXT STEPS (150-200 words)
Synthesize key learnings into 3-4 memorable takeaways. Provide clear next actions for different reader segments (beginners vs. experienced).

HUMAN-LIKE WRITING PRINCIPLES:
• Vary sentence length dramatically (8-35 words)
• Use specific details over generic statements
• Include personal observations or industry anecdotes
• Write like explaining to an intelligent colleague
• Use contractions naturally but not excessively
• Include occasional parenthetical thoughts or brief tangents
• Mix complex and simple sentence structures
• Use industry terminology confidently but explain when needed

SEO INTEGRATION (Natural & Invisible):
• Semantic keyword clusters around main topic
• Answer related questions users actually search
• Include long-tail variations organically
• Structure for featured snippets through clear definitions and lists
• Create linkable assets through comprehensive coverage

CREDIBILITY MARKERS:
• Specific statistics with context (avoid obvious rounded numbers)
• Reference to industry developments or recent changes
• Nuanced perspectives that acknowledge complexity
• Practical limitations or caveats where relevant
• Industry-specific terminology used appropriately

OUTPUT FORMAT:
{
  "title": "${title}",
  "content": "Complete article with proper HTML formatting (h2, h3, strong, em, ul, ol tags)",
  "wordCount": [actual count],
  "readingTime": [minutes],
  "metaDescription": "Compelling 155-character description focusing on user benefit",
  "keyTakeaways": ["specific actionable insight 1", "specific actionable insight 2", "specific actionable insight 3"],
  "suggestedInternalLinks": ["naturally related topic 1", "logical follow-up topic 2", "complementary resource 3"],
  "targetAudience": "Specific persona description",
  "publishDate": "${new Date().toISOString().split('T')[0]}"
}

Create content that passes human review, provides genuine value, and naturally earns top rankings through expertise and usefulness.`;

    const startTime = Date.now();

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://content-flow.netlify.app',
        'X-Title': 'Content Flow - Full Article Generator'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: modelType === 'enterprise' ? 8000 : modelType === 'premium' ? 6000 : 4000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const responseTime = Date.now() - startTime;

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenRouter API');
    }

    const content = data.choices[0].message.content;

    // Handle markdown code blocks properly
    let cleanContent = content;
    if (content.includes('```json')) {
      cleanContent = content.replace(/```json\s*/, '').replace(/\s*```$/, '');
    } else if (content.includes('```')) {
      cleanContent = content.replace(/```\s*/, '').replace(/\s*```$/, '');
    }

    let article;
    try {
      article = JSON.parse(cleanContent);
    } catch (parseError) {
      // If JSON parsing fails, create a structured article from the raw content
      const wordCount = content.split(/\s+/).length;
      article = {
        title: title,
        content: content,
        wordCount: wordCount,
        readingTime: Math.ceil(wordCount / 250),
        metaDescription: `Comprehensive guide about ${title.split(':')[0]}. Learn everything you need to know with practical tips and expert insights.`,
        keyTakeaways: ["Expert insights provided", "Comprehensive coverage", "Actionable advice included"],
        suggestedInternalLinks: [`${title.split(' ')[0]} basics`, `Advanced ${title.split(' ')[0]} strategies`, `${title.split(' ')[0]} tools`],
        targetAudience: `People interested in ${title.split(':')[0]}`,
        publishDate: new Date().toISOString().split('T')[0]
      };
    }

    return { articles: [article], responseTime, success: true };

  } catch (error) {
    throw new Error(`Article generation error: ${error.message}`);
  }
};

// Main handler function
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({}) };
  }

  try {
    // Handle both direct function calls and redirected API calls
    let path = event.path || '';
    if (path.startsWith('/.netlify/functions/api')) {
      path = path.replace('/.netlify/functions/api', '');
    }
    // Don't strip /api prefix - endpoints expect it

    // Default to status if no path
    if (!path || path === '/') {
      path = '/api/status';
    }

    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};

    console.log(`${method} ${path}`, body);

    // API Status endpoint
    if (path === '/api/status' && method === 'GET') {
      const services = {
        serperAPI: { status: 'unknown', responseTime: null },
        openRouterAPI: { status: 'unknown', configured: false }
      };

      // Check Serper API
      try {
        const result = await callSerperAPI('test', 'us', 'en', 1);
        services.serperAPI = {
          status: 'connected',
          responseTime: result.responseTime + 'ms'
        };
      } catch (error) {
        services.serperAPI = {
          status: 'error',
          error: error.message
        };
      }

      // Check OpenRouter API configuration
      services.openRouterAPI = {
        status: OPENROUTER_API_KEY ? 'configured' : 'not_configured',
        configured: !!OPENROUTER_API_KEY
      };

      const overallStatus = services.serperAPI.status === 'connected' ? 'operational' : 'degraded';

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: overallStatus,
          services,
          availableEndpoints: [
            'GET /api/status',
            'POST /api/keywords (Serper)',
            'POST /api/search (Serper)',
            'POST /api/article-ideas (OpenRouter)',
            'POST /api/generate-article (OpenRouter)'
          ],
          timestamp: new Date().toISOString()
        })
      };
    }

    // Keywords endpoint - Hybrid: Serper Autocomplete + DataForSEO Metrics
    if (path === '/api/keywords' && method === 'POST') {
      const { keyword, location = 'us', language = 'en', count = 10 } = body;

      if (!keyword) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Keyword is required',
            code: 'MISSING_KEYWORD'
          })
        };
      }

      // Check for required API keys
      if (!SERPER_API_KEY) {
        console.error('❌ SERPER_API_KEY not configured');
        return {
          statusCode: 503,
          headers,
          body: JSON.stringify({
            error: 'Keyword research API not configured. Please contact support.',
            code: 'SERPER_NOT_CONFIGURED',
            details: 'SERPER_API_KEY environment variable is missing'
          })
        };
      }

      if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
        console.error('❌ DataForSEO credentials not configured');
        return {
          statusCode: 503,
          headers,
          body: JSON.stringify({
            error: 'Keyword metrics API not configured. Please contact support.',
            code: 'DATAFORSEO_NOT_CONFIGURED',
            details: 'DATAFORSEO credentials are missing'
          })
        };
      }

      try {
        // Step 1: Get real keyword suggestions from Google Autocomplete
        console.log(`🔍 Step 1: Fetching autocomplete suggestions for "${keyword}"`);
        const autocompleteResult = await callSerperAutocompleteAPI(keyword, location);

        // Step 2: Enrich with real metrics from DataForSEO
        console.log('📊 Step 2: Enriching with DataForSEO metrics...');
        const processedResult = await processHybridKeywords(autocompleteResult.data, keyword);

        console.log(`✅ Returning ${processedResult.totalKeywords} keywords with real metrics`);
        console.log(`   Data source: ${processedResult.dataSource}`);
        console.log(`   DataForSEO cost: $${processedResult.cost || 0}`);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            ...processedResult,
            metadata: {
              query: keyword,
              location,
              language,
              requestedCount: count,
              actualCount: processedResult.totalKeywords,
              dataSource: processedResult.dataSource,
              cost: processedResult.cost,
              note: 'Keywords from Google Autocomplete enriched with real search volume, CPC, and competition data from DataForSEO.'
            },
            timestamp: new Date().toISOString()
          })
        };
      } catch (error) {
        console.error('❌ Hybrid keyword research failed:', error.message);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch keyword data',
            message: error.message,
            code: 'KEYWORD_RESEARCH_FAILED'
          })
        };
      }
    }

    // Search endpoint
    if (path === '/api/search' && method === 'POST') {
      const { query, location = 'us', language = 'en', num = 10 } = body;

      if (!query) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Query is required',
            code: 'MISSING_QUERY'
          })
        };
      }

      try {
        const result = await callSerperAPI(query, location, language, num);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            results: result.data.organic || [],
            relatedSearches: result.data.relatedSearches || [],
            responseTime: result.responseTime,
            cached: false,
            metadata: {
              query,
              location,
              language,
              resultsCount: result.data.organic?.length || 0
            },
            timestamp: new Date().toISOString()
          })
        };
      } catch (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Search failed',
            message: error.message,
            code: 'SEARCH_FAILED'
          })
        };
      }
    }

    // Article Ideas endpoint (OpenRouter)
    if (path === '/api/article-ideas' && method === 'POST') {
      const { keyword, modelType = 'free' } = body;

      if (!keyword) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Keyword is required',
            code: 'MISSING_KEYWORD'
          })
        };
      }

      if (!OPENROUTER_API_KEY) {
        return {
          statusCode: 503,
          headers,
          body: JSON.stringify({
            error: 'Content generation service not configured',
            message: 'OpenRouter API is required for article idea generation. No template or mock data is available.',
            code: 'CONTENT_SERVICE_NOT_CONFIGURED'
          })
        };
      }

      try {
        console.log('Article ideas request - keyword:', keyword, 'modelType:', modelType);
        const { articles, responseTime } = await callOpenRouterAPI(keyword, modelType);
        const { cost } = getModelConfig(modelType);

        console.log('Article ideas generated successfully:', articles.length, 'articles');

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            ideas: articles,  // Changed from "articles" to "ideas" to match frontend expectation
            articles: articles,  // Keep for backwards compatibility
            totalArticles: articles.length,
            responseTime,
            cached: false,
            metadata: {
              keyword,
              modelType,
              model: getModelConfig(modelType).model,
              creditCost: cost,
              requestedCount: 10,
              actualCount: articles.length
            },
            timestamp: new Date().toISOString()
          })
        };
      } catch (error) {
        console.error('Article ideas generation error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Failed to generate article ideas',
            message: error.message,
            details: error.stack ? error.stack.split('\n')[0] : 'No additional details',
            code: 'ARTICLE_GENERATION_FAILED'
          })
        };
      }
    }

    // Competitor Analysis endpoint
    if (path === '/api/competitors' && method === 'POST') {
      const { keyword, url = '' } = body;

      if (!keyword) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Keyword is required',
            code: 'MISSING_KEYWORD'
          })
        };
      }

      if (!SERPER_API_KEY) {
        return {
          statusCode: 503,
          headers,
          body: JSON.stringify({
            error: 'Search API not configured',
            code: 'SERPER_NOT_CONFIGURED'
          })
        };
      }

      try {
        // Get search results for competitor analysis
        const searchResult = await callSerperAPI(keyword, 'us', 'en', 10);

        // Process competitors from organic results with null checks
        const organicResults = searchResult.data?.organic || searchResult.organic || [];

        if (organicResults.length === 0) {
          // Return a helpful response instead of throwing an error
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              competitors: [],
              message: 'No competitors found for this keyword. This might be a very niche keyword or there may be temporary search result limitations.',
              totalCompetitors: 0,
              cached: false,
              metadata: {
                keyword,
                searchEngine: 'Google',
                location: 'us',
                resultsFound: 0
              },
              timestamp: new Date().toISOString()
            })
          };
        }

        const competitors = organicResults.slice(0, 10).map((result, index) => {
          // Validate required fields
          if (!result || !result.link || !result.title) {
            console.warn('Invalid search result:', result);
            return null;
          }

          try {
            const domain = new URL(result.link).hostname.replace('www.', '');

            // Estimate domain authority based on known high-authority domains
            const domainAuthority = estimateDomainAuthority(domain) || 25;
            const backlinks = estimateBacklinks(domain, domainAuthority) || 1000;

            return {
              position: index + 1,
              title: result.title || 'Untitled Article',
              url: result.link || '',
              domain: domain || 'unknown.com',
              snippet: result.snippet || 'No description available',
              domainAuthority: domainAuthority,
              estimatedBacklinks: backlinks,
              contentLength: estimateContentLength(result.snippet) || 1200,
              publishDate: result.date || 'Recently published'
            };
          } catch (urlError) {
            console.warn('Error processing URL:', result.link, urlError);
            return null;
          }
        }).filter(Boolean); // Remove null entries

        if (competitors.length === 0) {
          throw new Error('Unable to process competitor data');
        }

        // Calculate competition metrics
        const averageDA = competitors.reduce((sum, comp) => sum + comp.domainAuthority, 0) / competitors.length;
        const averageBacklinks = competitors.reduce((sum, comp) => sum + comp.estimatedBacklinks, 0) / competitors.length;
        const averageContentLength = competitors.reduce((sum, comp) => sum + comp.contentLength, 0) / competitors.length;

        // Determine competition level
        let competitionLevel = 'Low';
        if (averageDA > 50 && averageBacklinks > 10000) competitionLevel = 'High';
        else if (averageDA > 35 && averageBacklinks > 5000) competitionLevel = 'Medium';

        // Content gaps and winning strategies require advanced content analysis
        // These would be determined by analyzing actual competitor content
        const contentGaps = [];
        const winningStrategies = [];

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            keyword,
            competitors,
            analysis: {
              competitionLevel,
              averageDomainAuthority: Math.round(averageDA),
              averageBacklinks: Math.round(averageBacklinks),
              averageContentLength: Math.round(averageContentLength),
              totalCompetitors: competitors.length,
              contentGaps,
              winningStrategies
            },
            recommendations: {
              targetWordCount: Math.round(averageContentLength * 1.2),
              requiredBacklinks: Math.round(averageBacklinks * 0.3),
              minDomainAuthority: Math.round(averageDA * 0.7)
            },
            timestamp: new Date().toISOString()
          })
        };

      } catch (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to analyze competitors',
            message: error.message,
            code: 'COMPETITOR_ANALYSIS_FAILED'
          })
        };
      }
    }

    if (path === '/api/autocomplete' && method === 'POST') {
      // Google Autocomplete suggestions endpoint
      try {
        const { keyword } = body;

        if (!keyword) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              message: 'Keyword is required'
            })
          };
        }

        // Generate autocomplete-style suggestions for the keyword
        const suggestions = generateAutocompleteSuggestions(keyword);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            keyword: keyword,
            suggestions: suggestions,
            timestamp: new Date().toISOString()
          })
        };

      } catch (error) {
        console.error('Autocomplete API Error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Autocomplete generation failed',
            error: error.message
          })
        };
      }
    }

    // OpenRouter Article Generation
    if (path === '/api/openrouter-generate' && method === 'POST') {
      try {
        let requestBody;
        try {
          requestBody = typeof body === 'string' ? JSON.parse(body) : body;
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              message: 'Invalid JSON in request body',
              error: parseError.message
            })
          };
        }

        const { model, prompt, temperature, max_tokens, stream } = requestBody;

        if (!OPENROUTER_API_KEY) {
          return {
            statusCode: 503,
            headers,
            body: JSON.stringify({
              success: false,
              message: 'OpenRouter API key not configured'
            })
          };
        }

        if (!model || !prompt) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              message: 'Model and prompt are required',
              received: { hasModel: !!model, hasPrompt: !!prompt }
            })
          };
        }

        console.log('Making OpenRouter API call with model:', model, 'stream:', stream);

        // Make OpenRouter API request
        const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'X-Title': 'SEO Wizard Content Generator'
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: temperature || 0.7,
            max_tokens: max_tokens || 4000,
            stream: stream || false
          })
        });

        console.log('OpenRouter response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('OpenRouter API error:', errorText);
          console.error('Request details:', { model, promptLength: prompt.length, max_tokens, temperature });
          return {
            statusCode: response.status,
            headers,
            body: JSON.stringify({
              success: false,
              message: `OpenRouter API error: ${response.status}`,
              error: errorText,
              details: { model, promptLength: prompt.length }
            })
          };
        }

        // If streaming is enabled, collect all chunks and return complete response
        // Note: Netlify Functions don't support true streaming, so we accumulate the response
        if (stream) {
          console.log('Processing streaming response...');
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let fullContent = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  if (content) {
                    fullContent += content;
                  }
                } catch (e) {
                  console.warn('Failed to parse stream chunk:', e);
                }
              }
            }
          }

          console.log('Streaming complete, accumulated', fullContent.length, 'characters');

          // Return accumulated content in OpenAI format
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              choices: [{
                message: {
                  content: fullContent
                }
              }]
            })
          };
        }

        // Non-streaming response (original behavior)
        const data = await response.json();
        console.log('OpenRouter response received');

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            ...data
          })
        };

      } catch (error) {
        console.error('OpenRouter API Error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Article generation failed',
            error: error.message
          })
        };
      }
    }

    // Claude Direct API Endpoint
    if (path === '/api/claude-generate' && method === 'POST') {
      try {
        let requestBody;
        try {
          requestBody = typeof body === 'string' ? JSON.parse(body) : body;
        } catch (parseError) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              message: 'Invalid JSON in request body',
              error: parseError.message
            })
          };
        }

        const { prompt, temperature, max_tokens } = requestBody;

        if (!ANTHROPIC_API_KEY) {
          console.error('ANTHROPIC_API_KEY is not set in environment variables');
          return {
            statusCode: 503,
            headers,
            body: JSON.stringify({
              success: false,
              message: 'Anthropic API key not configured'
            })
          };
        }

        console.log('ANTHROPIC_API_KEY is set:', ANTHROPIC_API_KEY ? 'YES (length: ' + ANTHROPIC_API_KEY.length + ')' : 'NO');

        if (!prompt) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              message: 'Prompt is required'
            })
          };
        }

        console.log('Making Claude API call with', max_tokens, 'max tokens');

        // Make Claude API request
        const response = await fetch(`${ANTHROPIC_BASE_URL}/messages`, {
          method: 'POST',
          headers: {
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: max_tokens || 4000,
            temperature: temperature || 0.7,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ]
          })
        });

        console.log('Claude response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Claude API error:', errorText);
          console.error('Request body was:', JSON.stringify({
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: max_tokens || 4000,
            temperature: temperature || 0.7,
            messages_preview: prompt.substring(0, 200)
          }));
          return {
            statusCode: response.status,
            headers,
            body: JSON.stringify({
              success: false,
              message: 'Claude API request failed',
              error: errorText,
              status: response.status
            })
          };
        }

        const data = await response.json();

        // Convert Claude response format to OpenAI-compatible format
        const content = data.content[0].text;

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            choices: [{
              message: {
                content: content
              }
            }]
          })
        };

      } catch (error) {
        console.error('Claude API Error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Claude API request failed',
            error: error.message
          })
        };
      }
    }

    // Helper functions for article generation
    const extractKeywordsFromContent = (title, content) => {
      const words = (title + ' ' + content)
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3);

      const wordFreq = {};
      words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      });

      return Object.entries(wordFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([word]) => word);
    };

    const calculateSimpleReadabilityScore = (content) => {
      const sentences = content.split(/[.!?]+/).length;
      const words = content.split(/\s+/).length;
      const avgWordsPerSentence = sentences > 0 ? words / sentences : 0;

      // Simple readability score (lower is easier to read)
      if (avgWordsPerSentence < 15) return 'Easy';
      if (avgWordsPerSentence < 20) return 'Medium';
      return 'Difficult';
    };

    // Full Article Generation endpoint

    // Image Generation (Placeholder - can be extended with DALL-E, Stable Diffusion, etc.)
    if (path === '/api/generate-images' && method === 'POST') {
      try {
        const { keyword, imageType, count } = JSON.parse(body);

        if (!keyword) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              message: 'Keyword is required for image generation'
            })
          };
        }

        // Mock image generation for now - replace with actual image API
        const mockImages = [];
        for (let i = 0; i < (count || 1); i++) {
          mockImages.push({
            url: `https://picsum.photos/800/600?random=${Date.now()}-${i}`,
            alt: `${imageType || 'Featured'} image for ${keyword}`,
            type: imageType || 'featured',
            prompt: `High-quality ${imageType || 'featured'} image for ${keyword}`,
            style: 'photographic'
          });
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            keyword: keyword,
            images: mockImages,
            timestamp: new Date().toISOString()
          })
        };

      } catch (error) {
        console.error('Image Generation Error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Image generation failed',
            error: error.message
          })
        };
      }
    }

    // Full Article Generation endpoint
    if (path === '/api/generate-article' && method === 'POST') {
      const { title, wordCount, difficulty, intent, model, imageType, audience } = body;

      if (!title) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Article title is required',
            code: 'MISSING_TITLE'
          })
        };
      }

      // Check if using DataForSEO provider
      const modelConfig = getModelConfig(model || 'free');
      const isDataForSEO = modelConfig.provider === 'dataforseo';

      if (!isDataForSEO && !OPENROUTER_API_KEY) {
        return {
          statusCode: 503,
          headers,
          body: JSON.stringify({
            error: 'OpenRouter API not configured',
            code: 'OPENROUTER_NOT_CONFIGURED'
          })
        };
      }

      try {
        // Model configurations (legacy - keeping for backward compatibility)
        const modelConfigs = {
          'basic': { model: 'openai/gpt-3.5-turbo', credits: 25 },
          'premium': { model: 'openai/gpt-4', credits: 50 },
          'enterprise': { model: 'anthropic/claude-3.5-sonnet', credits: 85 },
          'dataforseo': { model: 'dataforseo/content-generation', credits: modelConfig.cost }
        };

        const selectedModel = modelConfigs[model] || modelConfigs['basic'];
        const currentYear = new Date().getFullYear();

        // Enhanced focus keyword extraction for better SEO accuracy
        const stopWords = new Set(['the', 'and', 'for', 'with', 'how', 'to', 'what', 'why', 'when', 'where', 'best', 'guide', 'complete', 'ultimate', 'beginner', 'comprehensive', 'behind', 'science', 'a', 'an', 'of', 'in', 'on', 'at', 'by', 'from', 'your', 'you', 'is', 'are', 'this', 'that', 'can', 'will', 'should', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once']);

        // Extract focus keyword with better contextual understanding
        let focusKeyword;
        if (body.focusKeyword && body.focusKeyword.trim()) {
          // Use provided focus keyword if available (from bulk generation or manual input)
          focusKeyword = body.focusKeyword.trim();
        } else {
          // Improved automatic extraction
          const titleWords = title.toLowerCase()
            .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.has(word));

          // Prioritize compound terms and technical concepts
          const compounds = [];
          for (let i = 0; i < titleWords.length - 1; i++) {
            const compound = titleWords[i] + ' ' + titleWords[i + 1];
            compounds.push(compound);

            // Check for three-word compounds for technical terms
            if (i < titleWords.length - 2) {
              const threeWordCompound = compound + ' ' + titleWords[i + 2];
              compounds.push(threeWordCompound);
            }
          }

          // Select the most meaningful focus keyword
          if (compounds.length > 0 && titleWords.length >= 2) {
            // Prefer 2-word compounds for most topics
            focusKeyword = compounds[0];
          } else if (titleWords.length >= 1) {
            // Fallback to single most meaningful word
            focusKeyword = titleWords[0];
          } else {
            // Ultimate fallback
            focusKeyword = title.split(' ').find(word => word.length > 3) || title.split(' ')[0] || title;
          }
        }

        console.log('Extracted focus keyword:', focusKeyword, 'from title:', title);

        // Create comprehensive article prompt with better instructions
        const toneMap = {
          'professional': 'professional and authoritative',
          'conversational': 'conversational and engaging',
          'academic': 'academic and scholarly',
          'beginner': 'beginner-friendly and accessible',
          'expert': 'expert-level and technical'
        };

        const selectedTone = toneMap[difficulty?.toLowerCase()] || toneMap[intent?.toLowerCase()] || 'professional and engaging';

        const articlePrompt = `You are a professional SEO content writer and subject matter expert. Write a comprehensive, high-quality article on: "${title}"

CRITICAL REQUIREMENTS:
- FOCUS KEYWORD: "${focusKeyword}" - Use this EXACT phrase naturally 6-10 times throughout the article
- TARGET WORD COUNT: EXACTLY ${wordCount || 2000} words (THIS IS MANDATORY - not minimum, not maximum, but the EXACT target)
- ACTUAL WORD COUNT MUST BE: ${Math.floor((wordCount || 2000) * 0.95)} to ${Math.floor((wordCount || 2000) * 1.05)} words (within 5% of target)
- WRITING TONE: ${selectedTone}
- TARGET AUDIENCE: ${audience || 'General readers interested in the topic'}
- Intent: ${intent || 'Informational'}
- Difficulty level: ${difficulty || 'Medium'}
- Current year: ${currentYear}

AUDIENCE-SPECIFIC WRITING:
- Tailor your language, examples, and explanations to match the specified target audience
- Use terminology and references that resonate with this specific group
- Address their particular concerns, questions, and use cases
- Include relevant examples and scenarios they would relate to

CONTENT STRUCTURE REQUIREMENTS:
- Each main section MUST be 400-600 words minimum
- Write 4-6 comprehensive main sections only (fewer sections, more depth)
- Include specific examples, case studies, statistics, and actionable insights
- Use current ${currentYear} data and recent research when relevant

RESEARCH CITATION REQUIREMENTS - MANDATORY:
- NEVER use vague phrases like "research in 2024", "studies in 2025", "recent research shows", "experts say" without proper attribution
- If you mention ANY research, study, statistic, or expert opinion, you MUST include:
  * Specific author names or research team (e.g., "Dr. Jane Smith and colleagues from Harvard Medical School")
  * Complete study title or clear description
  * Publication venue with specifics (e.g., "published in Nature Medicine, March 2024")
  * Key findings with numbers/data when possible
- Example of CORRECT citation: "A 2024 longitudinal study by Dr. Sarah Chen's team at Stanford, published in the Journal of Neuroscience, tracked 500 patients over 5 years and found that targeted therapy improved outcomes by 34%."
- Example of INCORRECT citation: "Research in 2024 shows this is effective." or "Recent studies suggest..."
- If you cannot provide specific citations, write based on established knowledge WITHOUT claiming recent research
- Use varied citation integration: "According to [specific authors]...", "[Author name]'s research demonstrated...", "Findings from [specific study] revealed..."

STRUCTURE REQUIREMENTS:
1. **Introduction** (200-300 words)
   - Hook with compelling statistic or question
   - Clearly define the topic and its importance
   - Preview what readers will learn
   - Include focus keyword naturally

2. **DO NOT include a separate Table of Contents section in the article body**
   (The table will be auto-generated from your headings)

3. **Main Content Sections** (4-6 sections, each 400-600 words)
   - Use H2 headings that include variations of the focus keyword
   - Include 2-3 H3 subheadings within each section
   - Write comprehensive, detailed content for each subsection
   - Include practical examples and step-by-step guidance
   - Use bullet points and numbered lists for clarity

4. **FAQ Section** (300-400 words)
   - Create 6-8 relevant questions with detailed answers
   - Format as: ## Frequently Asked Questions
   - Then: ### Question 1: [Full question]
   - Followed by comprehensive 2-3 sentence answers
   - Include focus keyword variations in questions

5. **Conclusion** (150-200 words)
   - Summarize key takeaways
   - Include a call-to-action
   - Reinforce the main benefits

FORMATTING REQUIREMENTS:
- Use proper markdown: # for H1, ## for H2, ### for H3
- **Bold** important terms and key phrases
- Use > blockquotes for expert tips or important insights
- Include bullet points (-) and numbered lists (1.) where appropriate
- Add [internal link placeholder: related topic] where relevant
- Never include a table of contents in the article body
- Ensure proper paragraph spacing (double line breaks)

CONTENT QUALITY STANDARDS:
- Write original, valuable content that serves the reader
- Include specific, actionable advice with concrete examples
- Use real-world examples and case studies (with specific details, not generic scenarios)
- Include current industry insights and trends
- Maintain consistent expert tone throughout
- Focus on solving the reader's problems
- Each section should provide substantial value

FORBIDDEN PHRASES - DO NOT USE:
- Generic titles: "Key Insights", "A Comprehensive Guide", "Everything You Need to Know", "The Ultimate Guide", "Complete Guide"
- Vague claims: "recent research", "studies show", "experts say", "many believe"
- Templated language: "in today's world", "it's no secret that", "needless to say", "at the end of the day"
- Marketing fluff: "game-changer", "revolutionary", "cutting-edge" (unless specifically justified with evidence)
- Generic transitions: "first and foremost", "last but not least", "moving forward"

WRITING STYLE REQUIREMENTS:
- Be specific and contextual to the exact topic (avoid one-size-fits-all statements)
- Write with nuance - acknowledge complexity and different perspectives where appropriate
- Maintain objectivity - present information fairly without hyperbole
- Use clear, accessible language - avoid jargon unless necessary and defined
- Write naturally as a human expert would, not as an AI following a template
- Vary sentence structure and length for readability
- Use active voice predominantly (passive voice <10% of sentences)

Write the complete, detailed article now:`;

        console.log('Generating article with model:', selectedModel.model);

        let articleContent = '';
        let apiCost = 0;

        // Route to appropriate provider
        if (isDataForSEO) {
          console.log('📊 Using DataForSEO Content Generation API');

          // Extract keywords and subtopics from title
          const titleWords = title.split(' ').filter(w => w.length > 3);
          const metaKeywords = [focusKeyword, ...titleWords.slice(0, 5)].filter((v, i, a) => a.indexOf(v) === i).slice(0, 10);

          const dataForSEOResult = await callDataForSEOContentAPI(
            title,
            wordCount || 2000,
            {
              metaKeywords,
              description: `Article about ${focusKeyword}`,
              creativityIndex: 0.8,
              includeConclusion: true
            }
          );

          articleContent = dataForSEOResult.content;
          apiCost = dataForSEOResult.cost;

          console.log(`✅ DataForSEO generated ${dataForSEOResult.wordCount} words in ${dataForSEOResult.chunks || 1} chunk(s)`);
          console.log(`   Cost: $${apiCost.toFixed(4)}`);
        } else {
          // Make OpenRouter API request
          const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'X-Title': 'SEO Wizard Article Generator'
          },
          body: JSON.stringify({
            model: selectedModel.model,
            messages: [{
              role: 'user',
              content: articlePrompt
            }],
            temperature: 0.7,
            max_tokens: Math.min(8000, Math.floor((wordCount || 2000) * 1.5)) // Allow for comprehensive content
          })
        });

        console.log('OpenRouter response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('OpenRouter API error:', errorText);
          throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
        }

          const data = await response.json();
          articleContent = data.choices[0]?.message?.content || '';
        }

        // Generate contextually relevant images if requested
        let images = [];
        if (imageType && imageType !== 'none') {
          const imageCount = imageType === 'featured' ? 1 : imageType === 'full' ? 4 : 0;

          // Create topic-specific Unsplash URLs for relevant images
          const getTopicImage = (keyword, index = 0) => {
            // Map focus keywords to relevant Unsplash search terms
            const imageKeywordMap = {
              'neural plasticity': 'brain,neurons,neuroscience',
              'brain': 'brain,neuroscience,psychology',
              'science': 'science,research,laboratory',
              'plasticity': 'brain,neuroscience,learning',
              'digital marketing': 'marketing,digital,analytics',
              'machine learning': 'artificial-intelligence,technology,data',
              'data science': 'data,analytics,statistics',
              'web development': 'programming,coding,computer',
              'seo': 'analytics,marketing,strategy',
              'content marketing': 'content,writing,marketing',
              'social media': 'social,network,communication',
              'artificial intelligence': 'ai,technology,future',
              'cybersecurity': 'security,technology,protection',
              'cloud computing': 'cloud,technology,computing',
              'project management': 'team,collaboration,planning',
              'finance': 'finance,money,business',
              'health': 'health,wellness,fitness',
              'business': 'business,office,corporate',
              'technology': 'technology,innovation,digital'
            };

            // Find the most relevant image keyword
            let imageQuery = 'business,professional,modern';
            const lowerKeyword = focusKeyword.toLowerCase();

            for (const [key, value] of Object.entries(imageKeywordMap)) {
              if (lowerKeyword.includes(key)) {
                imageQuery = value;
                break;
              }
            }

            // Use Unsplash with specific parameters for high-quality, relevant images
            // Use Picsum as fallback since Unsplash source is deprecated
            const randomSeed = Math.floor(Math.random() * 10000) + index * 100;
            return `https://picsum.photos/seed/${encodeURIComponent(focusKeyword)}-${randomSeed}/800/600`;
          };

          // Create contextually relevant image descriptions
          const imageContexts = [
            `${focusKeyword} concept visualization`,
            `${focusKeyword} practical application`,
            `${focusKeyword} research and analysis`,
            `${focusKeyword} tools and methodology`
          ];

          for (let i = 0; i < imageCount; i++) {
            const context = imageContexts[i] || `${focusKeyword} related concept`;
            images.push({
              url: getTopicImage(focusKeyword, i),
              alt: `${context} - ${title}`,
              type: i === 0 ? 'featured' : 'section',
              prompt: context,
              style: 'professional',
              context: focusKeyword,
              source: 'unsplash'
            });
          }
        }

        // Calculate reading time and metadata
        const wordCountActual = articleContent.split(/\s+/).length;
        const readingTime = Math.ceil(wordCountActual / 250); // 250 words per minute average

        // Extract headings for table of contents with better error handling
        const headingMatches = articleContent.match(/^#{1,3}\s+(.+)$/gm) || [];
        const tableOfContents = headingMatches
          .filter(heading => heading && heading.trim().length > 0)
          .slice(0, 10)
          .map((heading, index) => {
            try {
              const level = (heading.match(/^#+/) || [''])[0].length;
              const text = heading.replace(/^#+\s+/, '').trim();

              if (!text || text.length === 0) {
                return { level: 2, text: `Section ${index + 1}`, anchor: `section-${index + 1}` };
              }

              return {
                level,
                text,
                anchor: text.toLowerCase()
                  .replace(/[^a-z0-9\s]/g, '')
                  .replace(/\s+/g, '-')
                  .substring(0, 50)
              };
            } catch (error) {
              console.error('Error processing heading:', heading, error);
              return { level: 2, text: `Section ${index + 1}`, anchor: `section-${index + 1}` };
            }
          })
          .filter(toc => toc && toc.text && toc.text !== 'undefined');

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            article: {
              title,
              content: articleContent,
              metadata: {
                wordCount: wordCountActual,
                targetWordCount: wordCount || 2000,
                readingTime: `${readingTime} min`,
                difficulty,
                intent,
                modelUsed: selectedModel.model,
                creditCost: selectedModel.credits,
                imageType: imageType || 'none',
                generatedAt: new Date().toISOString()
              },
              tableOfContents,
              images,
              seo: {
                title: title,
                metaDescription: createMetaDescription(title, articleContent, focusKeyword),
                keywords: extractKeywordsFromContent(title, articleContent),
                readabilityScore: calculateSimpleReadabilityScore(articleContent),
                focusKeyword: focusKeyword
              }
            },
            responseTime: Date.now(),
            timestamp: new Date().toISOString()
          })
        };

      } catch (error) {
        console.error('Article generation error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to generate article',
            message: error.message,
            code: 'ARTICLE_GENERATION_FAILED'
          })
        };
      }
    }

    // Content Outline Generation endpoint
    if (path === '/api/content-outline' && method === 'POST') {
      const { keyword, title, wordCount = 2000, difficulty = 'medium', competitorData } = body;

      if (!keyword) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Keyword is required',
            code: 'MISSING_KEYWORD'
          })
        };
      }

      if (!OPENROUTER_API_KEY) {
        return {
          statusCode: 503,
          headers,
          body: JSON.stringify({
            error: 'Content generation service not configured',
            message: 'OpenRouter API is required for content outline generation.',
            code: 'OPENROUTER_NOT_CONFIGURED'
          })
        };
      }

      try {
        const currentYear = new Date().getFullYear();

        // Log title parameter for debugging
        console.log('Content outline request - Keyword:', keyword, 'Title:', title || 'NOT PROVIDED');

        // Build context from competitor data if available
        let competitorContext = '';
        if (competitorData && competitorData.analysis) {
          const { analysis, recommendations } = competitorData;
          competitorContext = `

COMPETITOR ANALYSIS INSIGHTS:
- Competition Level: ${analysis.competitionLevel}
- Average Competitor Content Length: ${analysis.averageContentLength} words
- Average Domain Authority: ${analysis.averageDomainAuthority}
- Recommended Word Count: ${recommendations.targetWordCount} words
- Recommended Backlinks: ${recommendations.requiredBacklinks}

Use this data to create an outline that can outperform these competitors.`;
        }

        const prompt = `${title ? `
CRITICAL INSTRUCTION - READ THIS FIRST:
The article title is: "${title}"
YOU MUST USE THIS EXACT TITLE WITHOUT ANY CHANGES.
DO NOT add "Key Insights about", "Key Insights into", or ANY prefix.
DO NOT reword, modify, or change this title in ANY way.
The title field in your JSON response MUST be exactly: "${title}"

` : ''}You are an expert SEO content strategist. Create a detailed, SEO-optimized content outline for an article about "${keyword}".

TARGET SPECIFICATIONS:
- Word Count Target: ${wordCount} words
- Content Difficulty: ${difficulty}
- Current Year: ${currentYear}
- Search Intent: ${determineIntent(keyword)}
${competitorContext}

${title ? `
⚠️ MANDATORY TITLE REQUIREMENT ⚠️
ARTICLE TITLE (DO NOT CHANGE): "${title}"

This title was carefully crafted and MUST be used exactly as provided.
FORBIDDEN: "Key Insights about...", "Key Insights into...", "Understanding...", or ANY modification
REQUIRED: Use "${title}" exactly as written in the title field of your JSON response
` : ''}
REQUIREMENTS:
Create a comprehensive article outline that includes:

1. **Article Title**: ${title ? `"${title}" (copy this EXACTLY into your JSON response - no changes allowed)` : `Create a compelling, SEO-friendly title that naturally includes "${keyword}"`}
   ${!title ? `STRICTLY FORBIDDEN title patterns - DO NOT USE ANY OF THESE:
   ❌ "Key Insights about [anything]"
   ❌ "Key Insights into [anything]"
   ❌ "Key Insights on [anything]"
   ❌ "Understanding [anything]"
   ❌ "Complete Guide to [anything]"
   ❌ "Comprehensive Guide to [anything]"
   ❌ "Ultimate Guide to [anything]"
   ❌ "Everything You Need to Know About [anything]"
   ❌ "Deep Dive into [anything]"
   ❌ "Expert Perspective on [anything]"
   ❌ "An Expert's View of [anything]"
   ❌ ANY title that starts with a generic phrase applicable to any topic

   REQUIRED: Title must be SPECIFIC to this exact topic, not a template
   GOOD examples (specific, contextual):
   ✓ "How Mitochondrial Dysfunction Drives Parkinson's Disease Progression"
   ✓ "Mitochondrial Damage in Parkinson's: Mechanisms and Therapeutic Targets"
   ✓ "The Role of Mitochondrial Dysfunction in Neurodegenerative Disease"

   BAD examples (templated, generic):
   ✗ "Key Insights about Mitochondrial Dysfunction"
   ✗ "Understanding Mitochondrial Dysfunction in Parkinson's"
   ✗ "A Complete Guide to Mitochondrial Dysfunction"` : ''}

2. **Introduction Section** (150-250 words):
   - Hook with relevant statistic or compelling question
   - Problem identification that resonates with readers
   - Article value proposition
   - Brief preview of what will be covered

3. **Main Content Sections** (${Math.floor(wordCount * 0.65)}-${Math.floor(wordCount * 0.75)} words total):
   Create 4-6 main sections with:
   - Section heading (H2) - MUST be specific and contextual to the topic
     FORBIDDEN section heading patterns: "Key Insights", "Expert Perspective", "Research Findings", "Current Research", "Latest Studies", "What the Research Says", "Expert Opinion", "Key Takeaways", "Important Considerations"
     REQUIRED: Use descriptive, topic-specific headings like "How [Specific Process] Affects [Outcome]", "The Role of [Component] in [Context]", "[Specific Mechanism] Explained"
   - Brief description of what this section will cover
   - Key points to address (3-5 bullet points per section)
   - Suggested word count for each section
   - Subsections (H3) where appropriate - must also avoid templated patterns

4. **Supporting Elements**:
   - FAQ section (200-300 words) with 5-7 relevant questions
   - Summary box (avoid calling it "Key Takeaways" - use topic-specific title)
   - Tips section (avoid generic "Expert Tips" - be specific like "Managing [Specific Issue]" or "Optimizing [Specific Process]")
   - Common mistakes to avoid (if relevant - use specific context, not generic "mistakes")

5. **Conclusion Section** (100-150 words):
   - Summary of key points
   - Call-to-action
   - Next steps for readers

6. **SEO Elements**:
   - Suggested meta description (150-160 characters)
   - 8-10 related keywords to naturally include
   - Internal linking opportunities
   - External authority sources to reference

FORMAT YOUR RESPONSE AS JSON:
{${!title ? `
  "title": "Compelling article title with keyword",` : ''}
  "metaDescription": "SEO-optimized meta description",
  "estimatedWordCount": ${wordCount},
  "readingTime": "X min",
  "sections": [
    {
      "heading": "Section title",
      "level": "h2",
      "wordCount": 300,
      "description": "What this section covers",
      "keyPoints": ["point 1", "point 2", "point 3"],
      "subsections": [
        {
          "heading": "Subsection title",
          "level": "h3",
          "keyPoints": ["point 1", "point 2"]
        }
      ]
    }
  ],
  "faqQuestions": [
    {"question": "Q1", "answerGuidance": "Key points to cover"}
  ],
  "seoKeywords": ["keyword1", "keyword2"],
  "internalLinkingOpportunities": ["topic1", "topic2"],
  "authoritySourcesNeeded": ["type of source 1", "type of source 2"]
}

Generate a professional, actionable outline that a content writer can follow to create a top-ranking article.`;

        const startTime = Date.now();

        const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://content-flow.netlify.app',
            'X-Title': 'Content Flow - SEO Wizard'
          },
          body: JSON.stringify({
            model: 'openai/gpt-3.5-turbo',
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 2500,
            temperature: 0.7
          })
        });

        if (!response.ok) {
          throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const responseTime = Date.now() - startTime;

        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
          throw new Error('Invalid response format from OpenRouter API');
        }

        let content = data.choices[0].message.content;

        // Clean markdown code blocks
        if (content.includes('```json')) {
          content = content.replace(/```json\s*/, '').replace(/\s*```$/, '');
        } else if (content.includes('```')) {
          content = content.replace(/```\s*/, '').replace(/\s*```$/, '');
        }

        let outline;
        try {
          outline = JSON.parse(content.trim());
        } catch (parseError) {
          console.error('JSON parsing failed for outline:', content.substring(0, 200));
          // Try to extract JSON from response
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            outline = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Failed to parse content outline JSON');
          }
        }

        // FORCE SET: If title was provided, inject it into the outline
        if (title) {
          if (outline.title && outline.title !== title) {
            console.log(`⚠️ TITLE OVERRIDE - AI generated: "${outline.title}" | Using provided: "${title}"`);
          }
          outline.title = title; // Always use the provided title
        } else if (!outline.title) {
          throw new Error('No title provided and AI failed to generate one');
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            outline,
            responseTime,
            metadata: {
              keyword,
              wordCount,
              difficulty,
              hasCompetitorData: !!competitorData
            },
            timestamp: new Date().toISOString()
          })
        };

      } catch (error) {
        console.error('Content outline generation error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Failed to generate content outline',
            message: error.message,
            code: 'OUTLINE_GENERATION_FAILED'
          })
        };
      }
    }

    // Image Search Endpoint (Pexels primary, Unsplash fallback)
    if (path === '/api/pexels-images' && method === 'POST') {
      try {
        const requestBody = JSON.parse(event.body || '{}');
        const { query, count = 3 } = requestBody;

        console.log('Image search:', { query, count });

        if (!query) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              message: 'Query parameter is required'
            })
          };
        }

        let images = [];
        let source = 'none';

        // Try Pexels first
        if (PEXELS_API_KEY) {
          try {
            console.log('Trying Pexels API...');
            const response = await fetch(
              `${PEXELS_BASE_URL}/search?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
              {
                headers: {
                  'Authorization': PEXELS_API_KEY
                }
              }
            );

            if (response.ok) {
              const data = await response.json();
              if (data.photos && data.photos.length > 0) {
                images = data.photos.map(photo => ({
                  url: photo.src.large,
                  alt: photo.alt || query,
                  photographer: photo.photographer,
                  photographerUrl: photo.photographer_url,
                  width: photo.width,
                  height: photo.height,
                  source: 'pexels'
                }));
                source = 'pexels';
                console.log(`✓ Found ${images.length} images from Pexels`);
              }
            }
          } catch (pexelsError) {
            console.warn('Pexels API failed:', pexelsError.message);
          }
        }

        // Fallback to Unsplash if Pexels failed or no images found
        if (images.length === 0 && UNSPLASH_ACCESS_KEY) {
          try {
            console.log('Trying Unsplash API as fallback...');
            const response = await fetch(
              `${UNSPLASH_BASE_URL}/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`,
              {
                headers: {
                  'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
                }
              }
            );

            if (response.ok) {
              const data = await response.json();
              if (data.results && data.results.length > 0) {
                images = data.results.map(photo => ({
                  url: photo.urls.regular,
                  alt: photo.alt_description || photo.description || query,
                  photographer: photo.user.name,
                  photographerUrl: photo.user.links.html,
                  width: photo.width,
                  height: photo.height,
                  source: 'unsplash'
                }));
                source = 'unsplash';
                console.log(`✓ Found ${images.length} images from Unsplash`);
              }
            }
          } catch (unsplashError) {
            console.warn('Unsplash API failed:', unsplashError.message);
          }
        }

        // If both APIs failed, return error
        if (images.length === 0) {
          return {
            statusCode: 503,
            headers,
            body: JSON.stringify({
              success: false,
              message: 'Image search failed - both Pexels and Unsplash unavailable',
              apis_configured: {
                pexels: !!PEXELS_API_KEY,
                unsplash: !!UNSPLASH_ACCESS_KEY
              }
            })
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            images,
            source,
            total: images.length
          })
        };

      } catch (error) {
        console.error('Image Search Error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Image search failed',
            error: error.message
          })
        };
      }
    }

    // WordPress Test Connection endpoint
    if (path === '/api/wordpress-test-connection' && method === 'POST') {
      const { url, username, password, signinUrl } = body;

      if (!url || !username || !password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'URL, username, and password are required'
          })
        };
      }

      try {
        // Clean URL
        const baseUrl = url.replace(/\/$/, '');
        const wpRestUrl = `${baseUrl}/wp-json/wp/v2`;

        // Test connection by getting site info
        const testResponse = await fetch(`${wpRestUrl}/users/me`, {
          method: 'GET',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
            'Content-Type': 'application/json'
          }
        });

        if (testResponse.ok) {
          const userData = await testResponse.json();
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              message: 'Connection successful',
              data: {
                username: userData.name,
                userLogin: userData.slug,
                roles: userData.roles,
                siteUrl: baseUrl
              }
            })
          };
        } else {
          const errorText = await testResponse.text();
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: false,
              message: `Authentication failed: ${testResponse.status} ${testResponse.statusText}`,
              details: errorText
            })
          };
        }
      } catch (error) {
        console.error('WordPress connection test error:', error);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Connection failed',
            error: error.message
          })
        };
      }
    }

    // WordPress Publish Article endpoint
    if (path === '/api/wordpress-publish' && method === 'POST') {
      const { url, username, password, article, publishType = 'draft' } = body;

      if (!url || !username || !password || !article) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'URL, username, password, and article are required'
          })
        };
      }

      try {
        // Clean URL
        const baseUrl = url.replace(/\/$/, '');
        const wpRestUrl = `${baseUrl}/wp-json/wp/v2/posts`;

        // Prepare article content
        const postData = {
          title: article.title,
          content: article.content,
          status: publishType === 'now' ? 'publish' : publishType === 'scheduled' ? 'future' : 'draft',
          excerpt: article.excerpt || '',
          meta: {
            _generated_by: 'ContentFlow'
          }
        };

        // Add featured image if available
        console.log('🖼️ Featured media received:', {
          value: article.featured_media,
          type: typeof article.featured_media,
          isNumber: typeof article.featured_media === 'number',
          isGreaterThanZero: article.featured_media > 0
        });

        if (article.featured_media && article.featured_media > 0) {
          const mediaId = parseInt(article.featured_media, 10);
          if (!isNaN(mediaId) && mediaId > 0) {
            postData.featured_media = mediaId;
            console.log('✅ Setting featured_media:', postData.featured_media, 'Type:', typeof postData.featured_media);
          } else {
            console.log('❌ Invalid featured_media ID after parseInt:', {
              original: article.featured_media,
              parsed: mediaId,
              isNaN: isNaN(mediaId)
            });
          }
        } else {
          console.log('❌ No valid featured_media:', {
            value: article.featured_media,
            hasValue: !!article.featured_media,
            isPositive: article.featured_media > 0
          });
        }

        // Add categories if provided
        if (article.categories && Array.isArray(article.categories) && article.categories.length > 0) {
          postData.categories = article.categories;
          console.log('Setting categories:', postData.categories);
        }

        console.log('Publishing to WordPress with data:', {
          title: postData.title,
          status: postData.status,
          featured_media: postData.featured_media,
          categories: postData.categories,
          contentLength: postData.content?.length
        });

        // Publish to WordPress
        const publishResponse = await fetch(wpRestUrl, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(postData)
        });

        if (publishResponse.ok) {
          const responseData = await publishResponse.json();

          // Log what WordPress actually returned
          console.log('✅ WordPress response:', {
            id: responseData.id,
            link: responseData.link,
            featured_media: responseData.featured_media,
            featured_media_type: typeof responseData.featured_media
          });

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              message: 'Article published successfully',
              data: {
                postId: responseData.id,
                postUrl: responseData.link,
                status: responseData.status,
                title: responseData.title.rendered,
                featured_media: responseData.featured_media // Return this so frontend can verify
              }
            })
          };
        } else {
          const errorText = await publishResponse.text();
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: false,
              message: `Publishing failed: ${publishResponse.status} ${publishResponse.statusText}`,
              details: errorText
            })
          };
        }
      } catch (error) {
        console.error('WordPress publish error:', error);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Publishing failed',
            error: error.message
          })
        };
      }
    }

    // WordPress Category Management
    if (path === '/api/wordpress-categories' && method === 'POST') {
      const { url, username, password, action, categoryName } = body;

      if (!url || !username || !password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'URL, username, and password are required'
          })
        };
      }

      try {
        const baseUrl = url.replace(/\/$/, '');

        // If action is "create", create a new category
        if (action === 'create') {
          if (!categoryName || !categoryName.trim()) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({
                success: false,
                message: 'Category name is required'
              })
            };
          }

          const createUrl = `${baseUrl}/wp-json/wp/v2/categories`;
          const createResponse = await fetch(createUrl, {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              name: categoryName.trim(),
              slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
            })
          });

          if (createResponse.ok) {
            const newCategory = await createResponse.json();
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({
                success: true,
                category: newCategory,
                message: `Category "${newCategory.name}" created successfully`
              })
            };
          } else {
            const errorData = await createResponse.json();
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({
                success: false,
                message: errorData.message || `Failed to create category: ${createResponse.status}`,
                details: errorData
              })
            };
          }
        }

        // Default action: fetch categories
        // Add cache-busting timestamp to ensure fresh data
        const timestamp = Date.now();
        const categoriesUrl = `${baseUrl}/wp-json/wp/v2/categories?per_page=100&_=${timestamp}`;

        const response = await fetch(categoriesUrl, {
          method: 'GET',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });

        if (response.ok) {
          const categories = await response.json();
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              categories: categories
            })
          };
        } else {
          const errorText = await response.text();
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: false,
              message: `Failed to load categories: ${response.status}`,
              details: errorText
            })
          };
        }
      } catch (error) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Failed to process request',
            error: error.message
          })
        };
      }
    }

    // WordPress Deploy Template - Creates essential pages for new blogs
    if (path === '/api/wordpress-deploy-template' && method === 'POST') {
      const { url, username, password, templateKey } = body;

      if (!url || !username || !password || !templateKey) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'URL, username, password, and templateKey are required'
          })
        };
      }

      try {
        const baseUrl = url.replace(/\/$/, '');
        const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');

        // Define template pages with actual content
        const templatePages = {
          aboutUs: {
            title: 'About Us',
            content: `<h2>Welcome to Our Blog</h2>
<p>We're passionate about sharing valuable insights and knowledge with our community. Our mission is to provide high-quality, informative content that helps you achieve your goals.</p>

<h3>Our Story</h3>
<p>Founded with the vision of creating a trusted resource for readers worldwide, we've grown into a platform that values authenticity, expertise, and community engagement.</p>

<h3>What We Do</h3>
<p>We create comprehensive guides, in-depth articles, and practical resources designed to inform and inspire. Every piece of content is carefully researched and crafted to deliver real value to our readers.</p>

<h3>Our Values</h3>
<ul>
<li><strong>Quality:</strong> We prioritize accuracy and depth in every article we publish</li>
<li><strong>Transparency:</strong> We believe in honest, straightforward communication</li>
<li><strong>Community:</strong> Our readers are at the heart of everything we do</li>
<li><strong>Innovation:</strong> We stay current with the latest trends and best practices</li>
</ul>

<h3>Get In Touch</h3>
<p>We love hearing from our readers! Whether you have questions, suggestions, or just want to say hello, feel free to reach out through our <a href="/contact">contact page</a>.</p>`,
            slug: 'about'
          },
          privacy: {
            title: 'Privacy Policy',
            content: `<h2>Privacy Policy</h2>
<p><em>Last updated: ${new Date().toLocaleDateString()}</em></p>

<h3>Introduction</h3>
<p>We respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you visit our website.</p>

<h3>Information We Collect</h3>
<p>We may collect the following types of information:</p>
<ul>
<li><strong>Personal Information:</strong> Name, email address, and other contact details you voluntarily provide</li>
<li><strong>Usage Data:</strong> Information about how you use our website, including pages visited and time spent</li>
<li><strong>Cookies:</strong> Small data files stored on your device to enhance your browsing experience</li>
</ul>

<h3>How We Use Your Information</h3>
<p>We use the collected information to:</p>
<ul>
<li>Provide and maintain our website</li>
<li>Send you newsletters and updates (with your consent)</li>
<li>Improve our content and user experience</li>
<li>Respond to your inquiries and support requests</li>
<li>Analyze website usage and trends</li>
</ul>

<h3>Data Protection</h3>
<p>We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.</p>

<h3>Third-Party Services</h3>
<p>We may use third-party services (such as analytics tools) that collect, monitor, and analyze data. These services have their own privacy policies.</p>

<h3>Your Rights</h3>
<p>You have the right to:</p>
<ul>
<li>Access your personal data</li>
<li>Request correction of inaccurate data</li>
<li>Request deletion of your data</li>
<li>Opt-out of marketing communications</li>
<li>Lodge a complaint with a supervisory authority</li>
</ul>

<h3>Contact Us</h3>
<p>If you have questions about this Privacy Policy, please contact us through our <a href="/contact">contact page</a>.</p>`,
            slug: 'privacy-policy'
          },
          terms: {
            title: 'Terms of Service',
            content: `<h2>Terms of Service</h2>
<p><em>Last updated: ${new Date().toLocaleDateString()}</em></p>

<h3>Agreement to Terms</h3>
<p>By accessing our website, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.</p>

<h3>Use License</h3>
<p>Permission is granted to temporarily view and download materials on our website for personal, non-commercial use only. This license shall automatically terminate if you violate any of these restrictions.</p>

<h3>Content Disclaimer</h3>
<p>The information provided on this website is for general informational purposes only. While we strive for accuracy, we make no warranties or representations about the completeness, reliability, or accuracy of this information.</p>

<h3>Limitations of Liability</h3>
<p>We shall not be held liable for any damages arising from the use or inability to use the materials on our website, even if we or our authorized representative has been notified of the possibility of such damage.</p>

<h3>User Conduct</h3>
<p>You agree not to:</p>
<ul>
<li>Use our website for any unlawful purpose</li>
<li>Attempt to gain unauthorized access to any portion of the website</li>
<li>Interfere with or disrupt the website or servers</li>
<li>Impersonate any person or entity</li>
<li>Transmit any viruses, malware, or harmful code</li>
</ul>

<h3>Intellectual Property</h3>
<p>All content on this website, including text, graphics, logos, and images, is the property of the website owner and protected by copyright laws. Unauthorized use is prohibited.</p>

<h3>Changes to Terms</h3>
<p>We reserve the right to modify these terms at any time. Continued use of the website after changes constitutes acceptance of the modified terms.</p>

<h3>Contact Information</h3>
<p>For questions about these Terms of Service, please contact us through our <a href="/contact">contact page</a>.</p>`,
            slug: 'terms-of-service'
          },
          contact: {
            title: 'Contact Us',
            content: `<h2>Get In Touch</h2>
<p>We'd love to hear from you! Whether you have a question, feedback, or just want to say hello, feel free to reach out.</p>

<h3>How to Contact Us</h3>
<p>For general inquiries, suggestions, or feedback about our content, please email us using the form below or reach out directly.</p>

<h3>Business Inquiries</h3>
<p>For partnership opportunities, collaborations, or business-related questions, please use the contact form and indicate "Business Inquiry" in your message.</p>

<h3>Response Time</h3>
<p>We aim to respond to all inquiries within 24-48 hours during business days. Please note that response times may be longer during weekends and holidays.</p>

<div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #334155; margin: 20px 0;">
<h4 style="margin-top: 0;">Contact Form</h4>
<p><em>Note: To add a functional contact form, please install a WordPress contact form plugin like Contact Form 7, WPForms, or Gravity Forms.</em></p>
<p>In the meantime, you can reach us at: <strong>[Your Email]</strong></p>
</div>

<h3>Social Media</h3>
<p>Connect with us on social media for updates, behind-the-scenes content, and community discussions:</p>
<ul>
<li>Twitter: @yourblog</li>
<li>Facebook: /yourblog</li>
<li>Instagram: @yourblog</li>
</ul>

<p>We look forward to connecting with you!</p>`,
            slug: 'contact'
          }
        };

        const createdPages = [];
        let pagesCreated = 0;

        // Create each page
        for (const [key, pageData] of Object.entries(templatePages)) {
          try {
            const createResponse = await fetch(`${baseUrl}/wp-json/wp/v2/pages`, {
              method: 'POST',
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                title: pageData.title,
                content: pageData.content,
                slug: pageData.slug,
                status: 'publish'
              })
            });

            if (createResponse.ok) {
              const createdPage = await createResponse.json();
              createdPages.push({ key, id: createdPage.id, title: pageData.title });
              pagesCreated++;
              console.log(`✅ Created page: ${pageData.title} (ID: ${createdPage.id})`);
            } else {
              const errorData = await createResponse.json();
              console.warn(`⚠️ Failed to create ${pageData.title}:`, errorData.message);
            }
          } catch (error) {
            console.warn(`⚠️ Error creating ${pageData.title}:`, error.message);
          }
        }

        // Also create some default categories based on template
        const templateCategories = {
          health: ['Health Tips', 'Nutrition', 'Fitness', 'Wellness', 'Mental Health'],
          technology: ['Software', 'Hardware', 'Tutorials', 'Reviews', 'Tech News'],
          business: ['Entrepreneurship', 'Finance', 'Marketing', 'Strategy', 'Leadership'],
          lifestyle: ['Productivity', 'Self-Improvement', 'Minimalism', 'Habits', 'Goals'],
          food: ['Recipes', 'Cooking Tips', 'Meal Prep', 'Healthy Eating', 'Kitchen Hacks'],
          travel: ['Travel Guides', 'Budget Travel', 'Destinations', 'Travel Tips', 'Adventure']
        };

        const categories = templateCategories[templateKey] || ['Blog', 'Articles', 'Tips', 'Guides', 'News'];
        let categoriesCreated = 0;

        for (const categoryName of categories) {
          try {
            const createCatResponse = await fetch(`${baseUrl}/wp-json/wp/v2/categories`, {
              method: 'POST',
              headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                name: categoryName,
                slug: categoryName.toLowerCase().replace(/\s+/g, '-')
              })
            });

            if (createCatResponse.ok) {
              categoriesCreated++;
            }
          } catch (error) {
            console.warn(`⚠️ Error creating category ${categoryName}:`, error.message);
          }
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            pagesCreated: pagesCreated,
            categoriesCreated: categoriesCreated,
            pages: createdPages,
            message: `Successfully created ${pagesCreated} pages and ${categoriesCreated} categories`
          })
        };

      } catch (error) {
        console.error('Template deployment error:', error);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Failed to deploy template: ' + error.message,
            error: error.message
          })
        };
      }
    }

    // WordPress Create Category
    if (path === '/api/wordpress-create-category' && method === 'POST') {
      const { url, username, password, categoryName } = body;

      if (!url || !username || !password || !categoryName) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'URL, username, password, and categoryName are required'
          })
        };
      }

      try {
        const baseUrl = url.replace(/\/$/, '');
        const categoriesUrl = `${baseUrl}/wp-json/wp/v2/categories`;

        const response = await fetch(categoriesUrl, {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: categoryName,
            slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          })
        });

        if (response.ok) {
          const category = await response.json();
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              category: category
            })
          };
        } else {
          const errorText = await response.text();
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: false,
              message: `Failed to create category: ${response.status}`,
              details: errorText
            })
          };
        }
      } catch (error) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Failed to create category',
            error: error.message
          })
        };
      }
    }

    // Default 404
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        error: 'Not found',
        path,
        method,
        availableEndpoints: [
          'GET /api/status',
          'POST /api/keywords',
          'POST /api/search',
          'POST /api/article-ideas',
          'POST /api/competitors',
          'POST /api/autocomplete',
          'POST /api/openrouter-generate',
          'POST /api/generate-images',
          'POST /api/generate-article',
          'POST /api/content-outline',
          'POST /api/pexels-images',
          'POST /api/wordpress-test-connection',
          'POST /api/wordpress-publish',
          'POST /api/wordpress-categories',
          'POST /api/wordpress-create-category'
        ]
      })
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};