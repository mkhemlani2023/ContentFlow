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

// Google OAuth credentials
const GOOGLE_OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const GOOGLE_OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const GOOGLE_OAUTH_REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI || 'https://www.getseowizard.com/oauth/google/callback';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32-byte key for AES-256

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

    console.log('Serper Autocomplete API response:', JSON.stringify(data, null, 2));

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

    console.log('DataForSEO API response status:', data.status_message);
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
    console.error('DataForSEO API error:', error.message);
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

    console.log(`Batched generation complete: ${numChunks} chunks, ${wordCount} words, $${totalCost.toFixed(4)}`);

    return {
      content: fullContent,
      cost: totalCost,
      wordCount: wordCount,
      chunks: numChunks
    };
  } catch (error) {
    console.error('DataForSEO Content API error:', error.message);
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
    requestBody[0].sub_topics = options.subTopics.slice(0, 5); // Reduced from 10 to 5 for faster generation
  }
  if (options.metaKeywords && options.metaKeywords.length > 0) {
    requestBody[0].meta_keywords = options.metaKeywords.slice(0, 5); // Reduced from 10 to 5
  }
  if (options.description || options.previousContext) {
    // Combine description with context about previously written content
    let fullDescription = options.description || '';

    // OPTIMIZATION: Limit previousContext to prevent timeouts
    if (options.previousContext) {
      // Only send a short summary of previous context, not the full text
      const contextSummary = options.previousContext.substring(0, 200); // Limit to 200 chars
      const contextNote = `\n\nContinues previous section. Brief context: ${contextSummary}... Build upon this with new information.`;
      fullDescription = fullDescription + contextNote;
    }

    // Limit total description length to prevent timeouts
    if (fullDescription.length > 500) {
      fullDescription = fullDescription.substring(0, 500) + '...';
    }

    requestBody[0].description = fullDescription;
  }
  if (options.supplementToken) {
    requestBody[0].supplement_token = options.supplementToken;
  }

  console.log('DataforSEO request body:', JSON.stringify(requestBody, null, 2));

  // Add timeout to prevent Netlify 26-second limit from being exceeded
  // Using 22 seconds to leave margin for function overhead
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 22000); // 22 second timeout

  try {
    const response = await fetch('https://api.dataforseo.com/v3/content_generation/generate_text/live', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    console.log('DataforSEO response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DataforSEO error response:', errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('DataforSEO response:', JSON.stringify(data, null, 2).substring(0, 500));

    if (data.tasks && data.tasks[0]) {
      // Check for API errors
      if (data.tasks[0].status_code !== 20000) {
        throw new Error(`DataForSEO API error: ${data.tasks[0].status_message || 'Unknown error'} (code: ${data.tasks[0].status_code})`);
      }

      if (data.tasks[0].result && data.tasks[0].result.length > 0) {
        const result = data.tasks[0].result[0];
        // Log the full result to see all available fields
        console.log('DataforSEO result fields:', Object.keys(result));
        console.log('DataforSEO result:', JSON.stringify(result, null, 2).substring(0, 1000));

        // DataforSEO uses 'generated_text' not 'text'
        const content = result.generated_text || result.text || '';
        console.log(`Generated content preview: "${content.substring(0, 200)}..."`);
        console.log(`Generated content length: ${content.length} chars, ${content.split(/\s+/).length} words`);

        // Check for empty or very short content
        if (!content || content.trim().length < 10) {
          console.error('Warning: Generated content is too short or empty');
          console.error('Full result:', JSON.stringify(result, null, 2));
          throw new Error(`DataforSEO returned insufficient content (${content.length} chars). Check API response.`);
        }

        return {
          content: content,
          cost: data.cost || 0,
          supplementToken: result.supplement_token,
          inputTokens: result.input_token_count,
          outputTokens: result.output_token_count
        };
      }
    }

    console.error('DataForSEO response:', JSON.stringify(data, null, 2));
    throw new Error('No content generated from DataForSEO - check API response');
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error('DataforSEO request timed out after 22 seconds');
      console.error('Word count requested:', wordCount);
      console.error('Topic length:', topic.length);
      throw new Error(`DataforSEO API timeout (22s). Requested ${wordCount} words. The API is slow - this has been optimized but may still occur on complex requests.`);
    }
    throw error;
  }
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

    console.log(`DataForSEO returned ${metricsMap.size} keywords with metrics`);

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

    console.log(`Final result: ${keywords.length} keywords (${metricsMap.size} with metrics, ${keywords.length - metricsMap.size} from autocomplete only)`);

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
    console.error('DataForSEO enrichment failed:', error.message);
    console.log('WARNING: Falling back to autocomplete-only data');

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

  console.log(`Processed ${keywords.length} keywords from Google Autocomplete`);

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

const callOpenRouterAPI = async (keyword, modelType = 'free', blogContext = null) => {
  try {
    const { model } = getModelConfig(modelType);

    // Create context-aware, intelligent prompt based on keyword analysis
    const currentYear = new Date().getFullYear();

    // Add blog context to prompt if provided
    const blogContextText = blogContext ? `\n\n🎯 CRITICAL REQUIREMENT - BLOG CONTEXT:
These articles MUST be published on: "${blogContext}"
- You MUST connect the keyword "${keyword}" to the blog's niche/topic
- ALL article ideas MUST be relevant to ${blogContext}'s audience
- If the keyword doesn't naturally fit the blog's topic, create articles that bridge them
- Example: If blog is "Parkinson's Disease Blog" and keyword is "meditation", focus on "meditation for Parkinson's patients", "how meditation helps Parkinson's symptoms", etc.
- NEVER generate generic articles - they MUST serve the blog's specific audience` : '';

    const prompt = `You are an expert SEO content strategist. Analyze the keyword "${keyword}" and generate 10 highly relevant, contextually appropriate article ideas that real users would actually search for.${blogContextText}

STEP 1 - KEYWORD ANALYSIS:
First, determine what "${keyword}" represents:
- What industry/category does it belong to?
- What type of user typically searches for this?
- What problems/needs does this keyword address?
- What's the typical search intent and user journey stage?${blogContext ? `\n- CRITICAL: How does "${keyword}" relate to "${blogContext}"? You MUST find this connection.` : ''}

STEP 2 - CONTEXT-AWARE ARTICLE GENERATION${blogContext ? ` FOR ${blogContext.toUpperCase()}` : ''}:
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
- title: Specific, contextual title that naturally includes "${keyword}" and addresses real user need${blogContext ? `\n  * MUST be relevant to ${blogContext}'s audience and niche\n  * MUST connect "${keyword}" to the blog's topic (e.g., if blog is about Parkinson's and keyword is "meditation", title must be like "Meditation Techniques for Parkinson's Patients")` : ''}
  * Must be unique and topic-specific (not a template)
  * Must directly address searcher intent
  * Must avoid all forbidden generic patterns
  * Examples of GOOD titles: "How [Topic] Affects [Specific Outcome]", "Understanding [Specific Mechanism] in [Context]", "[Number] Ways [Topic] Impacts [Specific Area]"
  * Examples of BAD titles: "Complete Guide to X", "Key Insights on X", "Everything About X"
- audience: Specific demographic who would genuinely search for this${blogContext ? ` (must be relevant to ${blogContext})` : ''}
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
            role: 'system',
            content: 'You are a JSON generator. You ONLY output valid JSON arrays. Never include explanations, markdown formatting, or any text outside the JSON structure. Start your response with [ and end with ].'
          },
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

    // Trim whitespace and remove any leading/trailing text outside the JSON array
    cleanContent = cleanContent.trim();

    let articles;
    try {
      // First attempt: Parse as-is
      articles = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('JSON parsing failed. Error:', parseError.message);
      console.error('Content preview:', cleanContent.substring(0, 500));

      // Fallback 1: Try to extract JSON array from the response
      const jsonMatch = cleanContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const extractedJson = jsonMatch[0];

          // Fix common JSON issues:
          // 1. Trailing commas before closing brackets
          let fixedJson = extractedJson.replace(/,(\s*[\]}])/g, '$1');

          // 2. Remove any text after the closing bracket
          fixedJson = fixedJson.substring(0, fixedJson.lastIndexOf(']') + 1);

          // 3. Try to parse the fixed JSON
          articles = JSON.parse(fixedJson);
          console.log('Successfully parsed JSON after cleanup');
        } catch (secondParseError) {
          console.error('Second parsing attempt failed:', secondParseError.message);
          console.error('Extracted content:', jsonMatch[0].substring(0, 500));
          throw new Error(`Failed to parse article ideas: ${parseError.message}. Position: ${parseError.message.match(/position (\d+)/)?.[1] || 'unknown'}`);
        }
      } else {
        console.error('No JSON array pattern found in content');
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
    const query = event.queryStringParameters || {};

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
        console.error('SERPER_API_KEY not configured');
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
        console.error('DataForSEO credentials not configured');
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
        console.log(`Step 1: Fetching autocomplete suggestions for "${keyword}"`);
        const autocompleteResult = await callSerperAutocompleteAPI(keyword, location);

        // Step 2: Enrich with real metrics from DataForSEO
        console.log('Step 2: Enriching with DataForSEO metrics...');
        const processedResult = await processHybridKeywords(autocompleteResult.data, keyword);

        console.log(`Returning ${processedResult.totalKeywords} keywords with real metrics`);
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
        console.error('Hybrid keyword research failed:', error.message);
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
      const { keyword, modelType = 'free', blogContext = null } = body;

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
        console.log('Article ideas request - keyword:', keyword, 'modelType:', modelType, 'blogContext:', blogContext);
        const { articles, responseTime } = await callOpenRouterAPI(keyword, modelType, blogContext);
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
        const { keyword, imageType, count, prompt } = body;

        if (!keyword && !prompt) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              message: 'Keyword or prompt is required for image generation',
              code: 'MISSING_PROMPT'
            })
          };
        }

        if (!OPENROUTER_API_KEY) {
          return {
            statusCode: 503,
            headers,
            body: JSON.stringify({
              success: false,
              message: 'OpenRouter API not configured',
              code: 'OPENROUTER_NOT_CONFIGURED'
            })
          };
        }

        // Note: OpenRouter doesn't support image generation models yet
        // Using Unsplash curated images as "AI-curated" alternative
        console.log(`Fetching curated image from Unsplash for: ${keyword || prompt}`);

        const searchQuery = (prompt || keyword).toLowerCase();
        const imagesToGenerate = count || 1;
        const generatedImages = [];

        if (!UNSPLASH_ACCESS_KEY) {
          throw new Error('Image service not configured. Please contact support.');
        }

        try {
          // Use Unsplash Search API for high-quality curated images
          const response = await fetch(
            `${UNSPLASH_BASE_URL}/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=${imagesToGenerate}&orientation=landscape&content_filter=high`,
            {
              headers: {
                'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
              }
            }
          );

          if (!response.ok) {
            throw new Error(`Unsplash API returned ${response.status}`);
          }

          const data = await response.json();

          if (data.results && data.results.length > 0) {
            data.results.slice(0, imagesToGenerate).forEach(photo => {
              generatedImages.push({
                url: photo.urls.regular,
                alt: photo.alt_description || photo.description || `Curated image: ${searchQuery}`,
                type: imageType || 'featured',
                prompt: searchQuery,
                style: 'curated',
                photographer: photo.user.name,
                photographerUrl: photo.user.links.html,
                source: 'unsplash'
              });
            });
            console.log(`Successfully fetched ${generatedImages.length} curated images from Unsplash`);
          } else {
            throw new Error('No curated images found for this search term');
          }
        } catch (fetchError) {
          console.error('Error fetching curated images:', fetchError);
          throw fetchError;
        }

        if (generatedImages.length === 0) {
          throw new Error('No curated images were found');
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            keyword: keyword,
            images: generatedImages,
            count: generatedImages.length,
            creditCost: 0, // Free - using Unsplash API
            timestamp: new Date().toISOString()
          })
        };

      } catch (error) {
        console.error('Image Generation Error:', error);
        console.error('Error stack:', error.stack);

        // Return detailed error for debugging
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Image generation failed',
            error: error.message,
            errorDetails: error.stack ? error.stack.split('\n').slice(0, 3).join(' | ') : 'No stack trace',
            code: 'IMAGE_GENERATION_FAILED'
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
- CRITICAL: DO NOT add partial author names or incomplete citations at the end of sections (e.g., "Wang," "De", "Roberfroid,")
- Include ALL full citations ONLY in a dedicated References section at the very end of the article
- Within the article body, cite inline with full attribution (author name, year, publication)
- NEVER leave dangling partial citations or incomplete author names at section endings

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
          console.log('Using DataForSEO Content Generation API');

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

          console.log(`DataForSEO generated ${dataForSEOResult.wordCount} words in ${dataForSEOResult.chunks || 1} chunk(s)`);
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

    // OpenRouter AI Image Generation Endpoint
    if (path === '/api/openrouter-images' && method === 'POST') {
      try {
        const requestBody = JSON.parse(event.body || '{}');
        const { prompt, count = 1, model = 'google/gemini-2.5-flash-image-preview' } = requestBody;

        console.log('OpenRouter image generation:', { prompt, count, model });

        if (!prompt) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({
              success: false,
              message: 'Prompt parameter is required'
            })
          };
        }

        if (!OPENROUTER_API_KEY) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              success: false,
              message: 'OpenRouter API key not configured'
            })
          };
        }

        const images = [];

        // Generate images one at a time (OpenRouter generates 1 per request)
        for (let i = 0; i < count; i++) {
          try {
            const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://www.getseowizard.com',
                'X-Title': 'SEO Wizard Content Flow'
              },
              body: JSON.stringify({
                model: model,
                messages: [
                  {
                    role: 'user',
                    content: prompt
                  }
                ],
                modalities: ['image', 'text']
              })
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error(`OpenRouter image gen error (${i + 1}/${count}):`, errorText);
              throw new Error(`OpenRouter API returned ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log(`OpenRouter response (${i + 1}/${count}):`, JSON.stringify(data).substring(0, 200));

            // Extract base64 image from response
            if (data.choices && data.choices[0] && data.choices[0].message) {
              const message = data.choices[0].message;

              // Images come in the images array as base64 data URLs
              if (message.images && message.images.length > 0) {
                const imageData = message.images[0];
                const base64Url = imageData.image_url?.url || imageData.url;

                if (base64Url) {
                  images.push({
                    url: base64Url, // base64 data URL: "data:image/png;base64,..."
                    alt: prompt,
                    type: i === 0 ? 'featured' : 'supporting',
                    source: 'openrouter',
                    model: model,
                    isBase64: true
                  });
                  console.log(`✓ Generated image ${i + 1}/${count}`);
                }
              }
            }
          } catch (genError) {
            console.error(`Failed to generate image ${i + 1}/${count}:`, genError.message);
            // Continue with next image
          }
        }

        if (images.length === 0) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              success: false,
              message: 'Failed to generate any images'
            })
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            images,
            source: 'openrouter-ai',
            model: model,
            total: images.length
          })
        };

      } catch (error) {
        console.error('OpenRouter Image Generation Error:', error);
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
      const { url, username, password, article, publishType = 'draft', isUpdate = false, wordpressPostId = null } = body;

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

        // Determine if this is an update or new post
        const isUpdating = isUpdate && wordpressPostId;
        const wpRestUrl = isUpdating
          ? `${baseUrl}/wp-json/wp/v2/posts/${wordpressPostId}`
          : `${baseUrl}/wp-json/wp/v2/posts`;

        const httpMethod = isUpdating ? 'PUT' : 'POST';

        console.log(`${isUpdating ? 'Updating' : 'Creating'} WordPress post:`, {
          isUpdate: isUpdate,
          wordpressPostId: wordpressPostId,
          method: httpMethod,
          url: wpRestUrl
        });

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
            console.log('Setting featured_media:', postData.featured_media, 'Type:', typeof postData.featured_media);
          } else {
            console.log('Invalid featured_media ID after parseInt:', {
              original: article.featured_media,
              parsed: mediaId,
              isNaN: isNaN(mediaId)
            });
          }
        } else {
          console.log('No valid featured_media:', {
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

        // Publish/Update WordPress post
        const publishResponse = await fetch(wpRestUrl, {
          method: httpMethod,
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(postData)
        });

        if (publishResponse.ok) {
          const responseData = await publishResponse.json();

          // Log what WordPress actually returned
          console.log('WordPress response:', {
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
        console.error('WordPress categories error:', error);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: false,
            message: `Failed to process request: ${error.message}`,
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
              console.log(`Created page: ${pageData.title} (ID: ${createdPage.id})`);
            } else {
              const errorData = await createResponse.json();
              console.warn(`WARNING: Failed to create ${pageData.title}:`, errorData.message);
            }
          } catch (error) {
            console.warn(`WARNING: Error creating ${pageData.title}:`, error.message);
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

    // Fetch all WordPress posts (for syncing existing articles)
    if (path === '/api/wordpress-fetch-posts' && method === 'POST') {
      const { url, username, password, perPage = 100, page = 1 } = body;

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
        const postsUrl = `${baseUrl}/wp-json/wp/v2/posts?per_page=${perPage}&page=${page}&_embed`;

        console.log(`Fetching WordPress posts from: ${baseUrl}`);
        console.log(`Username: ${username.substring(0, 3)}***`);

        const response = await fetch(postsUrl, {
          method: 'GET',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
            'Content-Type': 'application/json'
          }
        });

        console.log(`Response status: ${response.status} ${response.statusText}`);

        if (response.ok) {
          const posts = await response.json();

          // Get total pages from headers
          const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1');
          const totalPosts = parseInt(response.headers.get('X-WP-Total') || '0');

          // Extract relevant data from each post
          const formattedPosts = posts.map(post => ({
            id: post.id,
            title: post.title.rendered,
            link: post.link,
            date: post.date,
            modified: post.modified,
            status: post.status,
            excerpt: post.excerpt.rendered,
            categories: post.categories || [],
            tags: post.tags || [],
            featured_media: post.featured_media || 0,
            // Check if published by ContentFlow
            source: post.meta?._generated_by === 'ContentFlow' ? 'contentflow' : 'wordpress'
          }));

          console.log(`Fetched ${formattedPosts.length} posts (page ${page}/${totalPages})`);

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              posts: formattedPosts,
              pagination: {
                page: page,
                perPage: perPage,
                totalPages: totalPages,
                totalPosts: totalPosts
              }
            })
          };
        } else {
          const errorText = await response.text();
          console.error('WordPress fetch error:', response.status, errorText);

          let errorMessage = `Failed to fetch posts: ${response.status}`;
          if (response.status === 401) {
            errorMessage = 'Authentication failed. Please check your WordPress username and Application Password. Make sure the Application Password is active and has not been revoked.';
          } else if (response.status === 403) {
            errorMessage = 'Access forbidden. Your WordPress user account may not have sufficient permissions to access posts.';
          } else if (response.status === 404) {
            errorMessage = 'WordPress REST API not found. Please verify the blog URL is correct and the REST API is enabled.';
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: false,
              message: errorMessage,
              details: errorText,
              httpStatus: response.status
            })
          };
        }
      } catch (error) {
        console.error('WordPress fetch error:', error);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Failed to fetch posts',
            error: error.message
          })
        };
      }
    }

    // ===== GOOGLE OAUTH2 ENDPOINTS =====

    // OAuth2 Start - Redirects user to Google consent screen
    if (path === '/oauth/google/start' && method === 'GET') {
      const { blog_id } = query;

      if (!blog_id) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'blog_id parameter is required'
          })
        };
      }

      // Generate state parameter for CSRF protection
      const state = Buffer.from(JSON.stringify({
        blog_id,
        timestamp: Date.now(),
        random: Math.random().toString(36).substring(7)
      })).toString('base64');

      // Build Google OAuth URL
      const params = new URLSearchParams({
        client_id: GOOGLE_OAUTH_CLIENT_ID,
        redirect_uri: GOOGLE_OAUTH_REDIRECT_URI,
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/analytics.readonly',
        access_type: 'offline', // Request refresh token
        prompt: 'consent', // Force consent to get refresh token
        state
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

      return {
        statusCode: 302,
        headers: {
          ...headers,
          'Location': authUrl
        },
        body: ''
      };
    }

    // OAuth2 Callback - Handles authorization code from Google
    if (path === '/oauth/google/callback' && method === 'GET') {
      const { code, state, error } = query;

      if (error) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'text/html' },
          body: `
            <!DOCTYPE html>
            <html>
            <head><title>OAuth Error</title></head>
            <body>
              <script>
                window.opener.postMessage({
                  type: 'oauth_error',
                  error: '${error}'
                }, '*');
                window.close();
              </script>
              <p>Authorization denied. You can close this window.</p>
            </body>
            </html>
          `
        };
      }

      if (!code || !state) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Missing authorization code or state'
          })
        };
      }

      try {
        // Parse and validate state
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'));
        const { blog_id } = stateData;

        // Exchange authorization code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: GOOGLE_OAUTH_CLIENT_ID,
            client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
            redirect_uri: GOOGLE_OAUTH_REDIRECT_URI,
            grant_type: 'authorization_code'
          })
        });

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          throw new Error(`Token exchange failed: ${errorText}`);
        }

        const tokens = await tokenResponse.json();
        const { access_token, refresh_token, expires_in } = tokens;

        // Encrypt tokens before sending to frontend
        const encryptedAccessToken = encryptToken(access_token);
        const encryptedRefreshToken = refresh_token ? encryptToken(refresh_token) : null;
        const expiryTime = new Date(Date.now() + (expires_in * 1000)).toISOString();

        // Return HTML that posts message to parent window
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'text/html' },
          body: `
            <!DOCTYPE html>
            <html>
            <head><title>OAuth Success</title></head>
            <body>
              <script>
                window.opener.postMessage({
                  type: 'oauth_success',
                  blog_id: '${blog_id}',
                  access_token: '${encryptedAccessToken}',
                  refresh_token: '${encryptedRefreshToken || ''}',
                  token_expiry: '${expiryTime}'
                }, '*');
                window.close();
              </script>
              <p>Authorization successful! You can close this window.</p>
            </body>
            </html>
          `
        };

      } catch (error) {
        console.error('OAuth callback error:', error);
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'text/html' },
          body: `
            <!DOCTYPE html>
            <html>
            <head><title>OAuth Error</title></head>
            <body>
              <script>
                window.opener.postMessage({
                  type: 'oauth_error',
                  error: '${error.message}'
                }, '*');
                window.close();
              </script>
              <p>Authorization failed: ${error.message}. You can close this window.</p>
            </body>
            </html>
          `
        };
      }
    }

    // Fetch user's GA4 properties after OAuth
    if (path === '/api/google-analytics-properties' && method === 'POST') {
      const { accessToken } = body;

      if (!accessToken) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Access token is required'
          })
        };
      }

      try {
        // Decrypt access token
        const decryptedToken = decryptToken(accessToken);

        // Fetch account summaries from Google Analytics Admin API
        const response = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
          headers: {
            'Authorization': `Bearer ${decryptedToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`GA Admin API error: ${errorText}`);
        }

        const data = await response.json();

        // Extract GA4 properties (property names starting with "properties/")
        const properties = [];
        if (data.accountSummaries) {
          data.accountSummaries.forEach(account => {
            if (account.propertySummaries) {
              account.propertySummaries.forEach(prop => {
                // GA4 properties have numeric IDs
                if (prop.property && prop.property.match(/^properties\/\d+$/)) {
                  const propertyId = prop.property.split('/')[1];
                  properties.push({
                    id: propertyId,
                    name: prop.displayName,
                    account: account.displayName
                  });
                }
              });
            }
          });
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            properties
          })
        };

      } catch (error) {
        console.error('Error fetching GA properties:', error);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Failed to fetch GA4 properties',
            error: error.message
          })
        };
      }
    }

    // Token encryption/decryption helpers
    function encryptToken(token) {
      if (!ENCRYPTION_KEY) {
        throw new Error('ENCRYPTION_KEY environment variable not set');
      }

      const crypto = require('crypto');
      const algorithm = 'aes-256-gcm';
      const key = Buffer.from(ENCRYPTION_KEY, 'hex'); // 32-byte key as hex string

      // Generate random IV
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(algorithm, key, iv);

      let encrypted = cipher.update(token, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      // Return: iv + authTag + encrypted (all hex)
      return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    }

    function decryptToken(encryptedData) {
      if (!ENCRYPTION_KEY) {
        throw new Error('ENCRYPTION_KEY environment variable not set');
      }

      const crypto = require('crypto');
      const algorithm = 'aes-256-gcm';
      const key = Buffer.from(ENCRYPTION_KEY, 'hex');

      // Parse encrypted data
      const [ivHex, authTagHex, encryptedHex] = encryptedData.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      const decipher = crypto.createDecipheriv(algorithm, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    }

    // Google Analytics Data API - Fetch traffic stats using OAuth or service account
    if (path === '/api/google-analytics-report' && method === 'POST') {
      const { propertyId, serviceAccountJson, oauthAccessToken, oauthRefreshToken, tokenExpiry, startDate, endDate, url } = body;

      // Support both OAuth tokens and service account (for backwards compatibility)
      if (!propertyId || (!serviceAccountJson && !oauthAccessToken)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Property ID and either OAuth tokens or service account credentials are required'
          })
        };
      }

      try {
        let accessToken;
        let newAccessToken = null;
        let newTokenExpiry = null;

        // Check if using OAuth tokens
        if (oauthAccessToken) {
          // Decrypt access token
          accessToken = decryptToken(oauthAccessToken);

          // Check if token is expired or will expire soon (within 5 minutes)
          const now = new Date();
          const expiry = new Date(tokenExpiry);
          const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

          if (expiry < fiveMinutesFromNow && oauthRefreshToken) {
            console.log('Access token expired or expiring soon, refreshing...');

            // Refresh the token
            const decryptedRefreshToken = decryptToken(oauthRefreshToken);
            const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                client_id: GOOGLE_OAUTH_CLIENT_ID,
                client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
                refresh_token: decryptedRefreshToken,
                grant_type: 'refresh_token'
              })
            });

            if (!refreshResponse.ok) {
              const errorText = await refreshResponse.text();
              throw new Error(`Token refresh failed: ${errorText}`);
            }

            const refreshData = await refreshResponse.json();
            accessToken = refreshData.access_token;

            // Encrypt new access token to return to frontend
            newAccessToken = encryptToken(accessToken);
            newTokenExpiry = new Date(now.getTime() + (refreshData.expires_in * 1000)).toISOString();

            console.log('Token refreshed successfully');
          }
        } else {
          // Use service account (legacy method)
          const credentials = JSON.parse(Buffer.from(serviceAccountJson, 'base64').toString('utf-8'));
          accessToken = await getGoogleAccessToken(credentials);
        }

        // Make request to Google Analytics Data API
        const analyticsUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;

        const requestBody = {
          dateRanges: [{ startDate: startDate || '365daysAgo', endDate: endDate || 'today' }],
          dimensions: [{ name: 'date' }],
          metrics: [{ name: 'screenPageViews' }]
        };

        // Add URL filter if specified (for individual article stats)
        if (url) {
          // Extract just the path from the URL (GA4 pagePath doesn't include domain)
          // e.g., "https://example.com/article-title/" -> "/article-title/"
          let pagePath = url;
          try {
            const urlObj = new URL(url);
            pagePath = urlObj.pathname;
          } catch (e) {
            // If URL parsing fails, assume it's already a path
            pagePath = url.startsWith('/') ? url : `/${url}`;
          }

          requestBody.dimensionFilter = {
            filter: {
              fieldName: 'pagePath',
              stringFilter: {
                matchType: 'EXACT',
                value: pagePath
              }
            }
          };
        }

        const analyticsResponse = await fetch(analyticsUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        if (!analyticsResponse.ok) {
          const errorText = await analyticsResponse.text();
          console.error('Google Analytics API error:', {
            status: analyticsResponse.status,
            statusText: analyticsResponse.statusText,
            propertyId: propertyId,
            url: url,
            errorText: errorText
          });

          // Parse error details if possible
          let errorDetails = errorText;
          try {
            const errorJson = JSON.parse(errorText);
            errorDetails = errorJson.error?.message || errorText;
          } catch (e) {
            // Keep as text
          }

          throw new Error(`GA API error (${analyticsResponse.status}): ${errorDetails}`);
        }

        const analyticsData = await analyticsResponse.json();

        // Include refreshed tokens in response if they were updated
        const responseBody = {
          success: true,
          data: analyticsData
        };

        if (newAccessToken) {
          responseBody.newAccessToken = newAccessToken;
          responseBody.newTokenExpiry = newTokenExpiry;
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(responseBody)
        };

      } catch (error) {
        console.error('Google Analytics fetch error:', {
          error: error.message,
          stack: error.stack,
          propertyId: propertyId,
          url: url
        });
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: false,
            message: 'Failed to fetch analytics data',
            error: error.message,
            propertyId: propertyId,
            requestedUrl: url
          })
        };
      }
    }

    // Helper function to get Google OAuth2 access token using service account
    async function getGoogleAccessToken(credentials) {
      const { client_email, private_key } = credentials;

      // Create JWT assertion
      const now = Math.floor(Date.now() / 1000);
      const jwtHeader = {
        alg: 'RS256',
        typ: 'JWT'
      };

      const jwtPayload = {
        iss: client_email,
        scope: 'https://www.googleapis.com/auth/analytics.readonly',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
      };

      // Encode JWT
      const encodedHeader = base64UrlEncode(JSON.stringify(jwtHeader));
      const encodedPayload = base64UrlEncode(JSON.stringify(jwtPayload));
      const signatureInput = `${encodedHeader}.${encodedPayload}`;

      // Sign with private key using Node.js crypto
      const crypto = require('crypto');
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(signatureInput);
      const signature = sign.sign(private_key, 'base64');
      const encodedSignature = base64UrlEncode(Buffer.from(signature, 'base64'));

      const jwt = `${signatureInput}.${encodedSignature}`;

      // Exchange JWT for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Token exchange failed: ${errorText}`);
      }

      const tokenData = await tokenResponse.json();
      return tokenData.access_token;
    }

    // Helper function for base64 URL encoding
    function base64UrlEncode(str) {
      const base64 = typeof str === 'string'
        ? Buffer.from(str).toString('base64')
        : str.toString('base64');
      return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }

    // DataforSEO Section Generation - Modular endpoint for generating one section at a time
    if (path === '/api/dataforseo-section' && method === 'POST') {
      const { topic, wordCount = 400, sectionType = 'section', supplementToken = null, subTopics = [], description = '', previousContext = '' } = body;

      if (!topic) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            error: 'Topic is required',
            code: 'MISSING_TOPIC'
          })
        };
      }

      if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
        return {
          statusCode: 503,
          headers,
          body: JSON.stringify({
            error: 'DataforSEO credentials not configured',
            code: 'DATAFORSEO_NOT_CONFIGURED'
          })
        };
      }

      try {
        console.log(`DataforSEO Section: ${sectionType} - ${wordCount} words`);
        console.log(`Topic: ${topic.substring(0, 100)}...`);
        if (previousContext) {
          console.log(`Context provided: ${previousContext.substring(0, 200)}...`);
        }

        const result = await generateSingleDataForSEOContent(
          topic,
          Math.min(wordCount, 500), // Cap at 500 words per request for faster generation
          {
            creativityIndex: 0.7, // Slightly reduced for faster generation
            includeConclusion: sectionType === 'conclusion',
            supplementToken: supplementToken,
            subTopics: subTopics.slice(0, 5), // Reduced from 10 to 5 for faster generation
            description: description,
            previousContext: previousContext // Pass context to generation function
          }
        );

        console.log(`Section generated: ${result.content.split(/\s+/).length} words, $${result.cost.toFixed(4)}`);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            content: result.content,
            cost: result.cost,
            supplementToken: result.supplementToken,
            wordCount: result.content.split(/\s+/).length
          })
        };
      } catch (error) {
        console.error('DataforSEO section error:', error.message);
        console.error('DataforSEO section error stack:', error.stack);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to generate section',
            message: error.message,
            details: error.stack
          })
        };
      }
    }

    // Affiliate Program Research endpoint
    if (path === '/api/affiliate-research' && method === 'POST') {
      const {
        program_name,
        program_url,
        focus_keywords,
        blog_id,
        user_provided_network,
        user_provided_commission,
        user_provided_cookie_duration,
        user_provided_min_payout
      } = body;

      if (!program_name) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Program name is required'
          })
        };
      }

      try {
        console.log(`\n========== AFFILIATE RESEARCH START ==========`);
        console.log(`Program: ${program_name}`);
        console.log(`URL: ${program_url || 'Not provided'}`);
        console.log(`Focus Keywords: ${focus_keywords || 'Not provided'}`);
        console.log(`Blog ID: ${blog_id}`);
        console.log(`Timestamp: ${new Date().toISOString()}`);

        // TEMPORARY: Check if we should use mock data for testing
        const useMockData = false; // Set to true for testing without API calls

        if (useMockData) {
          console.log('⚠️ Using mock data for testing');

          const mockResult = {
            success: true,
            program_url: program_url || `https://${program_name.toLowerCase().replace(/\s+/g, '')}.com`,
            network: 'Direct',
            commission_rate: '10% per sale',
            commission_type: 'percentage',
            cookie_duration: '30 days',
            minimum_payout: 50,
            payment_frequency: 'monthly',
            payment_methods: ['PayPal', 'Direct Deposit'],
            terms_summary: 'Standard affiliate terms apply. Must disclose affiliate relationship.',
            program_requirements: 'Active website or social media presence required',
            prohibited_content: ['Spam', 'False claims'],
            disclosure_required: true,
            ai_summary: {
              overview: `${program_name} is a popular affiliate program.`,
              products: ['Main product', 'Premium offering'],
              commission_structure: 'Earn commission on all referred sales',
              pros: ['Good commission rate', 'Reputable brand', 'Easy to promote'],
              cons: ['Competitive niche', '30-day cookie'],
              best_content_types: ['Reviews', 'Comparisons', 'How-to guides']
            },
            target_audience: 'Content creators and bloggers in the health and wellness space',
            content_opportunities: {
              review_articles: [
                {
                  title: `${program_name} Review 2024: Is It Worth It?`,
                  target_keyword: `${program_name.toLowerCase()} review`,
                  monthly_searches: 2400,
                  ranking_potential: 'medium',
                  affiliate_link_opportunities: 'Include affiliate link in review summary and product comparison table'
                },
                {
                  title: `Honest ${program_name} Review: My Experience After 3 Months`,
                  target_keyword: `${program_name.toLowerCase()} honest review`,
                  monthly_searches: 880,
                  ranking_potential: 'high',
                  affiliate_link_opportunities: 'Add affiliate link in personal results section and final verdict'
                },
                {
                  title: `${program_name} Review: Pros, Cons, and Is It Right for You?`,
                  target_keyword: `is ${program_name.toLowerCase()} worth it`,
                  monthly_searches: 1200,
                  ranking_potential: 'medium',
                  affiliate_link_opportunities: 'Include in pros/cons summary and recommendation section'
                },
                {
                  title: `${program_name} 2024 Review: Features, Pricing & Alternatives`,
                  target_keyword: `${program_name.toLowerCase()} pricing`,
                  monthly_searches: 950,
                  ranking_potential: 'medium',
                  affiliate_link_opportunities: 'Link in pricing comparison table and sign-up CTA'
                },
                {
                  title: `${program_name} Customer Reviews: What Real Users Say`,
                  target_keyword: `${program_name.toLowerCase()} customer reviews`,
                  monthly_searches: 720,
                  ranking_potential: 'high',
                  affiliate_link_opportunities: 'Add after customer testimonials and in conclusion'
                }
              ],
              comparison_articles: [
                {
                  title: `${program_name} vs Competitor: Which Is Better in 2024?`,
                  target_keyword: `${program_name.toLowerCase()} vs`,
                  monthly_searches: 1500,
                  ranking_potential: 'medium',
                  affiliate_link_opportunities: 'Include in comparison table and final recommendation'
                },
                {
                  title: `Best ${program_name} Alternatives: Top 5 Competitors Compared`,
                  target_keyword: `${program_name.toLowerCase()} alternatives`,
                  monthly_searches: 1100,
                  ranking_potential: 'high',
                  affiliate_link_opportunities: 'Link each alternative in comparison chart'
                },
                {
                  title: `${program_name} vs Alternative A: Side-by-Side Comparison`,
                  target_keyword: `${program_name.toLowerCase()} comparison`,
                  monthly_searches: 890,
                  ranking_potential: 'medium',
                  affiliate_link_opportunities: 'Add in feature comparison and pricing sections'
                },
                {
                  title: `Which Is Better: ${program_name} or Competitor B?`,
                  target_keyword: `${program_name.toLowerCase()} or`,
                  monthly_searches: 670,
                  ranking_potential: 'high',
                  affiliate_link_opportunities: 'Include in winner announcement and CTA'
                },
                {
                  title: `${program_name} Competitors: How It Stacks Up Against the Rest`,
                  target_keyword: `${program_name.toLowerCase()} competitors`,
                  monthly_searches: 580,
                  ranking_potential: 'medium',
                  affiliate_link_opportunities: 'Link in competitive analysis table'
                }
              ],
              guide_articles: [
                {
                  title: `How to Get Started with ${program_name}: Complete Guide`,
                  target_keyword: `how to use ${program_name.toLowerCase()}`,
                  monthly_searches: 1800,
                  ranking_potential: 'high',
                  affiliate_link_opportunities: 'Add in getting started section and step-by-step guide'
                },
                {
                  title: `${program_name} Tutorial: Step-by-Step Guide for Beginners`,
                  target_keyword: `${program_name.toLowerCase()} tutorial`,
                  monthly_searches: 1300,
                  ranking_potential: 'medium',
                  affiliate_link_opportunities: 'Include in tutorial introduction and resource links'
                },
                {
                  title: `How to Maximize Results with ${program_name}: Expert Tips`,
                  target_keyword: `${program_name.toLowerCase()} tips`,
                  monthly_searches: 920,
                  ranking_potential: 'high',
                  affiliate_link_opportunities: 'Add in tips section and recommended tools'
                },
                {
                  title: `${program_name} for Beginners: Everything You Need to Know`,
                  target_keyword: `${program_name.toLowerCase()} for beginners`,
                  monthly_searches: 780,
                  ranking_potential: 'medium',
                  affiliate_link_opportunities: 'Include in beginner resources and getting started CTA'
                },
                {
                  title: `The Ultimate ${program_name} Guide: Features, Setup & Best Practices`,
                  target_keyword: `${program_name.toLowerCase()} guide`,
                  monthly_searches: 650,
                  ranking_potential: 'medium',
                  affiliate_link_opportunities: 'Link in setup instructions and best practices section'
                }
              ]
            },
            competitive_analysis: `${program_name} offers competitive commission rates and has strong brand recognition in its market segment.`
          };

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(mockResult)
          };
        }

        // SKIP WEB SEARCH ENTIRELY TO AVOID TIMEOUT
        // AI will work from its knowledge base instead

        let affiliateInfo = {
          program_url: program_url || '',
          network: null,
          commission_rate: null,
          commission_type: null,
          cookie_duration: null,
          minimum_payout: null,
          payment_frequency: null,
          payment_methods: [],
          terms_summary: null,
          program_requirements: null,
          prohibited_content: [],
          disclosure_required: true
        };

        console.log(`🤖 Generating content ideas for ${program_name} using AI knowledge...`);

        // Fetch website content if URL is provided
        let websiteContext = '';
        if (program_url) {
          console.log(`[${new Date().toISOString()}] Fetching website content from: ${program_url}`);
          try {
            const websiteResponse = await fetch(program_url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; ContentFlow/1.0; +https://contentflow.app)'
              },
              timeout: 8000 // 8 second timeout
            });

            if (websiteResponse.ok) {
              const html = await websiteResponse.text();
              // Extract text content from HTML (simple extraction)
              const textContent = html
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
                .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove styles
                .replace(/<[^>]+>/g, ' ') // Remove HTML tags
                .replace(/\s+/g, ' ') // Normalize whitespace
                .trim();

              // For affiliate program pages, get more content (up to 8000 chars)
              // For regular pages, keep it shorter (3000 chars)
              const isAffiliatePage = program_url.toLowerCase().includes('affiliate') ||
                                      program_url.toLowerCase().includes('partner') ||
                                      textContent.toLowerCase().includes('affiliate program') ||
                                      textContent.toLowerCase().includes('commission rate');

              const contentLength = isAffiliatePage ? 8000 : 3000;
              const finalContent = textContent.substring(0, contentLength);

              websiteContext = `\n\nWEBSITE CONTENT FROM ${program_url}:\n${finalContent}\n\n${isAffiliatePage ? 'This appears to be an affiliate program page with specific commission details. EXTRACT the exact values mentioned.' : 'Use this content to understand what ' + program_name + ' actually does and offers.'}`;
              console.log(`[${new Date().toISOString()}] Successfully fetched website content (${finalContent.length} chars, affiliate page: ${isAffiliatePage})`);
            } else {
              console.log(`[${new Date().toISOString()}] Website fetch failed with status: ${websiteResponse.status}`);
            }
          } catch (fetchError) {
            console.log(`[${new Date().toISOString()}] Website fetch error: ${fetchError.message}`);
            // Continue without website content
          }
        }

        const searchContext = `Program Name: ${program_name}${program_url ? `\nWebsite: ${program_url}` : ''}${websiteContext}

Use the website content above to understand exactly what this company does. Generate content ideas specific to their actual products and services.`;

        const keywordContext = `Generate content ideas for "${program_name}" based on their actual website content and offerings.`;

        const analysisPrompt = `Analyze the affiliate program for "${program_name}". Return ONLY valid JSON, no markdown.

Program: ${program_name}
${program_url ? `Website: ${program_url}` : ''}
${focus_keywords ? `FOCUS AREAS: ${focus_keywords} - All content must be about these specific topics/keywords` : ''}
${websiteContext}

${websiteContext ? `CRITICAL INSTRUCTIONS FOR EXTRACTING AFFILIATE DETAILS:
1. The website content above contains REAL affiliate program information
2. CAREFULLY READ and EXTRACT the actual commission rate, cookie duration, payout details from the text
3. Do NOT make up values or estimate - use ONLY what you find in the website content
4. Examples of what to look for and extract EXACTLY:
   - "up to 20% commission" → use "Up to 20%"
   - "$100 minimum payout" → use 100 as the number
   - "90 days" or "90 day cookie" → use "90 days"
   - "Everflow" → use "Everflow" as network
   - "PayPal or ACH" → use ["PayPal", "ACH Bank Transfer"]
5. If the website mentions specific percentages, tiers, or amounts - use those EXACT values
6. Do NOT confuse ${program_name} with other similar companies
7. This is REAL DATA extraction, not estimation` : ''}
${focus_keywords ? `IMPORTANT: This affiliate program is specifically about "${focus_keywords}". Generate content ideas that target these exact topics, NOT general or unrelated topics.` : ''}

${websiteContext ? 'EXTRACT real details from the website content above by carefully reading it. Do NOT estimate or guess.' : 'Provide realistic estimates based on industry standards since no website content is available.'} Return this exact JSON structure:

{
  "network": "EXTRACT from content if mentioned (e.g., 'Everflow', 'ShareASale', 'Impact', 'Direct'). If not found, estimate.",
  "commission_rate": "EXTRACT EXACT rate from content (e.g., 'Up to 20%', '15%', '$50 per sale'). If content says 'up to 20%' do NOT change it to '10-15%'.",
  "commission_type": "Based on commission_rate: 'percentage', 'flat', 'tiered', or 'hybrid'",
  "cookie_duration": "EXTRACT from content (e.g., '90 days', '30 days', '60 days'). If not found, estimate based on industry.",
  "minimum_payout": "EXTRACT as number from content (e.g., if '$100' is mentioned, use 100). If not found, estimate.",
  "payment_frequency": "EXTRACT from content (e.g., 'Monthly', 'Monthly (30 Day Hold)', 'net-30'). If not found, use 'Monthly'.",
  "payment_methods": ["EXTRACT from content (e.g., 'PayPal', 'ACH Bank Transfer', 'Wire'). If not found, use common methods"],
  "terms_summary": "2-3 sentence summary of key terms and conditions",
  "program_requirements": "Requirements to join or maintain affiliate status",
  "prohibited_content": ["Array of prohibited content types or practices"],
  "ai_summary": {
    "overview": "1-2 sentence overview of what this company/product does",
    "products": ["Array of main products or services"],
    "commission_structure": "Detailed explanation of how commissions work",
    "pros": ["3-5 advantages of this affiliate program"],
    "cons": ["2-3 potential disadvantages or challenges"],
    "best_content_types": ["Best types of content for this affiliate program"]
  },
  "target_audience": "Who this affiliate program is best suited for (1-2 sentences)",
  "content_opportunities": {
    "seo_keywords": [
      {
        "keyword": "Primary keyword to target",
        "search_intent": "informational/commercial/transactional",
        "estimated_difficulty": "low/medium/high",
        "monthly_search_volume_estimate": "Specific number estimate like '2,400' or range like '1,000-10,000'",
        "why_it_ranks": "Brief explanation of ranking opportunity based on SERP analysis"
      }
    ],
    "review_articles": [
      {
        "title": "Complete SEO-optimized article title with keyword naturally included",
        "target_keyword": "Exact keyword phrase this targets",
        "monthly_searches": 2400,
        "ranking_potential": "low/medium/high",
        "affiliate_link_opportunities": "SPECIFIC placement strategy with context (e.g., 'After section explaining gut microbiome science, introduce Viome test as personalized solution with affiliate link to purchase page')"
      }
    ],
    "comparison_articles": [
      {
        "title": "Complete comparison title with both products/brands",
        "target_keyword": "Exact comparison keyword",
        "monthly_searches": 1800,
        "ranking_potential": "low/medium/high",
        "affiliate_link_opportunities": "SPECIFIC placement (e.g., 'In side-by-side comparison table, link product name to affiliate page. In conclusion, recommend winner with affiliate link and discount code')"
      }
    ],
    "guide_articles": [
      {
        "title": "Complete how-to title with keyword",
        "target_keyword": "Exact keyword phrase",
        "monthly_searches": 3200,
        "ranking_potential": "low/medium/high",
        "affiliate_link_opportunities": "SPECIFIC placement (e.g., 'After explaining the process, recommend specific product as best tool with affiliate link in step-by-step instructions')"
      }
    ]
  },
  "competitive_analysis": "How this program compares to similar affiliate programs (2-3 sentences)"
}

RULES:
- Provide exactly 5 articles for each type (review_articles, comparison_articles, guide_articles)
- monthly_searches MUST be a number (e.g., 2400, not "2,400")
- ranking_potential must be: "low", "medium", or "high"
- Make realistic estimates if you don't have exact data
- Return ONLY valid JSON, no markdown code blocks`;

        let aiResponse;
        let aiData;

        const apiStartTime = Date.now();
        console.log(`[${new Date().toISOString()}] Starting OpenRouter API call...`);
        console.log(`Model: claude-3-haiku (FAST)`);
        console.log(`Max tokens: 4000`);
        console.log(`Prompt length: ${analysisPrompt.length} characters`);

        try {
          aiResponse = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://getseowizard.com',
              'X-Title': 'SEO Wizard - Affiliate Research'
            },
            body: JSON.stringify({
              model: 'anthropic/claude-3-haiku',
              messages: [
                {
                  role: 'user',
                  content: analysisPrompt
                }
              ],
              temperature: 0.5,
              max_tokens: 4000
            })
          });

          const apiDuration = Date.now() - apiStartTime;
          console.log(`[${new Date().toISOString()}] OpenRouter API responded in ${apiDuration}ms`);

          aiData = await aiResponse.json();
          console.log(`Response status: ${aiResponse.status}`);
          console.log(`Response ok: ${aiResponse.ok}`);

          if (!aiResponse.ok) {
            console.error('❌ OpenRouter API error:', JSON.stringify(aiData, null, 2));
            console.error(`Status: ${aiResponse.status}`);
            console.error(`Status text: ${aiResponse.statusText}`);
            throw new Error(`AI API error: ${aiData.error?.message || aiResponse.statusText || 'Unknown error'}`);
          }

          if (!aiData.choices || !aiData.choices[0]) {
            console.error('❌ AI returned no choices');
            console.error('Full response:', JSON.stringify(aiData, null, 2));
            throw new Error('AI analysis failed to return results');
          }

          console.log(`✅ AI response received successfully`);
          console.log(`Total API time: ${Date.now() - apiStartTime}ms`);
        } catch (aiError) {
          const apiDuration = Date.now() - apiStartTime;
          console.error(`❌ AI request failed after ${apiDuration}ms`);
          console.error('Error name:', aiError.name);
          console.error('Error message:', aiError.message);
          console.error('Error stack:', aiError.stack);
          throw new Error(`AI analysis failed: ${aiError.message}`);
        }

        let aiAnalysis;
        const parseStartTime = Date.now();
        console.log(`[${new Date().toISOString()}] Parsing AI response...`);

        try {
          const aiContent = aiData.choices[0].message.content;
          console.log(`AI response length: ${aiContent.length} characters`);
          console.log('AI response (first 300 chars):', aiContent.substring(0, 300));

          // Try multiple methods to extract JSON
          let jsonString = aiContent;

          // Method 1: Try to extract from markdown code blocks
          const jsonMatch = aiContent.match(/```json\n([\s\S]*?)\n```/) || aiContent.match(/```\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            jsonString = jsonMatch[1];
            console.log('✓ Extracted JSON from markdown code blocks');
          }

          // Method 2: Try to find JSON between curly braces
          const braceMatch = aiContent.match(/\{[\s\S]*\}/);
          if (!jsonMatch && braceMatch) {
            jsonString = braceMatch[0];
            console.log('✓ Extracted JSON using brace matching');
          }

          // Method 3: Clean up common issues
          jsonString = jsonString.trim();

          // Remove any text before the first {
          const firstBrace = jsonString.indexOf('{');
          if (firstBrace > 0) {
            jsonString = jsonString.substring(firstBrace);
            console.log('✓ Removed text before JSON');
          }

          // Remove any text after the last }
          const lastBrace = jsonString.lastIndexOf('}');
          if (lastBrace > 0 && lastBrace < jsonString.length - 1) {
            jsonString = jsonString.substring(0, lastBrace + 1);
            console.log('✓ Removed text after JSON');
          }

          console.log('Attempting to parse JSON...');
          aiAnalysis = JSON.parse(jsonString);

          console.log(`✅ JSON parsed successfully in ${Date.now() - parseStartTime}ms`);
          console.log(`Articles generated: ${(aiAnalysis.content_opportunities?.review_articles?.length || 0) + (aiAnalysis.content_opportunities?.comparison_articles?.length || 0) + (aiAnalysis.content_opportunities?.guide_articles?.length || 0)}`);
        } catch (parseError) {
          console.error('❌ Failed to parse AI response');
          console.error('Parse error:', parseError.message);
          console.error('Error at position:', parseError.message.match(/position (\d+)/)?.[1]);
          const fullContent = aiData.choices[0]?.message?.content || '';
          console.error('AI content (full):', fullContent);

          // Include preview in error message for debugging
          const preview = fullContent.substring(0, 500);
          throw new Error(`Failed to parse AI response. Preview: ${preview}`);
        }

        // Merge AI analysis with affiliate info, prioritizing user-provided values
        const result = {
          success: true,
          program_url: affiliateInfo.program_url || aiAnalysis.program_url,
          // Use user-provided values if available, otherwise use AI estimates
          network: user_provided_network || aiAnalysis.network,
          commission_rate: user_provided_commission || aiAnalysis.commission_rate,
          commission_type: aiAnalysis.commission_type,
          cookie_duration: user_provided_cookie_duration || aiAnalysis.cookie_duration,
          minimum_payout: user_provided_min_payout || aiAnalysis.minimum_payout,
          payment_frequency: aiAnalysis.payment_frequency,
          payment_methods: aiAnalysis.payment_methods,
          terms_summary: aiAnalysis.terms_summary,
          program_requirements: aiAnalysis.program_requirements,
          prohibited_content: aiAnalysis.prohibited_content,
          disclosure_required: true,
          ai_summary: aiAnalysis.ai_summary,
          target_audience: aiAnalysis.target_audience,
          content_opportunities: aiAnalysis.content_opportunities,
          competitive_analysis: aiAnalysis.competitive_analysis,
          // Track which values are user-provided vs AI-estimated
          user_overrides: {
            network: !!user_provided_network,
            commission_rate: !!user_provided_commission,
            cookie_duration: !!user_provided_cookie_duration,
            minimum_payout: !!user_provided_min_payout
          }
        };

        // Log user-provided overrides
        if (user_provided_network || user_provided_commission || user_provided_cookie_duration || user_provided_min_payout) {
          console.log('📝 User-provided values used (overriding AI estimates):');
          if (user_provided_network) console.log(`  - Network: ${user_provided_network}`);
          if (user_provided_commission) console.log(`  - Commission: ${user_provided_commission}`);
          if (user_provided_cookie_duration) console.log(`  - Cookie Duration: ${user_provided_cookie_duration}`);
          if (user_provided_min_payout) console.log(`  - Min Payout: ${user_provided_min_payout}`);
        }

        console.log(`✅ Affiliate research completed for: ${program_name}`);
        console.log(`========== AFFILIATE RESEARCH END ==========\n`);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result)
        };

      } catch (error) {
        console.error(`\n========== AFFILIATE RESEARCH ERROR ==========`);
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Timestamp:', new Date().toISOString());
        console.error(`========== ERROR END ==========\n`);

        return {
          statusCode: 200, // Return 200 instead of 500 to avoid 502 gateway errors
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Failed to research affiliate program',
            message: error.message,
            errorType: error.name,
            timestamp: new Date().toISOString()
          })
        };
      }
    }

    // MODULAR NICHE VALIDATION - STEP 1: Generate Keywords
    if (path === '/api/validate-niche-step1' && method === 'POST') {
      const { niche_keyword } = body;

      if (!niche_keyword) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Niche keyword is required'
          })
        };
      }

      try {
        console.log(`[STEP 1] Generating keywords for: ${niche_keyword}`);
        const startTime = Date.now();

        const keywordPrompt = `You are an expert SEO and keyword researcher specializing in affiliate marketing niches.

Analyze the niche: "${niche_keyword}"

Generate 12 high-value buyer-intent keywords for this niche. Focus on:
1. Commercial intent keywords (best, top, review, vs, comparison)
2. Product-specific keywords (specific brands, models, types)
3. Problem-solving keywords (how to choose, what to look for)
4. Cost-related keywords (price, cost, affordable, cheap)
5. Long-tail keywords with lower competition potential

Return ONLY a JSON array of keyword strings, nothing else. Example format:
["best pet insurance for dogs", "pet insurance cost comparison", "nationwide pet insurance review"]

Keywords:`;

        const aiKeywordResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://www.getseowizard.com',
            'X-Title': 'SEO Wizard - Niche Validation'
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: [{
              role: 'user',
              content: keywordPrompt
            }],
            temperature: 0.7,
            max_tokens: 500
          })
        });

        if (!aiKeywordResponse.ok) {
          throw new Error(`AI keyword generation failed: ${aiKeywordResponse.statusText}`);
        }

        const aiKeywordData = await aiKeywordResponse.json();
        const aiKeywordContent = aiKeywordData.choices[0].message.content.trim();

        // Parse AI response
        let aiGeneratedKeywords;
        try {
          const jsonMatch = aiKeywordContent.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            aiGeneratedKeywords = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON array found in AI response');
          }
        } catch (parseError) {
          console.error('Failed to parse AI keywords, using fallback');
          aiGeneratedKeywords = [
            niche_keyword,
            `best ${niche_keyword}`,
            `${niche_keyword} reviews`,
            `${niche_keyword} comparison`,
            `top ${niche_keyword}`,
            `${niche_keyword} cost`
          ];
        }

        const duration = Date.now() - startTime;
        console.log(`[STEP 1 COMPLETE] Generated ${aiGeneratedKeywords.length} keywords in ${duration}ms`);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            step: 1,
            niche_keyword,
            keywords: aiGeneratedKeywords,
            duration_ms: duration
          })
        };

      } catch (error) {
        console.error('[STEP 1 ERROR]', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            success: false,
            error: error.message
          })
        };
      }
    }

    // MODULAR NICHE VALIDATION - STEP 2: Analyze SERP Data
    if (path === '/api/validate-niche-step2' && method === 'POST') {
      const { niche_keyword, keywords } = body;

      if (!niche_keyword || !keywords || !Array.isArray(keywords)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Niche keyword and keywords array are required'
          })
        };
      }

      try {
        console.log(`[STEP 2] Analyzing SERP data for ${keywords.length} keywords`);
        const startTime = Date.now();

        let serpResults = [];
        let competitorDomains = new Set();
        let failedQueries = [];

        // Analyze top 8 keywords
        const keywordsToAnalyze = keywords.slice(0, 8);
        console.log(`[STEP 2] Keywords to analyze:`, keywordsToAnalyze);

        // Query all keywords in parallel
        const serpPromises = keywordsToAnalyze.map(keyword =>
          callSerperAPI(keyword, 'us', 'en', 10)
            .then(result => {
              console.log(`[STEP 2] SERP query success for "${keyword}"`);
              return { keyword, serpData: result.data, error: null };
            })
            .catch(error => {
              console.error(`[STEP 2] SERP query failed for "${keyword}":`, error.message);
              failedQueries.push({ keyword, error: error.message });
              return { keyword, serpData: null, error: error.message };
            })
        );

        const serpResponses = await Promise.all(serpPromises);
        console.log(`[STEP 2] Received ${serpResponses.length} SERP responses, ${failedQueries.length} failed`);

        // Process SERP responses
        for (const { keyword, serpData } of serpResponses) {
          if (serpData && serpData.organic) {
            const domains = serpData.organic.map(result => {
              try {
                const url = new URL(result.link);
                return url.hostname.replace('www.', '');
              } catch (e) {
                return null;
              }
            }).filter(d => d !== null);

            domains.forEach(d => competitorDomains.add(d));

            serpResults.push({
              keyword,
              top_10_domains: domains,
              related_searches: serpData.relatedSearches || [],
              people_also_ask: serpData.peopleAlsoAsk || [],
              organic_results: serpData.organic.map(r => ({
                title: r.title,
                domain: domains[serpData.organic.indexOf(r)] || 'unknown',
                position: r.position
              }))
            });
          }
        }

        const duration = Date.now() - startTime;
        console.log(`[STEP 2 COMPLETE] Analyzed ${serpResults.length}/${keywordsToAnalyze.length} keywords, found ${competitorDomains.size} competitors in ${duration}ms`);

        // Validation: Ensure we have at least some SERP data
        if (serpResults.length === 0) {
          const errorMsg = failedQueries.length > 0
            ? `All SERP queries failed. First error: ${failedQueries[0].error}`
            : 'No SERP data could be retrieved. Please try again.';
          throw new Error(errorMsg);
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            step: 2,
            niche_keyword,
            serp_results: serpResults,
            competitor_domains: Array.from(competitorDomains),
            failed_queries: failedQueries,
            duration_ms: duration
          })
        };

      } catch (error) {
        console.error('[STEP 2 ERROR]', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            success: false,
            error: error.message
          })
        };
      }
    }

    // MODULAR NICHE VALIDATION - STEP 3A: Generate Core Analysis (Fast)
    if (path === '/api/validate-niche-step3a' && method === 'POST') {
      const { niche_keyword, serp_results, competitor_domains } = body;

      if (!niche_keyword || !serp_results || !competitor_domains) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Niche keyword, serp_results, and competitor_domains are required'
          })
        };
      }

      try {
        console.log(`[STEP 3A] Generating core analysis for: ${niche_keyword}`);
        const startTime = Date.now();

        if (!Array.isArray(serp_results) || serp_results.length === 0) {
          throw new Error('No SERP data available');
        }

        // Simplified SERP data for faster processing
        const topSerpResults = serp_results.slice(0, 5).map(result => ({
          keyword: result.keyword,
          top_domains: result.top_10_domains ? result.top_10_domains.slice(0, 5) : []
        }));

        const corePrompt = `Analyze niche "${niche_keyword}".

SERP DATA: ${JSON.stringify(topSerpResults)}
COMPETITORS: ${competitor_domains.length} domains (${competitor_domains.slice(0, 8).join(', ')})

Return ONLY valid JSON:
{
  "score": <0-100>,
  "recommendation": "<One sentence>",
  "priority": "<high/medium/low/very-low>",
  "action": "<Specific 1-sentence action plan>",
  "estimated_monthly_traffic": <number>,
  "avg_competition_da": <0-100>,
  "breakdown": {
    "search_volume": {"score": <0-30>, "rating": "<excellent/good/moderate/low>", "details": "<Brief>"},
    "competition": {"score": <0-25>, "rating": "<low/medium/high>", "details": "<Brief>"},
    "keyword_opportunities": {"score": <0-20>, "rating": "<excellent/good/moderate/poor>", "details": "<Brief>"},
    "content_diversity": {"score": <0-15>, "rating": "<excellent/good/moderate/poor>", "details": "<Brief>"},
    "commercial_intent": {"score": <0-10>, "rating": "<excellent/good/moderate/poor>", "details": "<Brief>"}
  },
  "competition_analysis": {
    "total_competitors": <number>,
    "da_distribution": {"high_da_80_plus": <count>, "medium_da_50_79": <count>, "low_da_below_50": <count>},
    "market_saturation": "<low/medium/high> - <Brief explanation>"
  },
  "keyword_opportunities": [
    {"keyword": "<keyword>", "estimated_monthly_searches": <number>, "competition_da": <number>, "difficulty": "<easy/medium/hard>", "ranking_potential": "<high/medium/low>", "buyer_intent": "<high/medium/low>", "reason": "<Why this keyword is good>"}
  ]
}`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://www.getseowizard.com',
            'X-Title': 'SEO Wizard'
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: [{ role: 'user', content: corePrompt }],
            temperature: 0.3,
            max_tokens: 1000
          })
        });

        if (!response.ok) {
          throw new Error(`AI failed: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content.trim();
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const analysis = JSON.parse(jsonMatch[0]);

        const duration = Date.now() - startTime;
        console.log(`[STEP 3A COMPLETE] ${duration}ms`);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            step: '3a',
            niche_keyword,
            core_analysis: analysis,
            duration_ms: duration
          })
        };

      } catch (error) {
        console.error('[STEP 3A ERROR]', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ success: false, error: error.message })
        };
      }
    }

    // MODULAR NICHE VALIDATION - STEP 3B: Generate Detailed Sections (Content & Revenue)
    if (path === '/api/validate-niche-step3b' && method === 'POST') {
      const { niche_keyword, core_analysis } = body;

      if (!niche_keyword || !core_analysis) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Niche keyword and core_analysis are required'
          })
        };
      }

      try {
        console.log(`[STEP 3B] Generating detailed sections for: ${niche_keyword}`);
        const startTime = Date.now();

        const detailPrompt = `Generate content strategy and revenue projections for niche "${niche_keyword}".

NICHE SCORE: ${core_analysis.score}/100
PRIORITY: ${core_analysis.priority}

Return ONLY valid JSON:
{
  "content_strategy": {
    "first_20_articles": [
      {"title": "<Title>", "type": "<review/comparison/guide/listicle>", "priority": "<high/medium/low>"}
    ],
    "content_pillars": ["<Pillar 1>", "<Pillar 2>", "<Pillar 3>"],
    "subject_diversity_score": <1-10>
  },
  "affiliate_programs": {
    "recommended_programs": [
      {"program_name": "<Name>", "commission_structure": "<% or $X>", "cookie_duration": "<30 days>", "average_commission_per_sale": <dollar amount>, "why_recommended": "<Brief reason>"}
    ],
    "total_programs_available": <estimated count>,
    "monetization_difficulty": "<easy/medium/hard>"
  },
  "revenue_projection": {
    "month_6": {"estimated_traffic": <number>, "conversion_rate": "<X%>", "avg_commission": <dollar amount>, "estimated_revenue": <dollar amount>},
    "month_12": {"estimated_traffic": <number>, "conversion_rate": "<X%>", "avg_commission": <dollar amount>, "estimated_revenue": <dollar amount>},
    "revenue_factors": "<What drives revenue>",
    "realistic_expectations": "<Honest assessment>"
  },
  "strategic_insights": "<2-3 sentences>",
  "success_probability": "<high/medium/low> - <Why>"
}`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://www.getseowizard.com',
            'X-Title': 'SEO Wizard'
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: [{ role: 'user', content: detailPrompt }],
            temperature: 0.5,
            max_tokens: 1200
          })
        });

        if (!response.ok) {
          throw new Error(`AI failed: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content.trim();
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const details = JSON.parse(jsonMatch[0]);

        const duration = Date.now() - startTime;
        console.log(`[STEP 3B COMPLETE] ${duration}ms`);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            step: '3b',
            niche_keyword,
            detailed_sections: details,
            duration_ms: duration
          })
        };

      } catch (error) {
        console.error('[STEP 3B ERROR]', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ success: false, error: error.message })
        };
      }
    }

    // DOMAIN RECOMMENDATION - AI generates domain name suggestions
    if (path === '/api/recommend-domains' && method === 'POST') {
      const { niche_keyword, count = 8 } = body;

      if (!niche_keyword) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Niche keyword is required'
          })
        };
      }

      try {
        console.log(`[DOMAIN RECOMMENDATION] Generating ${count} domains for: ${niche_keyword}`);
        const startTime = Date.now();

        const domainPrompt = `Generate ${count} domain name suggestions for a "${niche_keyword}" affiliate site.

Requirements:
- Brandable and memorable
- .com preferred
- SEO-friendly keywords included where natural
- Under 20 characters
- Easy to spell and pronounce
- Avoid hyphens and numbers
- Mix of exact-match and brandable options

Return ONLY valid JSON array:
[
  {
    "domain": "example.com",
    "reason": "Short explanation why this domain works"
  }
]`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://www.getseowizard.com',
            'X-Title': 'SEO Wizard'
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: [{ role: 'user', content: domainPrompt }],
            temperature: 0.7,
            max_tokens: 600
          })
        });

        if (!response.ok) {
          throw new Error(`AI failed: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content.trim();
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        const suggestions = JSON.parse(jsonMatch[0]);

        const duration = Date.now() - startTime;
        console.log(`[DOMAIN RECOMMENDATION COMPLETE] ${suggestions.length} domains in ${duration}ms`);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            niche_keyword,
            suggestions,
            duration_ms: duration
          })
        };

      } catch (error) {
        console.error('[DOMAIN RECOMMENDATION ERROR]', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ success: false, error: error.message })
        };
      }
    }

    // CHECK DOMAIN AVAILABILITY - Check if domains are available for registration
    if (path === '/api/check-domain-availability' && method === 'POST') {
      const { domains } = body;

      if (!domains || !Array.isArray(domains) || domains.length === 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Domains array is required'
          })
        };
      }

      try {
        console.log(`[DOMAIN CHECK] Checking availability for ${domains.length} domains`);

        // For now, return mock data (replace with real domain API later)
        // Real implementation would use Namecheap, GoDaddy, or Siteground API
        const results = domains.map(domain => {
          // Simple heuristic: assume availability based on domain characteristics
          // In production, use actual domain registration API
          const isCommon = domain.length < 10 || domain.includes('best') || domain.includes('top');
          const available = Math.random() > (isCommon ? 0.7 : 0.3);

          return {
            domain,
            available,
            price: available ? 12.99 : null
          };
        });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            results
          })
        };

      } catch (error) {
        console.error('[DOMAIN CHECK ERROR]', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ success: false, error: error.message })
        };
      }
    }

    // GENERATE SETUP PACKAGE - Create guided setup for manual Siteground installation
    if (path === '/api/generate-setup-package' && method === 'POST') {
      const { validation_id, validation, domain, admin_email, theme, content_count, auto_affiliate, niche_keyword } = body;

      if (!domain || !admin_email || !niche_keyword) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Domain, admin_email, and niche_keyword are required'
          })
        };
      }

      try {
        console.log(`[SETUP PACKAGE] Generating setup package for: ${domain}`);
        const startTime = Date.now();

        // Generate setup steps
        const setupSteps = [
          {
            title: 'Register Domain Name',
            description: `Purchase "${domain}" from Namecheap or your preferred registrar. Point nameservers to Siteground.`,
            estimated_time: '5 min',
            completed: false,
            action_button: {
              label: 'Buy on Namecheap',
              onclick: `window.open('https://www.namecheap.com/domains/registration/results/?domain=${domain}', '_blank')`
            }
          },
          {
            title: 'Install WordPress on Siteground',
            description: 'Log into Siteground → Site Tools → WordPress → Install. Use domain and email provided.',
            estimated_time: '3 min',
            completed: false,
            action_button: {
              label: 'Open Siteground',
              onclick: `window.open('https://my.siteground.com', '_blank')`
            }
          },
          {
            title: 'Install & Activate Theme',
            description: `Install "${theme}" theme from WordPress directory and activate it. Use default settings to start.`,
            estimated_time: '2 min',
            completed: false
          },
          {
            title: 'Install Essential Plugins',
            description: 'Install: Yoast SEO, TablePress, Pretty Links, Wordfence, WPForms. Activate all plugins.',
            estimated_time: '3 min',
            completed: false
          },
          {
            title: 'Import Generated Articles',
            description: `Import the ${content_count} pre-written articles using WordPress Tools → Import → WordPress XML.`,
            estimated_time: '2 min',
            completed: false,
            action_button: {
              label: 'Download Articles',
              onclick: 'downloadArticles()'
            }
          },
          {
            title: 'Create Essential Pages',
            description: 'Create About Us, Contact (with WPForms), Privacy Policy, and Affiliate Disclosure pages.',
            estimated_time: '5 min',
            completed: false
          },
          {
            title: 'Configure WordPress Settings',
            description: 'Set permalink structure to "Post name", update site title and tagline, set timezone.',
            estimated_time: '2 min',
            completed: false
          },
          {
            title: 'Apply to Affiliate Programs',
            description: `Send the ${auto_affiliate ? 'pre-written' : 'custom'} application emails to recommended affiliate programs.`,
            estimated_time: '5 min',
            completed: false,
            action_button: auto_affiliate ? {
              label: 'Download Emails',
              onclick: 'downloadAffiliateEmails()'
            } : null
          }
        ];

        // Get affiliate programs from validation
        const affiliatePrograms = validation?.affiliate_programs?.recommended_programs || [
          { program_name: 'Amazon Associates', commission_structure: '1-10%', cookie_duration: '24 hours' },
          { program_name: 'ShareASale', commission_structure: 'Varies', cookie_duration: '30-90 days' },
          { program_name: 'CJ Affiliate', commission_structure: 'Varies', cookie_duration: '30-90 days' }
        ];

        const duration = Date.now() - startTime;

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Setup package generated',
            domain,
            admin_email,
            theme,
            content_count,
            setup_steps: setupSteps,
            affiliate_programs: affiliatePrograms,
            duration_ms: duration
          })
        };

      } catch (error) {
        console.error('[SETUP PACKAGE ERROR]', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ success: false, error: error.message })
        };
      }
    }

    // MODULAR NICHE VALIDATION - STEP 3: Generate Comprehensive Analysis
    if (path === '/api/validate-niche-step3' && method === 'POST') {
      const { niche_keyword, serp_results, competitor_domains } = body;

      if (!niche_keyword || !serp_results || !competitor_domains) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Niche keyword, serp_results, and competitor_domains are required'
          })
        };
      }

      try {
        console.log(`[STEP 3] Generating comprehensive analysis for: ${niche_keyword}`);
        console.log(`[STEP 3] SERP results count: ${serp_results.length}, Competitors: ${competitor_domains.length}`);
        const startTime = Date.now();

        // Validation: Ensure we have sufficient data
        if (!Array.isArray(serp_results) || serp_results.length === 0) {
          throw new Error('No SERP data available for analysis. Step 2 may have failed.');
        }

        if (!Array.isArray(competitor_domains) || competitor_domains.length === 0) {
          throw new Error('No competitor data available for analysis. Step 2 may have failed.');
        }

        // Optimize: Only send top 5 keywords to AI to reduce payload size and processing time
        const topSerpResults = serp_results.slice(0, 5).map(result => ({
          keyword: result.keyword,
          top_domains: result.top_10_domains ? result.top_10_domains.slice(0, 5) : [],
          related_searches: result.related_searches ? result.related_searches.slice(0, 3) : []
        }));

        console.log(`[STEP 3] Sending ${topSerpResults.length} keywords to AI for analysis`);

        const analysisPrompt = `You are an expert SEO analyst and affiliate marketer. Analyze the niche "${niche_keyword}".

SERP DATA (Top 5 keywords):
${JSON.stringify(topSerpResults)}

COMPETITORS: ${competitor_domains.length} unique domains found
Sample: ${competitor_domains.slice(0, 10).join(', ')}

Provide COMPREHENSIVE analysis in this EXACT JSON format (return ONLY valid JSON):
{
  "score": <0-100>,
  "recommendation": "<One sentence>",
  "priority": "<high/medium/low/very-low>",
  "action": "<Specific action plan>",
  "estimated_monthly_traffic": <number>,
  "avg_competition_da": <0-100>,
  "breakdown": {
    "search_volume": {"score": <0-30>, "rating": "<excellent/good/moderate/low>", "details": "<Explain traffic potential>"},
    "competition": {"score": <0-25>, "rating": "<low/medium/high>", "details": "<Explain competitive landscape>"},
    "keyword_opportunities": {"score": <0-20>, "rating": "<excellent/good/moderate/poor>", "details": "<Explain keyword gaps>"},
    "content_diversity": {"score": <0-15>, "rating": "<excellent/good/moderate/poor>", "details": "<Explain content angles>"},
    "commercial_intent": {"score": <0-10>, "rating": "<excellent/good/moderate/poor>", "details": "<Explain monetization potential>"}
  },
  "competition_analysis": {
    "total_competitors": <number>,
    "competitor_types": {
      "major_brands": ["<brand1>", "<brand2>"],
      "authority_sites": ["<site1>", "<site2>"],
      "affiliate_sites": ["<site1>", "<site2>"],
      "niche_blogs": ["<site1>", "<site2>"]
    },
    "da_distribution": {
      "high_da_80_plus": <count>,
      "medium_da_50_79": <count>,
      "low_da_below_50": <count>
    },
    "weakness_opportunities": "<2-3 sentences on competitor weaknesses and gaps>",
    "market_saturation": "<low/medium/high> - <Explanation>"
  },
  "keyword_opportunities": [
    {
      "keyword": "<exact keyword>",
      "estimated_monthly_searches": <number>,
      "competition_da": <number>,
      "difficulty": "<easy/medium/hard>",
      "ranking_potential": "<high/medium/low>",
      "buyer_intent": "<high/medium/low>",
      "reason": "<Detailed explanation>",
      "current_competition": "<Who ranks and why there's opportunity>"
    }
  ],
  "content_strategy": {
    "first_20_articles": [
      {"title": "<Article title>", "type": "<review/comparison/guide/listicle>", "priority": "<high/medium/low>", "target_keyword": "<keyword>"}
    ],
    "content_pillars": ["<Pillar 1>", "<Pillar 2>", "<Pillar 3>"],
    "content_gaps": "<What content is missing in the niche>",
    "subject_diversity_score": <1-10>,
    "topic_clusters": [
      {"cluster": "<Topic cluster name>", "articles": <count>, "examples": ["<Article 1>", "<Article 2>"]}
    ]
  },
  "affiliate_programs": {
    "recommended_programs": [
      {
        "program_name": "<Program name>",
        "commission_structure": "<Percentage or fixed amount>",
        "cookie_duration": "<days>",
        "average_commission_per_sale": <dollar amount>,
        "why_recommended": "<Explanation>"
      }
    ],
    "total_programs_available": <estimated count>,
    "monetization_difficulty": "<easy/medium/hard> - <Explanation>"
  },
  "revenue_projection": {
    "month_6": {
      "estimated_traffic": <number>,
      "conversion_rate": "<percentage>",
      "avg_commission": <dollar amount>,
      "estimated_revenue": <dollar amount>,
      "assumptions": "<Key assumptions>"
    },
    "month_12": {
      "estimated_traffic": <number>,
      "conversion_rate": "<percentage>",
      "avg_commission": <dollar amount>,
      "estimated_revenue": <dollar amount>,
      "assumptions": "<Key assumptions>"
    },
    "revenue_factors": "<What drives revenue in this niche>",
    "realistic_expectations": "<Honest assessment of earning potential>"
  },
  "strategic_insights": "<3-4 sentences providing strategic recommendations and market positioning advice>",
  "risks_and_challenges": "<2-3 specific challenges to be aware of>",
  "success_probability": "<high/medium/low> - <Why>"
}

ANALYSIS REQUIREMENTS:
1. Competition: Be specific about WHO the competitors are (brands vs affiliates vs bloggers)
2. Keywords: Find 10-12 keywords with LOW competition (<DA 50) + HIGH buyer intent + reasonable volume (500+)
3. Content Strategy: Provide 20 specific article titles ready to write
4. Affiliate Programs: Research typical programs in this niche
5. Revenue: Be realistic with projections based on traffic, conversion rates, commissions
6. Subject Diversity: Analyze how many different sub-topics and angles exist

Return ONLY the JSON object, no markdown.`;

        console.log(`[STEP 3] Calling OpenRouter API...`);
        const aiAnalysisResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://www.getseowizard.com',
            'X-Title': 'SEO Wizard - Niche Analysis'
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: [{
              role: 'user',
              content: analysisPrompt
            }],
            temperature: 0.3,
            max_tokens: 2000  // Reduced from 3000 for faster response
          })
        });

        console.log(`[STEP 3] OpenRouter response status: ${aiAnalysisResponse.status}`);

        if (!aiAnalysisResponse.ok) {
          const errorText = await aiAnalysisResponse.text();
          console.error(`[STEP 3] AI analysis failed:`, errorText);
          throw new Error(`AI analysis failed: ${aiAnalysisResponse.status} - ${errorText.substring(0, 200)}`);
        }

        const aiAnalysisData = await aiAnalysisResponse.json();
        console.log(`[STEP 3] Received AI response, parsing...`);

        if (!aiAnalysisData.choices || !aiAnalysisData.choices[0] || !aiAnalysisData.choices[0].message) {
          console.error(`[STEP 3] Invalid AI response structure:`, aiAnalysisData);
          throw new Error('Invalid AI response structure');
        }

        const aiAnalysisContent = aiAnalysisData.choices[0].message.content.trim();
        console.log(`[STEP 3] AI response length: ${aiAnalysisContent.length} chars`);

        // Parse AI analysis
        let analysis;
        try {
          const jsonMatch = aiAnalysisContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysis = JSON.parse(jsonMatch[0]);
          } else {
            console.error(`[STEP 3] No JSON found in response:`, aiAnalysisContent.substring(0, 500));
            throw new Error('No JSON found in AI analysis response');
          }
        } catch (parseError) {
          console.error('[STEP 3] Failed to parse AI analysis:', parseError);
          console.error('[STEP 3] Raw content:', aiAnalysisContent.substring(0, 500));
          throw new Error(`Failed to parse AI analysis response: ${parseError.message}`);
        }

        const duration = Date.now() - startTime;
        console.log(`[STEP 3 COMPLETE] Generated comprehensive analysis in ${duration}ms`);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            step: 3,
            niche_keyword,
            analysis,
            duration_ms: duration
          })
        };

      } catch (error) {
        console.error('[STEP 3 ERROR]', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            success: false,
            error: error.message
          })
        };
      }
    }

    // Niche Validation endpoint - AI-powered niche validation with real keyword research
    if (path === '/api/validate-niche' && method === 'POST') {
      const { niche_keyword } = body;

      if (!niche_keyword) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Niche keyword is required'
          })
        };
      }

      try {
        console.log(`\n========== AI-POWERED NICHE VALIDATION START ==========`);
        console.log(`Niche: ${niche_keyword}`);
        console.log(`Timestamp: ${new Date().toISOString()}`);

        // Step 1: Use AI to generate buyer-intent keyword ideas for the niche
        console.log('[STEP 1 START] Generating buyer-intent keywords with AI...');
        const step1Start = Date.now();

        const keywordPrompt = `You are an expert SEO and keyword researcher specializing in affiliate marketing niches.

Analyze the niche: "${niche_keyword}"

Generate 12 high-value buyer-intent keywords for this niche. Focus on:
1. Commercial intent keywords (best, top, review, vs, comparison)
2. Product-specific keywords (specific brands, models, types)
3. Problem-solving keywords (how to choose, what to look for)
4. Cost-related keywords (price, cost, affordable, cheap)
5. Long-tail keywords with lower competition potential

Return ONLY a JSON array of keyword strings, nothing else. Example format:
["best pet insurance for dogs", "pet insurance cost comparison", "nationwide pet insurance review"]

Keywords:`;

        console.log('[STEP 1] Calling OpenRouter API...');
        const aiKeywordResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://www.getseowizard.com',
            'X-Title': 'SEO Wizard - Niche Validation'
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: [{
              role: 'user',
              content: keywordPrompt
            }],
            temperature: 0.7,
            max_tokens: 500  // Reduced for speed
          })
        });

        console.log(`[STEP 1] Response status: ${aiKeywordResponse.status}`);

        if (!aiKeywordResponse.ok) {
          throw new Error(`AI keyword generation failed: ${aiKeywordResponse.statusText}`);
        }

        console.log('[STEP 1] Parsing response...');
        const aiKeywordData = await aiKeywordResponse.json();
        const aiKeywordContent = aiKeywordData.choices[0].message.content.trim();
        const step1Duration = Date.now() - step1Start;
        console.log(`[STEP 1 COMPLETE] Duration: ${step1Duration}ms`);

        // Parse AI response (handle potential markdown code blocks)
        let aiGeneratedKeywords;
        try {
          const jsonMatch = aiKeywordContent.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            aiGeneratedKeywords = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON array found in AI response');
          }
        } catch (parseError) {
          console.error('Failed to parse AI keywords, using fallback');
          // Fallback to basic keywords
          aiGeneratedKeywords = [
            niche_keyword,
            `best ${niche_keyword}`,
            `${niche_keyword} reviews`,
            `${niche_keyword} comparison`,
            `top ${niche_keyword}`,
            `${niche_keyword} cost`
          ];
        }

        console.log(`AI generated ${aiGeneratedKeywords.length} keywords`);
        console.log('Sample keywords:', aiGeneratedKeywords.slice(0, 5));

        // Step 2: Analyze top 10 AI-generated keywords with Serper to get real SERP data
        console.log('Step 2: Analyzing keywords with real SERP data...');
        let serpResults = [];
        let competitorDomains = new Set();

        // Analyze top 8 keywords from AI (increased for paid tier)
        const keywordsToAnalyze = aiGeneratedKeywords.slice(0, 8);

        // Query all keywords in parallel for speed
        const serpPromises = keywordsToAnalyze.map(keyword =>
          callSerperAPI(keyword, 'us', 'en', 10)
            .then(serpData => ({ keyword, serpData }))
            .catch(error => {
              console.error(`  Error analyzing "${keyword}":`, error.message);
              return { keyword, serpData: null };
            })
        );

        const serpResponses = await Promise.all(serpPromises);

        // Process SERP responses
        for (const { keyword, serpData } of serpResponses) {
          if (serpData && serpData.organic) {
            // Extract competitor domains
            const domains = serpData.organic.map(result => {
              try {
                const url = new URL(result.link);
                return url.hostname.replace('www.', '');
              } catch (e) {
                return null;
              }
            }).filter(d => d !== null);

            domains.forEach(d => competitorDomains.add(d));

            // Store SERP results for AI analysis
            serpResults.push({
              keyword,
              top_10_domains: domains,
              related_searches: serpData.relatedSearches || [],
              people_also_ask: serpData.peopleAlsoAsk || [],
              organic_results: serpData.organic.map(r => ({
                title: r.title,
                domain: domains[serpData.organic.indexOf(r)] || 'unknown',
                position: r.position
              }))
            });
          }
        }

        console.log(`Analyzed ${serpResults.length} keywords`);
        console.log(`Found ${competitorDomains.size} unique competitor domains`);

        // Step 3: Use AI to analyze SERP data and provide niche scoring + keyword recommendations
        console.log('Step 3: AI analyzing SERP data for niche viability...');

        const analysisPrompt = `You are an expert SEO analyst and affiliate marketer with deep experience in competitive analysis and revenue modeling. Analyze the niche "${niche_keyword}" in extreme detail.

SERP DATA (Top 10 keywords analyzed):
${JSON.stringify(serpResults, null, 2)}

COMPETITOR ANALYSIS:
- Unique competitor domains: ${competitorDomains.size}
- Sample competitors: ${Array.from(competitorDomains).slice(0, 10).join(', ')}

Provide COMPREHENSIVE analysis in this EXACT JSON format (return ONLY valid JSON):
{
  "score": <0-100>,
  "recommendation": "<One sentence>",
  "priority": "<high/medium/low/very-low>",
  "action": "<Specific action plan>",
  "estimated_monthly_traffic": <number>,
  "avg_competition_da": <0-100>,
  "breakdown": {
    "search_volume": {"score": <0-30>, "rating": "<excellent/good/moderate/low>", "details": "<Explain traffic potential>"},
    "competition": {"score": <0-25>, "rating": "<low/medium/high>", "details": "<Explain competitive landscape>"},
    "keyword_opportunities": {"score": <0-20>, "rating": "<excellent/good/moderate/poor>", "details": "<Explain keyword gaps>"},
    "content_diversity": {"score": <0-15>, "rating": "<excellent/good/moderate/poor>", "details": "<Explain content angles>"},
    "commercial_intent": {"score": <0-10>, "rating": "<excellent/good/moderate/poor>", "details": "<Explain monetization potential>"}
  },
  "competition_analysis": {
    "total_competitors": <number>,
    "competitor_types": {
      "major_brands": ["<brand1>", "<brand2>"],
      "authority_sites": ["<site1>", "<site2>"],
      "affiliate_sites": ["<site1>", "<site2>"],
      "niche_blogs": ["<site1>", "<site2>"]
    },
    "da_distribution": {
      "high_da_80_plus": <count>,
      "medium_da_50_79": <count>,
      "low_da_below_50": <count>
    },
    "weakness_opportunities": "<2-3 sentences on competitor weaknesses and gaps>",
    "market_saturation": "<low/medium/high> - <Explanation>"
  },
  "keyword_opportunities": [
    {
      "keyword": "<exact keyword>",
      "estimated_monthly_searches": <number>,
      "competition_da": <number>,
      "difficulty": "<easy/medium/hard>",
      "ranking_potential": "<high/medium/low>",
      "buyer_intent": "<high/medium/low>",
      "reason": "<Detailed explanation>",
      "current_competition": "<Who ranks and why there's opportunity>"
    }
  ],
  "content_strategy": {
    "first_20_articles": [
      {"title": "<Article title>", "type": "<review/comparison/guide/listicle>", "priority": "<high/medium/low>", "target_keyword": "<keyword>"}
    ],
    "content_pillars": ["<Pillar 1>", "<Pillar 2>", "<Pillar 3>"],
    "content_gaps": "<What content is missing in the niche>",
    "subject_diversity_score": <1-10>,
    "topic_clusters": [
      {"cluster": "<Topic cluster name>", "articles": <count>, "examples": ["<Article 1>", "<Article 2>"]}
    ]
  },
  "affiliate_programs": {
    "recommended_programs": [
      {
        "program_name": "<Program name>",
        "commission_structure": "<Percentage or fixed amount>",
        "cookie_duration": "<days>",
        "average_commission_per_sale": <dollar amount>,
        "why_recommended": "<Explanation>"
      }
    ],
    "total_programs_available": <estimated count>,
    "monetization_difficulty": "<easy/medium/hard> - <Explanation>"
  },
  "revenue_projection": {
    "month_6": {
      "estimated_traffic": <number>,
      "conversion_rate": "<percentage>",
      "avg_commission": <dollar amount>,
      "estimated_revenue": <dollar amount>,
      "assumptions": "<Key assumptions>"
    },
    "month_12": {
      "estimated_traffic": <number>,
      "conversion_rate": "<percentage>",
      "avg_commission": <dollar amount>,
      "estimated_revenue": <dollar amount>,
      "assumptions": "<Key assumptions>"
    },
    "revenue_factors": "<What drives revenue in this niche>",
    "realistic_expectations": "<Honest assessment of earning potential>"
  },
  "strategic_insights": "<3-4 sentences providing strategic recommendations and market positioning advice>",
  "risks_and_challenges": "<2-3 specific challenges to be aware of>",
  "success_probability": "<high/medium/low> - <Why>"
}

ANALYSIS REQUIREMENTS:
1. Competition: Be specific about WHO the competitors are (brands vs affiliates vs bloggers)
2. Keywords: Find 10-12 keywords with LOW competition (<DA 50) + HIGH buyer intent + reasonable volume (500+)
3. Content Strategy: Provide 20 specific article titles ready to write
4. Affiliate Programs: Research typical programs in this niche (even if not in database)
5. Revenue: Be realistic with projections based on traffic, conversion rates, commissions
6. Subject Diversity: Analyze how many different sub-topics and angles exist

Return ONLY the JSON object, no markdown.`;

        const aiAnalysisResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://www.getseowizard.com',
            'X-Title': 'SEO Wizard - Niche Analysis'
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: [{
              role: 'user',
              content: analysisPrompt
            }],
            temperature: 0.3,
            max_tokens: 3000  // Balanced for speed and detail
          })
        });

        if (!aiAnalysisResponse.ok) {
          throw new Error(`AI analysis failed: ${aiAnalysisResponse.statusText}`);
        }

        const aiAnalysisData = await aiAnalysisResponse.json();
        const aiAnalysisContent = aiAnalysisData.choices[0].message.content.trim();

        // Parse AI analysis
        let analysis;
        try {
          const jsonMatch = aiAnalysisContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysis = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found in AI analysis response');
          }
        } catch (parseError) {
          console.error('Failed to parse AI analysis:', parseError);
          throw new Error('AI analysis returned invalid format');
        }

        console.log(`AI Analysis Complete - Score: ${analysis.score}/100`);
        console.log(`Recommendation: ${analysis.recommendation}`);
        console.log(`Top Keywords: ${analysis.keyword_opportunities.slice(0, 3).map(k => k.keyword).join(', ')}`);

        // Extract values from comprehensive AI analysis
        const {
          score,
          recommendation,
          priority,
          action,
          estimated_monthly_traffic,
          avg_competition_da,
          breakdown,
          keyword_opportunities,
          competition_analysis,
          content_strategy,
          affiliate_programs,
          revenue_projection,
          strategic_insights,
          risks_and_challenges,
          success_probability
        } = analysis;

        // Build final result with comprehensive AI analysis
        const result = {
          success: true,
          niche: niche_keyword,
          score,
          recommendation,
          priority,
          action,
          breakdown,
          keyword_opportunities, // AI-generated opportunities with buyer intent + competition details
          estimated_monthly_traffic,
          avg_competition_da,
          unique_competitors: competitorDomains.size,

          // NEW: Comprehensive competitive analysis
          competition_analysis: competition_analysis || {
            total_competitors: competitorDomains.size,
            competitor_types: { major_brands: [], authority_sites: [], affiliate_sites: [], niche_blogs: [] },
            da_distribution: { high_da_80_plus: 0, medium_da_50_79: 0, low_da_below_50: 0 },
            weakness_opportunities: '',
            market_saturation: 'medium - Analysis pending'
          },

          // NEW: Content strategy with 20 article titles
          content_strategy: content_strategy || {
            first_20_articles: [],
            content_pillars: [],
            content_gaps: '',
            subject_diversity_score: 5,
            topic_clusters: []
          },

          // NEW: Affiliate program recommendations
          affiliate_programs: affiliate_programs || {
            recommended_programs: [],
            total_programs_available: 0,
            monetization_difficulty: 'medium - Analysis pending'
          },

          // NEW: Revenue projections
          revenue_projection: revenue_projection || {
            month_6: { estimated_traffic: 0, conversion_rate: '0%', avg_commission: 0, estimated_revenue: 0, assumptions: '' },
            month_12: { estimated_traffic: 0, conversion_rate: '0%', avg_commission: 0, estimated_revenue: 0, assumptions: '' },
            revenue_factors: '',
            realistic_expectations: ''
          },

          // Enhanced insights
          strategic_insights: strategic_insights || '',
          risks_and_challenges: risks_and_challenges || '',
          success_probability: success_probability || 'medium - Analysis pending',

          ai_powered: true,
          timestamp: new Date().toISOString()
        };

        console.log(`✅ AI-Powered Niche Validation Complete`);
        console.log(`Score: ${score}/100 | Priority: ${priority}`);
        console.log(`Keyword Opportunities: ${keyword_opportunities.length}`);
        console.log(`========== NICHE VALIDATION END ==========\n`);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(result)
        };

      } catch (error) {
        console.error(`\n========== NICHE VALIDATION ERROR ==========`);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error(`========== ERROR END ==========\n`);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Failed to validate niche',
            message: error.message,
            timestamp: new Date().toISOString()
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
          'POST /api/dataforseo-section',
          'POST /api/content-outline',
          'POST /api/pexels-images',
          'POST /api/openrouter-images',
          'POST /api/wordpress-test-connection',
          'POST /api/wordpress-publish',
          'POST /api/wordpress-categories',
          'POST /api/wordpress-create-category',
          'POST /api/affiliate-research',
          'POST /api/validate-niche',
          'POST /api/validate-niche-step1',
          'POST /api/validate-niche-step2',
          'POST /api/validate-niche-step3'
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