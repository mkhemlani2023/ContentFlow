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

// Get articles due for publishing
async function getDueArticles() {
  const now = new Date().toISOString();

  // Get scheduled articles where scheduled_date <= now
  const articles = await supabaseRequest(
    `content_queue?status=eq.scheduled&scheduled_date=lte.${now}&order=scheduled_date.asc&limit=10`,
    'GET'
  );

  return articles;
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

// Replenish queue for a blog
async function replenishQueue(blogId, pipeline) {
  // Get current queue size
  const queueItems = await supabaseRequest(
    `content_queue?blog_id=eq.${blogId}&status=in.(pending,scheduled)&select=id`,
    'GET'
  );

  const currentSize = queueItems.length;
  const targetSize = pipeline.target_queue_size || 20;

  if (currentSize >= targetSize) {
    console.log(`[REPLENISH] Queue full for blog ${blogId}: ${currentSize}/${targetSize}`);
    return 0;
  }

  const articlesToGenerate = targetSize - currentSize;
  console.log(`[REPLENISH] Generating ${articlesToGenerate} articles for blog ${blogId}`);

  // Get covered keywords to exclude
  const coveredKeywords = pipeline.covered_keywords || [];

  // This would call the pipeline/generate-article endpoint
  // For now, we'll just log - actual generation happens via API call from frontend
  console.log(`[REPLENISH] Would generate ${articlesToGenerate} articles, excluding ${coveredKeywords.length} keywords`);

  return articlesToGenerate;
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

        results.articles_published++;

        // Trigger queue replenishment for this blog
        const pipeline = await getPipeline(article.blog_id);
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
