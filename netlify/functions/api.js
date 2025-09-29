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

const processKeywords = (searchData, responseTime, originalKeyword) => {
  const keywords = [];

  // PRIMARY: Extract keyword opportunities from ranking articles
  if (searchData.organic) {
    searchData.organic.forEach((result, index) => {
      // Clean and extract the main topic from article title
      const mainKeyword = extractMainKeyword(result.title, originalKeyword);

      keywords.push({
        keyword: mainKeyword,
        searchVolume: estimateVolumeFromPosition(result.position || index + 1),
        difficulty: calculateDifficulty(result.position || index + 1),
        cpc: '$' + (Math.random() * 5 + 0.5).toFixed(2),
        intent: determineIntent(result.title || ''),
        opportunity: calculateOpportunity(result.position || index + 1),
        url: result.link,
        snippet: result.snippet,
        source: 'Ranking Articles',
        competitorTitle: result.title,
        rankingPosition: result.position || index + 1
      });
    });
  }

  // SECONDARY: Add related searches as additional keyword opportunities
  if (searchData.relatedSearches) {
    searchData.relatedSearches.forEach(related => {
      keywords.push({
        keyword: related.query,
        searchVolume: Math.floor(Math.random() * 5000) + 2000,
        difficulty: 'Medium',
        cpc: '$' + (Math.random() * 3 + 1).toFixed(2),
        intent: determineIntent(related.query),
        opportunity: Math.floor(Math.random() * 70) + 30,
        source: 'Related Searches'
      });
    });
  }

  // TERTIARY: Extract from People Also Ask
  if (searchData.peopleAlsoAsk) {
    searchData.peopleAlsoAsk.forEach(paa => {
      const keywordFromQuestion = paa.question
        .toLowerCase()
        .replace(/^(what|how|why|when|where|who|which|is|are|can|do|does)\s+/i, '')
        .replace(/\?$/, '')
        .trim();

      if (keywordFromQuestion.length > 3) {
        keywords.push({
          keyword: keywordFromQuestion,
          searchVolume: Math.floor(Math.random() * 3000) + 1500,
          difficulty: 'Low',
          cpc: '$' + (Math.random() * 4 + 0.8).toFixed(2),
          intent: 'Informational',
          opportunity: Math.floor(Math.random() * 80) + 40,
          source: 'People Also Ask',
          originalQuestion: paa.question
        });
      }
    });
  }

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

// Helper function to extract the main keyword from article titles
const extractMainKeyword = (title, originalKeyword) => {
  if (!title) return originalKeyword;

  // Remove common article prefixes/suffixes
  const cleanTitle = title
    .replace(/^(The|A|An)\s+/i, '')
    .replace(/\s*-\s*.+$/, '') // Remove site names after dash
    .replace(/\s*\|\s*.+$/, '') // Remove site names after pipe
    .replace(/[^\w\s-]/g, ' ') // Remove special characters except hyphens
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  // If title contains the original keyword, return a variation
  if (cleanTitle.includes(originalKeyword.toLowerCase())) {
    return cleanTitle.substring(0, 60); // Limit length
  }

  // Otherwise return the first meaningful part of the title
  const words = cleanTitle.split(' ');
  return words.slice(0, 5).join(' '); // Take first 5 words
};

// Estimate search volume based on ranking position
const estimateVolumeFromPosition = (position) => {
  if (position <= 3) return Math.floor(Math.random() * 20000) + 10000; // High volume
  if (position <= 6) return Math.floor(Math.random() * 10000) + 5000;  // Medium volume
  return Math.floor(Math.random() * 5000) + 1000; // Lower volume
};

// Calculate opportunity score based on position and competition
const calculateOpportunity = (position) => {
  const baseOpportunity = Math.max(100 - (position * 8), 10);
  return baseOpportunity + Math.floor(Math.random() * 20) - 10; // Add some variance
};


// OpenRouter API functions
const getModelConfig = (modelType) => {
  const modelMap = {
    'free': 'cognitivecomputations/dolphin-mistral-7b:free',
    'budget': 'openai/gpt-4o-mini',
    'premium': 'anthropic/claude-3.5-sonnet',
    'enterprise': 'anthropic/claude-3-opus'
  };

  const creditCosts = {
    'free': 5,
    'budget': 10,
    'premium': 25,
    'enterprise': 100
  };

  return {
    model: modelMap[modelType] || modelMap.free,
    cost: creditCosts[modelType] || creditCosts.free
  };
};

const callOpenRouterAPI = async (keyword, modelType = 'free') => {
  try {
    const { model } = getModelConfig(modelType);

    const prompt = `Generate 10 high-quality article ideas for the keyword "${keyword}". Each article should:

1. Address real user questions and pain points
2. Be SEO-optimized and engaging
3. Target different user intents (informational, commercial, etc.)
4. Include diverse content types (guides, tutorials, comparisons, etc.)

For each article idea, provide:
- Title (compelling and SEO-friendly, must include the keyword "${keyword}")
- Target audience (specific demographic)
- Word count estimate (realistic)
- Content intent (informational, commercial, educational, etc.)
- Brief description (1-2 sentences about what the article covers)

Format as JSON array with objects containing: title, audience, wordCount, intent, description`;

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

    const articles = JSON.parse(cleanContent);

    if (!Array.isArray(articles) || articles.length === 0) {
      throw new Error('Invalid article format in API response');
    }

    return { articles, responseTime, success: true };

  } catch (error) {
    throw new Error(`OpenRouter API error: ${error.message}`);
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
    } else if (path.startsWith('/api')) {
      path = path.replace('/api', '');
    }

    // Default to status if no path
    if (!path || path === '/') {
      path = '/status';
    }

    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};

    console.log(`${method} ${path}`, body);

    // API Status endpoint
    if (path === '/status' && method === 'GET') {
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
            'POST /api/article-ideas (OpenRouter)'
          ],
          timestamp: new Date().toISOString()
        })
      };
    }

    // Keywords endpoint
    if (path === '/keywords' && method === 'POST') {
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

      try {
        const result = await callSerperAPI(keyword, location, language, count);
        const processedResult = processKeywords(result.data, result.responseTime, keyword);

        // Business value metrics
        const avgOpportunity = Math.round(
          processedResult.keywords.reduce((sum, kw) => sum + kw.opportunity, 0) / processedResult.keywords.length
        );
        const highOpportunityCount = processedResult.keywords.filter(kw => kw.opportunity >= 70).length;

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
              businessValue: {
                avgOpportunity: avgOpportunity,
                highOpportunityKeywords: highOpportunityCount,
                competitiveLandscape: `${processedResult.analysis?.competitorArticles || 0} competitors analyzed`,
                marketInsights: `${processedResult.analysis?.relatedSearches || 0} related search trends identified`
              }
            },
            timestamp: new Date().toISOString()
          })
        };
      } catch (error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to fetch keywords',
            message: error.message,
            code: 'KEYWORD_RESEARCH_FAILED'
          })
        };
      }
    }

    // Search endpoint
    if (path === '/search' && method === 'POST') {
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
    if (path === '/article-ideas' && method === 'POST') {
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
            error: 'OpenRouter API not configured',
            code: 'OPENROUTER_NOT_CONFIGURED'
          })
        };
      }

      try {
        const { articles, responseTime } = await callOpenRouterAPI(keyword, modelType);
        const { cost } = getModelConfig(modelType);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            articles,
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
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'Failed to generate article ideas',
            message: error.message,
            code: 'ARTICLE_GENERATION_FAILED'
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
          'POST /api/article-ideas'
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