/**
 * Auto-Publisher Scheduled Function
 * Runs hourly to publish scheduled articles and replenish the queue
 *
 * Netlify Scheduled Functions Documentation:
 * https://docs.netlify.com/functions/scheduled-functions/
 */

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Helper to make Supabase requests
async function supabaseRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, options);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

// Get articles due for publishing with daily limit enforcement
async function getDueArticles() {
  const now = new Date().toISOString();
  const today = new Date().toISOString().split('T')[0];

  // Get scheduled articles where scheduled_date <= now
  const articles = await supabaseRequest(
    `content_queue?status=eq.scheduled&scheduled_date=lte.${now}&order=scheduled_date.asc&limit=20`,
    'GET'
  );

  if (!articles || articles.length === 0) {
    return [];
  }

  // Group articles by blog and check daily limits
  const blogGroups = {};

  for (const article of articles) {
    const blogId = article.blog_id;

    if (!blogGroups[blogId]) {
      // Get pipeline settings for this blog
      const pipeline = await getPipeline(blogId);

      if (!pipeline) {
        console.log(`[AUTO-PUBLISHER] No pipeline found for blog ${blogId}, skipping`);
        continue;
      }

      const maxPostsPerDay = pipeline.max_posts_per_day || 3;
      let dailyPostsPublished = pipeline.daily_posts_published || 0;

      // Reset counter if new day
      if (!pipeline.last_daily_reset || pipeline.last_daily_reset < today) {
        console.log(`[AUTO-PUBLISHER] Resetting daily counter for blog ${blogId}`);
        await supabaseRequest(
          `content_pipeline?blog_id=eq.${blogId}`,
          'PATCH',
          { daily_posts_published: 0, last_daily_reset: today }
        );
        dailyPostsPublished = 0;
      }

      blogGroups[blogId] = {
        pipeline,
        maxPostsPerDay,
        dailyPostsPublished,
        remaining: maxPostsPerDay - dailyPostsPublished,
        articles: []
      };
    }

    // Only add article if blog has remaining slots
    if (blogGroups[blogId].remaining > 0) {
      blogGroups[blogId].articles.push(article);
      blogGroups[blogId].remaining--;
    } else {
      console.log(`[AUTO-PUBLISHER] Daily limit reached for blog ${blogId}, skipping article: ${article.title}`);
    }
  }

  // Flatten and return limited articles
  const limitedArticles = Object.values(blogGroups).flatMap(g => g.articles);
  console.log(`[AUTO-PUBLISHER] ${limitedArticles.length} articles within daily limits (from ${articles.length} due)`);

  return limitedArticles;
}

// Publish article to WordPress
async function publishToWordPress(article, blog) {
  if (!blog.wordpress_url || !blog.wordpress_username || !blog.wordpress_app_password) {
    throw new Error('WordPress credentials not configured for this blog');
  }

  // Build WordPress API URL
  const wpApiUrl = `${blog.wordpress_url}/wp-json/wp/v2/posts`;

  // Get the full article content from generated_articles table
  let articleContent = article.title; // Fallback
  if (article.article_id) {
    try {
      const fullArticle = await supabaseRequest(
        `generated_articles?id=eq.${article.article_id}&select=content`,
        'GET'
      );
      if (fullArticle && fullArticle[0]) {
        const savedData = JSON.parse(fullArticle[0].content);
        articleContent = savedData.content || savedData;
      }
    } catch (e) {
      console.error('Failed to load full article:', e.message);
    }
  }

  // Build HTML content
  let htmlContent = '';
  if (typeof articleContent === 'object') {
    // Structured article content
    if (articleContent.introduction) {
      htmlContent += `<p>${articleContent.introduction}</p>\n\n`;
    }
    if (articleContent.sections) {
      articleContent.sections.forEach(section => {
        htmlContent += `<h2>${section.title}</h2>\n`;
        htmlContent += `<p>${section.content}</p>\n\n`;
      });
    }
    if (articleContent.conclusion) {
      htmlContent += `<h2>Conclusion</h2>\n`;
      htmlContent += `<p>${articleContent.conclusion}</p>\n\n`;
    }
    if (articleContent.faq && articleContent.faq.length > 0) {
      htmlContent += `<h2>Frequently Asked Questions</h2>\n`;
      articleContent.faq.forEach(qa => {
        htmlContent += `<h3>${qa.question}</h3>\n`;
        htmlContent += `<p>${qa.answer}</p>\n`;
      });
    }
  } else {
    // Plain text/markdown content
    htmlContent = articleContent;
  }

  // Create WordPress post
  const auth = Buffer.from(`${blog.wordpress_username}:${blog.wordpress_app_password}`).toString('base64');

  const postData = {
    title: article.title,
    content: htmlContent,
    status: 'publish',
    categories: blog.default_category_id ? [blog.default_category_id] : []
  };

  // Add featured image if available
  if (article.has_images && articleContent.featured_image) {
    // Would need to upload image to WordPress media library first
    // For now, skip featured image
  }

  const response = await fetch(wpApiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(postData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`WordPress error: ${response.status} - ${errorText}`);
  }

  const wpPost = await response.json();

  return {
    post_id: wpPost.id,
    url: wpPost.link
  };
}

// Replenish queue for a blog with enhanced keyword selection and learning weights
async function replenishQueue(blogId, pipeline) {
  // Get current queue size
  const queueItems = await supabaseRequest(
    `content_queue?blog_id=eq.${blogId}&status=in.(pending,scheduled)&select=id,target_keyword`,
    'GET'
  );

  const currentSize = queueItems.length;
  const targetSize = pipeline.target_queue_size || 20;

  if (currentSize >= targetSize) {
    console.log(`[REPLENISH] Queue full for blog ${blogId}: ${currentSize}/${targetSize}`);
    return 0;
  }

  const articlesToGenerate = Math.min(targetSize - currentSize, 3); // Max 3 at a time for background task
  console.log(`[REPLENISH] Generating ${articlesToGenerate} articles for blog ${blogId}`);

  // Get covered keywords to exclude
  const coveredKeywords = pipeline.covered_keywords || [];
  const queuedKeywords = queueItems.map(q => q.target_keyword).filter(Boolean);
  const excludeKeywords = [...new Set([...coveredKeywords, ...queuedKeywords])];

  // Get learning weights for optimization
  const learningWeights = pipeline.learning_weights || {};

  try {
    // Call the replenish-queue API endpoint to handle keyword generation
    const baseUrl = process.env.URL || 'https://www.getseowizard.com';
    const response = await fetch(`${baseUrl}/.netlify/functions/api/pipeline/replenish-queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blog_id: blogId,
        target_size: targetSize
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`[REPLENISH] Added ${result.articlesAdded || 0} articles to queue for blog ${blogId}`);
      return result.articlesAdded || 0;
    } else {
      console.error(`[REPLENISH] API call failed: ${response.status}`);
      return 0;
    }
  } catch (error) {
    console.error(`[REPLENISH] Error calling replenish API: ${error.message}`);

    // Fallback: simple queue addition without full generation
    console.log(`[REPLENISH] Falling back to simple queue placeholder for ${articlesToGenerate} articles`);

    // Add placeholder queue items that will be generated later
    const preferredTimes = pipeline.preferred_publish_times || ['09:00', '13:00', '17:00'];
    let addedCount = 0;

    for (let i = 0; i < articlesToGenerate; i++) {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + Math.floor(i / preferredTimes.length) + 1);
      const timeSlot = preferredTimes[i % preferredTimes.length];
      scheduledDate.setHours(parseInt(timeSlot.split(':')[0]), parseInt(timeSlot.split(':')[1] || 0));

      await supabaseRequest('content_queue', 'POST', {
        blog_id: blogId,
        title: `Pending Article ${i + 1}`,
        target_keyword: null,
        status: 'pending',
        scheduled_date: scheduledDate.toISOString(),
        generation_priority: 50 - i,
        needs_generation: true
      });
      addedCount++;
    }

    return addedCount;
  }
}

// Get next keywords for article generation
async function getNextKeywords(nicheKeyword, excludeKeywords, count, learningWeights) {
  try {
    const baseUrl = process.env.URL || 'https://www.getseowizard.com';
    const response = await fetch(`${baseUrl}/.netlify/functions/api/pipeline/next-keyword`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        niche_keyword: nicheKeyword,
        exclude_keywords: excludeKeywords,
        content_themes: learningWeights?.preferred_topics || [],
        count
      })
    });

    if (response.ok) {
      const data = await response.json();
      return data.keywords || [];
    }
    return [];
  } catch (error) {
    console.error('[GET KEYWORDS] Error:', error.message);
    return [];
  }
}

// Get next affiliate program for round-robin rotation
async function getNextAffiliateProgram(blogId) {
  try {
    const baseUrl = process.env.URL || 'https://www.getseowizard.com';
    const response = await fetch(`${baseUrl}/.netlify/functions/api/affiliate/next-program`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blog_id: blogId })
    });

    if (response.ok) {
      const data = await response.json();
      return data.program || null;
    }
    return null;
  } catch (error) {
    console.error('[GET AFFILIATE] Error:', error.message);
    return null;
  }
}

// Generate article with enhancements (affiliate links, banners, internal links)
async function generateArticleWithEnhancements(keyword, pipeline, affiliateProgram) {
  try {
    const baseUrl = process.env.URL || 'https://www.getseowizard.com';

    // Get internal linking suggestions first
    let internalLinks = [];
    if (pipeline.internal_linking_enabled) {
      const linksResponse = await fetch(`${baseUrl}/.netlify/functions/api/internal-links/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blog_id: pipeline.blog_id,
          new_article_keyword: keyword.keyword
        })
      });
      if (linksResponse.ok) {
        const linksData = await linksResponse.json();
        internalLinks = linksData.relatedArticles || [];
      }
    }

    // Generate article with affiliate and internal links context
    const articleResponse = await fetch(`${baseUrl}/.netlify/functions/api/pipeline/generate-article`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keyword: keyword.keyword,
        model_tier: pipeline.default_model_tier || 'premium',
        word_count: pipeline.learning_weights?.optimal_word_count_range?.[1] || 2000,
        affiliate_program: affiliateProgram,
        generate_image: pipeline.generate_images !== false,
        existing_articles: internalLinks.map(l => ({ title: l.title, url: l.url }))
      })
    });

    if (articleResponse.ok) {
      const articleData = await articleResponse.json();
      return {
        ...articleData.article,
        internalLinks
      };
    }
    return null;
  } catch (error) {
    console.error('[GENERATE ARTICLE] Error:', error.message);
    return null;
  }
}

// Add article to queue
async function addToQueue(blogId, article, keyword) {
  const preferredTimes = ['09:00', '13:00', '17:00'];
  const scheduledDate = new Date();
  scheduledDate.setDate(scheduledDate.getDate() + 1);
  scheduledDate.setHours(9, 0, 0, 0);

  return supabaseRequest('content_queue', 'POST', {
    blog_id: blogId,
    title: article.title,
    target_keyword: keyword.keyword,
    status: 'pending',
    scheduled_date: scheduledDate.toISOString(),
    opportunity_score: keyword.opportunityScore || keyword.combinedScore,
    generation_priority: keyword.adjustedScore || 50,
    internal_links: article.internalLinks || [],
    article_id: article.id
  });
}

// Add keyword to covered keywords list
async function addToCoveredKeywords(blogId, keyword) {
  try {
    const pipeline = await getPipeline(blogId);
    const coveredKeywords = pipeline?.covered_keywords || [];
    if (!coveredKeywords.includes(keyword)) {
      coveredKeywords.push(keyword);
      await supabaseRequest(
        `content_pipeline?blog_id=eq.${blogId}`,
        'PATCH',
        { covered_keywords: coveredKeywords }
      );
    }
  } catch (error) {
    console.error('[ADD COVERED] Error:', error.message);
  }
}

// Update article status in queue
async function updateQueueStatus(articleId, status, additionalData = {}) {
  const updateData = {
    status,
    updated_at: new Date().toISOString(),
    ...additionalData
  };

  if (status === 'published') {
    updateData.published_at = new Date().toISOString();
  }

  await supabaseRequest(
    `content_queue?id=eq.${articleId}`,
    'PATCH',
    updateData
  );
}

// Get blog details
async function getBlog(blogId) {
  const blogs = await supabaseRequest(
    `blogs?id=eq.${blogId}&select=*`,
    'GET'
  );

  return blogs[0] || null;
}

// Get pipeline for a blog
async function getPipeline(blogId) {
  const pipelines = await supabaseRequest(
    `content_pipeline?blog_id=eq.${blogId}&select=*`,
    'GET'
  );

  return pipelines[0] || null;
}

// Main handler
export async function handler(event, context) {
  console.log('[AUTO-PUBLISHER] Starting scheduled run at', new Date().toISOString());

  // Validate environment
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('[AUTO-PUBLISHER] Missing Supabase configuration');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing Supabase configuration' })
    };
  }

  const results = {
    started_at: new Date().toISOString(),
    articles_checked: 0,
    articles_published: 0,
    articles_failed: 0,
    queues_replenished: 0,
    errors: []
  };

  try {
    // Get all articles due for publishing
    const dueArticles = await getDueArticles();
    results.articles_checked = dueArticles.length;

    console.log(`[AUTO-PUBLISHER] Found ${dueArticles.length} articles due for publishing`);

    // Process each article
    for (const article of dueArticles) {
      try {
        console.log(`[AUTO-PUBLISHER] Publishing: ${article.title}`);

        // Get blog details
        const blog = await getBlog(article.blog_id);
        if (!blog) {
          throw new Error(`Blog not found: ${article.blog_id}`);
        }

        // Mark as publishing
        await updateQueueStatus(article.id, 'publishing');

        // Publish to WordPress
        const wpResult = await publishToWordPress(article, blog);

        // Update status to published
        await updateQueueStatus(article.id, 'published', {
          wordpress_post_id: wpResult.post_id,
          wordpress_url: wpResult.url
        });

        // Increment daily publish counter and update pipeline stats
        const pipeline = await getPipeline(article.blog_id);
        if (pipeline) {
          await supabaseRequest(
            `content_pipeline?blog_id=eq.${article.blog_id}`,
            'PATCH',
            {
              daily_posts_published: (pipeline.daily_posts_published || 0) + 1,
              articles_published: (pipeline.articles_published || 0) + 1,
              last_publish_at: new Date().toISOString()
            }
          );
        }

        // Log the publish for tracking
        await supabaseRequest('publish_log', 'POST', {
          blog_id: article.blog_id,
          article_id: article.article_id,
          queue_item_id: article.id,
          wordpress_post_id: wpResult.post_id,
          wordpress_url: wpResult.url,
          publish_date: new Date().toISOString().split('T')[0]
        });

        results.articles_published++;

        // Trigger queue replenishment for this blog (reuse pipeline from above)
        if (pipeline && pipeline.status === 'active') {
          const replenished = await replenishQueue(article.blog_id, pipeline);
          if (replenished > 0) {
            results.queues_replenished++;
          }
        }

      } catch (articleError) {
        console.error(`[AUTO-PUBLISHER] Failed to publish ${article.title}:`, articleError.message);

        // Update status to failed
        await updateQueueStatus(article.id, 'failed', {
          error_message: articleError.message,
          retry_count: (article.retry_count || 0) + 1,
          last_retry_at: new Date().toISOString()
        });

        results.articles_failed++;
        results.errors.push({
          article_id: article.id,
          title: article.title,
          error: articleError.message
        });
      }
    }

    results.completed_at = new Date().toISOString();
    console.log('[AUTO-PUBLISHER] Run complete:', JSON.stringify(results, null, 2));

    return {
      statusCode: 200,
      body: JSON.stringify(results)
    };

  } catch (error) {
    console.error('[AUTO-PUBLISHER] Fatal error:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        results
      })
    };
  }
}

// Export config for Netlify scheduled functions
export const config = {
  schedule: '@hourly' // Run every hour
};
