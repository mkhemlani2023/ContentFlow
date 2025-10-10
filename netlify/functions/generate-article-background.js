const fs = require('fs').promises;
const path = require('path');

// OpenRouter API configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Status file directory
const STATUS_DIR = '/tmp/article-status';

// Helper function to save job status
async function saveJobStatus(jobId, status) {
    try {
        await fs.mkdir(STATUS_DIR, { recursive: true });
        await fs.writeFile(
            path.join(STATUS_DIR, `${jobId}.json`),
            JSON.stringify(status, null, 2)
        );
    } catch (error) {
        console.error('Error saving job status:', error);
    }
}

// Helper function to call OpenRouter API
async function callOpenRouter(messages, model, maxTokens) {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://getseowizard.com',
            'X-Title': 'SEO Wizard'
        },
        body: JSON.stringify({
            model,
            messages,
            max_tokens: maxTokens,
            temperature: 0.7,
            stream: false
        })
    });

    if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// Main handler
exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    const { jobId, outline, keyword, modelTier, targetWordCount } = JSON.parse(event.body);

    // Start background processing (no timeout limit)
    (async () => {
        try {
            // Initialize status
            await saveJobStatus(jobId, {
                progress: 'Starting generation...',
                phase: 'initialization',
                sectionsComplete: 0,
                totalSections: outline.sections.length + 3, // +3 for intro, conclusion, FAQ
                complete: false,
                error: null
            });

            // Determine model based on tier
            let model;
            switch (modelTier) {
                case 'basic':
                    model = 'openai/gpt-4o-mini';
                    break;
                case 'premium':
                    model = 'anthropic/claude-3-5-sonnet';
                    break;
                case 'enterprise':
                    model = 'anthropic/claude-3.5-sonnet';
                    break;
                default:
                    model = 'openai/gpt-4o-mini';
            }

            const generatedSections = {};
            let sectionsComplete = 0;
            const totalSections = outline.sections.length + 3;

            // Phase 1: Generate Introduction
            await saveJobStatus(jobId, {
                progress: 'Generating introduction...',
                phase: 'introduction',
                sectionsComplete,
                totalSections,
                complete: false,
                error: null
            });

            const introPrompt = `Write the introduction for this article about "${keyword}".

Target word count: ${outline.introduction.wordCount} words
Purpose: ${outline.introduction.purpose}
Key points to cover: ${outline.introduction.keyPoints.join(', ')}

Write in a professional, engaging tone. Use short paragraphs. Include the focus keyword naturally. Current year: ${new Date().getFullYear()}.

Return ONLY the introduction content, no titles or extra formatting.`;

            generatedSections.introduction = await callOpenRouter(
                [{ role: 'user', content: introPrompt }],
                model,
                Math.floor(outline.introduction.wordCount * 1.5)
            );
            sectionsComplete++;

            // Phase 2: Generate Each Section
            for (let i = 0; i < outline.sections.length; i++) {
                const section = outline.sections[i];

                await saveJobStatus(jobId, {
                    progress: `Generating section ${i + 1}/${outline.sections.length}: ${section.title}`,
                    phase: 'sections',
                    sectionsComplete,
                    totalSections,
                    complete: false,
                    error: null
                });

                const sectionPrompt = `Write section "${section.title}" for an article about "${keyword}".

Target word count: ${section.wordCount} words
Purpose: ${section.purpose}
Key points to cover: ${section.keyPoints.join(', ')}

Write in a professional, informative tone. Use:
- Short paragraphs (2-3 sentences)
- Subheadings (H3) where appropriate
- Bullet points or numbered lists for clarity
- Natural keyword integration

Current year: ${new Date().getFullYear()}.

Return ONLY the section content with proper HTML formatting (<h3>, <p>, <ul>, <li>, etc.). Include the section title as an <h2>.`;

                generatedSections[`section_${i}`] = await callOpenRouter(
                    [{ role: 'user', content: sectionPrompt }],
                    model,
                    Math.floor(section.wordCount * 1.5)
                );
                sectionsComplete++;
            }

            // Phase 3: Generate Conclusion
            await saveJobStatus(jobId, {
                progress: 'Generating conclusion...',
                phase: 'conclusion',
                sectionsComplete,
                totalSections,
                complete: false,
                error: null
            });

            const conclusionPrompt = `Write the conclusion for this article about "${keyword}".

Target word count: ${outline.conclusion.wordCount} words
Purpose: ${outline.conclusion.purpose}
Key points to summarize: ${outline.conclusion.keyPoints.join(', ')}

Wrap up the article by summarizing key takeaways and providing a call-to-action or final thoughts. Current year: ${new Date().getFullYear()}.

Return ONLY the conclusion content, no titles or extra formatting.`;

            generatedSections.conclusion = await callOpenRouter(
                [{ role: 'user', content: conclusionPrompt }],
                model,
                Math.floor(outline.conclusion.wordCount * 1.5)
            );
            sectionsComplete++;

            // Phase 4: Generate FAQ
            if (outline.faq && outline.faq.length > 0) {
                await saveJobStatus(jobId, {
                    progress: 'Generating FAQ section...',
                    phase: 'faq',
                    sectionsComplete,
                    totalSections,
                    complete: false,
                    error: null
                });

                const faqPrompt = `Write a FAQ section for this article about "${keyword}".

Questions to answer:
${outline.faq.map((q, i) => `${i + 1}. ${q.question} (Purpose: ${q.purpose})`).join('\n')}

For each question, provide a concise, helpful answer (50-100 words). Use HTML formatting:
<h3>Question</h3>
<p>Answer</p>

Return ONLY the FAQ content with proper HTML formatting.`;

                generatedSections.faq = await callOpenRouter(
                    [{ role: 'user', content: faqPrompt }],
                    model,
                    800
                );
                sectionsComplete++;
            }

            // Phase 5: Assemble and Proofread
            await saveJobStatus(jobId, {
                progress: 'Assembling and proofreading article...',
                phase: 'proofread',
                sectionsComplete,
                totalSections,
                complete: false,
                error: null
            });

            // Assemble the complete article
            let fullArticle = `<h1>${outline.title}</h1>\n\n`;
            fullArticle += `${generatedSections.introduction}\n\n`;

            for (let i = 0; i < outline.sections.length; i++) {
                fullArticle += `${generatedSections[`section_${i}`]}\n\n`;
            }

            fullArticle += `<h2>Conclusion</h2>\n${generatedSections.conclusion}\n\n`;

            if (generatedSections.faq) {
                fullArticle += `<h2>Frequently Asked Questions</h2>\n${generatedSections.faq}`;
            }

            // Proofread and polish
            const proofreadPrompt = `Proofread and polish this article. Fix any:
- Grammar or spelling errors
- Awkward phrasing
- Inconsistent formatting
- Missing transitions between sections

Ensure the focus keyword "${keyword}" appears naturally throughout.

Return ONLY the polished article content with proper HTML formatting. Do NOT add any commentary.

Article:
${fullArticle}`;

            const finalArticle = await callOpenRouter(
                [{ role: 'user', content: proofreadPrompt }],
                model,
                Math.floor(targetWordCount * 1.8)
            );

            // Calculate actual word count
            const plainText = finalArticle.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            const actualWordCount = plainText.split(/\s+/).length;

            // Save final result
            await saveJobStatus(jobId, {
                progress: 'Complete!',
                phase: 'complete',
                sectionsComplete: totalSections,
                totalSections,
                complete: true,
                error: null,
                result: {
                    content: finalArticle,
                    metadata: {
                        title: outline.title,
                        seoTitle: outline.metadata?.seoTitle || outline.title,
                        metaDescription: outline.metadata?.metaDescription || '',
                        focusKeyword: keyword,
                        relatedKeywords: outline.metadata?.relatedKeywords || [],
                        targetWordCount,
                        actualWordCount
                    }
                }
            });

        } catch (error) {
            console.error('Error in background generation:', error);
            await saveJobStatus(jobId, {
                progress: 'Error occurred',
                phase: 'error',
                sectionsComplete: 0,
                totalSections: 0,
                complete: false,
                error: error.message
            });
        }
    })();

    // Return immediately with job ID
    return {
        statusCode: 202, // Accepted
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            success: true,
            jobId,
            message: 'Article generation started in background'
        })
    };
};
