/**
 * DataforSEO Compatibility Service Tests
 */
import { DataforSEOCompatibilityService } from '../../services/dataforseo-compatibility.service';
import { serperApiService } from '../../services/serper-api.service';

// Mock Serper API service
jest.mock('../../services/serper-api.service');
const mockedSerperApiService = serperApiService as jest.Mocked<typeof serperApiService>;

describe('DataforSEOCompatibilityService', () => {
  let compatibilityService: DataforSEOCompatibilityService;

  beforeEach(() => {
    compatibilityService = new DataforSEOCompatibilityService();
    jest.clearAllMocks();
  });

  describe('getKeywordData', () => {
    it('should return DataforSEO compatible keyword data', async () => {
      const mockSerperResponse = global.testHelpers.createMockSerperResponse({
        organic: [
          {
            position: 1,
            title: 'Best Content Marketing Tools',
            link: 'https://example.com/tools',
            snippet: 'Discover the best content marketing tools for your business...',
          },
          {
            position: 2,
            title: 'Content Marketing Guide',
            link: 'https://guide.com/marketing',
            snippet: 'Complete guide to content marketing strategies...',
          },
        ],
        relatedSearches: [
          { query: 'content marketing strategy' },
          { query: 'content marketing examples' },
        ],
        knowledgeGraph: {
          title: 'Content Marketing',
          description: 'Content marketing is a strategic marketing approach...',
        },
      });

      mockedSerperApiService.search.mockResolvedValue(mockSerperResponse);

      const request = {
        keyword: 'content marketing',
        location_name: 'United States',
        language_name: 'English',
      };

      const result = await compatibilityService.getKeywordData(request);

      expect(result).toMatchObject({
        version: expect.stringMatching(/^\d+\.\d+\.\d+$/),
        status_code: 20000,
        status_message: 'Ok.',
        tasks_count: 1,
        tasks_error: 0,
        tasks: expect.arrayContaining([
          expect.objectContaining({
            status_code: 20000,
            result: expect.arrayContaining([
              expect.objectContaining({
                keyword: 'content marketing',
                search_volume: expect.any(Number),
                keyword_difficulty: expect.any(Number),
                related_keywords: expect.arrayContaining([
                  'content marketing strategy',
                  'content marketing examples',
                ]),
              }),
            ]),
          }),
        ]),
      });

      expect(mockedSerperApiService.search).toHaveBeenCalledWith({
        q: 'content marketing',
        gl: 'us',
        hl: 'en',
        num: 10,
      });
    });

    it('should handle API errors gracefully', async () => {
      mockedSerperApiService.search.mockRejectedValue(new Error('API Error'));

      const request = {
        keyword: 'test keyword',
      };

      const result = await compatibilityService.getKeywordData(request);

      expect(result).toMatchObject({
        status_code: 40000,
        status_message: 'API Error',
        tasks_count: 1,
        tasks_error: 1,
        tasks: [],
      });
    });

    it('should estimate search volume based on SERP features', async () => {
      const mockSerperResponse = global.testHelpers.createMockSerperResponse({
        organic: Array.from({ length: 10 }, (_, i) => ({
          position: i + 1,
          title: `Result ${i + 1}`,
          link: `https://example${i + 1}.com`,
          snippet: `Snippet for result ${i + 1}`,
        })),
        knowledgeGraph: {
          title: 'Popular Topic',
          description: 'This is a very popular topic...',
        },
        relatedSearches: [
          { query: 'related 1' },
          { query: 'related 2' },
          { query: 'related 3' },
        ],
        peopleAlsoAsk: [
          {
            question: 'What is this topic?',
            snippet: 'Answer to the question...',
            title: 'Question Title',
            link: 'https://example.com/answer',
          },
        ],
      });

      mockedSerperApiService.search.mockResolvedValue(mockSerperResponse);

      const request = { keyword: 'popular topic' };
      const result = await compatibilityService.getKeywordData(request);

      const keywordInfo = result.tasks[0]?.result[0];
      expect(keywordInfo?.search_volume).toBeGreaterThan(1000);
    });

    it('should calculate keyword difficulty from organic results', async () => {
      const mockSerperResponse = global.testHelpers.createMockSerperResponse({
        organic: [
          {
            position: 1,
            title: 'Wikipedia Article',
            link: 'https://wikipedia.org/article',
            snippet: 'Comprehensive article from Wikipedia...',
            richSnippet: { top: { extensions: ['Featured'] } },
            sitelinks: [
              { title: 'Subpage 1', link: 'https://wikipedia.org/sub1' },
            ],
          },
          {
            position: 2,
            title: 'YouTube Video',
            link: 'https://youtube.com/watch?v=123',
            snippet: 'Popular video on the topic...',
          },
          {
            position: 3,
            title: 'Small Blog',
            link: 'https://smallblog.com/post',
            snippet: 'Blog post about the topic...',
          },
        ],
      });

      mockedSerperApiService.search.mockResolvedValue(mockSerperResponse);

      const request = { keyword: 'competitive keyword' };
      const result = await compatibilityService.getKeywordData(request);

      const keywordInfo = result.tasks[0]?.result[0];
      expect(keywordInfo?.keyword_difficulty).toBeGreaterThan(30); // Should be high due to Wikipedia and YouTube
    });
  });

  describe('getSerpData', () => {
    it('should return DataforSEO compatible SERP data', async () => {
      const mockSerperResponse = global.testHelpers.createMockSerperResponse({
        organic: [
          {
            position: 1,
            title: 'Top Result',
            link: 'https://example.com/top',
            snippet: 'This is the top search result...',
            sitelinks: [
              { title: 'Subpage', link: 'https://example.com/sub' },
            ],
          },
        ],
      });

      mockedSerperApiService.search.mockResolvedValue(mockSerperResponse);

      const request = {
        keyword: 'test query',
        location_name: 'United States',
        language_name: 'English',
        device: 'desktop' as const,
      };

      const result = await compatibilityService.getSerpData(request);

      expect(result).toMatchObject({
        status_code: 20000,
        tasks: expect.arrayContaining([
          expect.objectContaining({
            result: expect.arrayContaining([
              expect.objectContaining({
                keyword: 'test query',
                location_name: 'United States',
                language_name: 'English',
                items: expect.arrayContaining([
                  expect.objectContaining({
                    type: 'organic',
                    position: '1',
                    title: 'Top Result',
                    url: 'https://example.com/top',
                    description: 'This is the top search result...',
                    domain: 'example.com',
                    is_featured_snippet: false,
                    links: expect.arrayContaining([
                      expect.objectContaining({
                        type: 'sitelink',
                        title: 'Subpage',
                        url: 'https://example.com/sub',
                      }),
                    ]),
                  }),
                ]),
              }),
            ]),
          }),
        ]),
      });
    });

    it('should map location codes correctly', async () => {
      const mockSerperResponse = global.testHelpers.createMockSerperResponse();
      mockedSerperApiService.search.mockResolvedValue(mockSerperResponse);

      // Test various location mappings
      const testCases = [
        { input: 'United Kingdom', expected: 'gb' },
        { input: 'Canada', expected: 'ca' },
        { input: 'Germany', expected: 'de' },
        { input: 'Unknown Location', expected: 'us' }, // Default
        { input: undefined, expected: 'us' }, // Default
      ];

      for (const testCase of testCases) {
        await compatibilityService.getSerpData({
          keyword: 'test',
          location_name: testCase.input,
        });

        expect(mockedSerperApiService.search).toHaveBeenCalledWith(
          expect.objectContaining({
            gl: testCase.expected,
          })
        );
      }
    });

    it('should map language codes correctly', async () => {
      const mockSerperResponse = global.testHelpers.createMockSerperResponse();
      mockedSerperApiService.search.mockResolvedValue(mockSerperResponse);

      // Test various language mappings
      const testCases = [
        { input: 'Spanish', expected: 'es' },
        { input: 'French', expected: 'fr' },
        { input: 'German', expected: 'de' },
        { input: 'Unknown Language', expected: 'en' }, // Default
        { input: undefined, expected: 'en' }, // Default
      ];

      for (const testCase of testCases) {
        await compatibilityService.getSerpData({
          keyword: 'test',
          language_name: testCase.input,
        });

        expect(mockedSerperApiService.search).toHaveBeenCalledWith(
          expect.objectContaining({
            hl: testCase.expected,
          })
        );
      }
    });

    it('should handle API errors gracefully', async () => {
      mockedSerperApiService.search.mockRejectedValue(new Error('SERP API Error'));

      const request = {
        keyword: 'test keyword',
      };

      const result = await compatibilityService.getSerpData(request);

      expect(result).toMatchObject({
        status_code: 40000,
        status_message: 'SERP API Error',
        tasks_count: 1,
        tasks_error: 1,
        tasks: [],
      });
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when Serper API is healthy', async () => {
      mockedSerperApiService.healthCheck.mockResolvedValue({
        healthy: true,
        responseTime: 250,
        rateLimitInfo: { remaining: 90, reset: Date.now() + 60000, limit: 100 },
        circuitBreakerState: 'CLOSED',
      });

      const health = await compatibilityService.healthCheck();

      expect(health).toEqual({
        healthy: true,
        serperApiStatus: 'operational',
        responseTime: expect.any(Number),
      });
    });

    it('should return unhealthy status when Serper API is unhealthy', async () => {
      mockedSerperApiService.healthCheck.mockResolvedValue({
        healthy: false,
        error: 'Serper API Error',
        rateLimitInfo: { remaining: 0, reset: Date.now() + 60000, limit: 100 },
        circuitBreakerState: 'OPEN',
      });

      const health = await compatibilityService.healthCheck();

      expect(health).toEqual({
        healthy: false,
        serperApiStatus: 'degraded',
        responseTime: expect.any(Number),
        error: 'Serper API Error',
      });
    });

    it('should handle health check errors', async () => {
      mockedSerperApiService.healthCheck.mockRejectedValue(new Error('Health check failed'));

      const health = await compatibilityService.healthCheck();

      expect(health).toEqual({
        healthy: false,
        serperApiStatus: 'error',
        error: 'Health check failed',
      });
    });
  });

  describe('private helper methods', () => {
    it('should extract highlighted terms from snippet', async () => {
      const mockSerperResponse = global.testHelpers.createMockSerperResponse({
        organic: [
          {
            position: 1,
            title: 'Test Title',
            link: 'https://example.com',
            snippet: 'This content marketing strategy helps businesses grow their online presence effectively',
          },
        ],
      });

      mockedSerperApiService.search.mockResolvedValue(mockSerperResponse);

      const request = { keyword: 'test' };
      const result = await compatibilityService.getSerpData(request);

      const item = result.tasks[0]?.result[0]?.items[0];
      expect(item?.highlighted).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/^[a-z]{4,}$/), // Words longer than 3 chars
        ])
      );
    });

    it('should identify featured snippets correctly', async () => {
      const mockSerperResponse = global.testHelpers.createMockSerperResponse({
        organic: [
          {
            position: 1,
            title: 'Featured Result',
            link: 'https://example.com/featured',
            snippet: 'This appears in a featured snippet...',
            richSnippet: {
              top: { extensions: ['Featured Snippet'] },
            },
          },
        ],
      });

      mockedSerperApiService.search.mockResolvedValue(mockSerperResponse);

      const request = { keyword: 'featured query' };
      const result = await compatibilityService.getSerpData(request);

      const item = result.tasks[0]?.result[0]?.items[0];
      expect(item?.is_featured_snippet).toBe(true);
    });
  });
});