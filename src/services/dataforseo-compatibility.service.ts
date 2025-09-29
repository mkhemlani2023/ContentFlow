/**
 * DataforSEO Compatibility Layer - Maps Serper API responses to DataforSEO format
 */
import {
  SerperSearchResponse,
  SerperOrganicResult,
  SerperSearchParameters,
  DataforSEOCompatibleSerpResult,
  DataforSEOCompatibleItem,
  DataforSEOCompatibleKeywordInfo,
} from '../types/serper.types';
import { serperApiService } from './serper-api.service';
import { logger } from '../utils/logger';

export interface DataforSEOKeywordRequest {
  keyword: string;
  location_name?: string;
  language_name?: string;
  depth?: number;
  include_seed_keyword?: boolean;
  include_serp_info?: boolean;
  limit?: number;
  offset?: number;
  filters?: Array<{
    field: string;
    operation: string;
    value: unknown;
  }>;
  order_by?: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
}

export interface DataforSEOSerpRequest {
  keyword: string;
  location_name?: string;
  language_name?: string;
  device?: 'desktop' | 'mobile' | 'tablet';
  os?: string;
  depth?: number;
  max_crawl_pages?: number;
  search_param?: string;
  tag?: string;
}

export class DataforSEOCompatibilityService {
  /**
   * Map location codes from DataforSEO format to Serper format
   */
  private mapLocationCode(locationName?: string): string {
    // Common location mappings
    const locationMap: Record<string, string> = {
      'United States': 'us',
      'United Kingdom': 'gb',
      'Canada': 'ca',
      'Australia': 'au',
      'Germany': 'de',
      'France': 'fr',
      'Italy': 'it',
      'Spain': 'es',
      'Netherlands': 'nl',
      'Brazil': 'br',
      'Japan': 'jp',
      'India': 'in',
      'China': 'cn',
      'Russia': 'ru',
    };

    if (!locationName) {
      return 'us'; // Default to US
    }

    return locationMap[locationName] ?? 'us';
  }

  /**
   * Map language codes from DataforSEO format to Serper format
   */
  private mapLanguageCode(languageName?: string): string {
    const languageMap: Record<string, string> = {
      'English': 'en',
      'Spanish': 'es',
      'French': 'fr',
      'German': 'de',
      'Italian': 'it',
      'Portuguese': 'pt',
      'Russian': 'ru',
      'Japanese': 'ja',
      'Korean': 'ko',
      'Chinese': 'zh',
      'Dutch': 'nl',
      'Arabic': 'ar',
    };

    if (!languageName) {
      return 'en'; // Default to English
    }

    return languageMap[languageName] ?? 'en';
  }

  /**
   * Calculate estimated search volume from SERP features
   */
  private estimateSearchVolume(serperResponse: SerperSearchResponse): number {
    // This is a simplified estimation based on available SERP features
    // In a real implementation, you might use additional data sources or ML models

    let estimatedVolume = 1000; // Base volume

    // Increase volume based on organic results count
    if (serperResponse.organic && serperResponse.organic.length > 0) {
      estimatedVolume += serperResponse.organic.length * 100;
    }

    // Increase if there's a knowledge graph (popular topics)
    if (serperResponse.knowledgeGraph) {
      estimatedVolume *= 2;
    }

    // Increase if there are related searches (indicates popular topic)
    if (serperResponse.relatedSearches && serperResponse.relatedSearches.length > 0) {
      estimatedVolume += serperResponse.relatedSearches.length * 200;
    }

    // Increase if there are people also ask questions (indicates search interest)
    if (serperResponse.peopleAlsoAsk && serperResponse.peopleAlsoAsk.length > 0) {
      estimatedVolume += serperResponse.peopleAlsoAsk.length * 150;
    }

    // Cap the maximum estimated volume
    return Math.min(estimatedVolume, 100000);
  }

  /**
   * Calculate keyword difficulty from organic results
   */
  private calculateKeywordDifficulty(organic: SerperOrganicResult[]): number {
    if (!organic || organic.length === 0) {
      return 10; // Low difficulty if no results
    }

    let difficulty = 0;

    // Analyze domain authority indicators (simplified)
    for (const result of organic.slice(0, 10)) { // Top 10 results
      const domain = new URL(result.link).hostname;

      // High authority domains increase difficulty
      const highAuthorityDomains = [
        'wikipedia.org', 'youtube.com', 'amazon.com', 'facebook.com',
        'twitter.com', 'linkedin.com', 'instagram.com', 'reddit.com',
        'pinterest.com', 'quora.com', 'medium.com', 'forbes.com',
        'cnn.com', 'bbc.com', 'nytimes.com', 'washingtonpost.com'
      ];

      if (highAuthorityDomains.some(authDomain => domain.includes(authDomain))) {
        difficulty += 8;
      } else {
        difficulty += 2;
      }

      // Rich snippets indicate competitive results
      if (result.richSnippet) {
        difficulty += 3;
      }

      // Sitelinks indicate established authority
      if (result.sitelinks && result.sitelinks.length > 0) {
        difficulty += 2;
      }
    }

    // Normalize to 0-100 scale
    return Math.min(Math.round(difficulty / organic.length * 10), 100);
  }

  /**
   * Map Serper organic result to DataforSEO item format
   */
  private mapOrganicResultToDataforSEOItem(result: SerperOrganicResult, index: number): DataforSEOCompatibleItem {
    const domain = new URL(result.link).hostname;

    return {
      type: 'organic',
      rank_group: result.position,
      rank_absolute: result.position,
      position: result.position.toString(),
      xpath: `/html/body/div[@id='search']//div[@class='g'][${index + 1}]`,
      domain,
      title: result.title,
      url: result.link,
      breadcrumb: domain,
      is_image: false,
      is_video: false,
      is_featured_snippet: result.position === 1 && Boolean(result.richSnippet),
      is_malicious: false,
      description: result.snippet,
      pre_snippet: result.snippet.substring(0, 50),
      extended_snippet: result.snippet,
      amp_version: false,
      highlighted: this.extractHighlightedTerms(result.snippet),
      links: result.sitelinks?.map(sitelink => ({
        type: 'sitelink',
        title: sitelink.title,
        url: sitelink.link,
      })),
      about_this_result: {
        type: 'organic_result',
        url: result.link,
        source: domain,
      },
    };
  }

  /**
   * Extract highlighted terms from snippet (simplified)
   */
  private extractHighlightedTerms(snippet: string): string[] {
    // This is a simplified implementation
    // In reality, you'd need more sophisticated text analysis
    const commonTerms = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = snippet.toLowerCase().split(/\s+/)
      .filter(word => word.length > 3 && !commonTerms.includes(word))
      .slice(0, 5);

    return words;
  }

  /**
   * Convert Serper search response to DataforSEO SERP format
   */
  mapSerpResponse(
    request: DataforSEOSerpRequest,
    serperResponse: SerperSearchResponse
  ): DataforSEOCompatibleSerpResult {
    return {
      keyword: request.keyword,
      location_name: request.location_name ?? 'United States',
      language_name: request.language_name ?? 'English',
      check_url: `https://www.google.com/search?q=${encodeURIComponent(request.keyword)}`,
      datetime: new Date().toISOString(),
      item_types: ['organic'],
      se_results_count: serperResponse.organic?.length ?? 0,
      items_count: serperResponse.organic?.length ?? 0,
      items: serperResponse.organic?.map((result, index) =>
        this.mapOrganicResultToDataforSEOItem(result, index)
      ) ?? [],
    };
  }

  /**
   * Create keyword info from Serper response (for keyword research endpoint)
   */
  mapKeywordInfo(
    keyword: string,
    serperResponse: SerperSearchResponse
  ): DataforSEOCompatibleKeywordInfo {
    return {
      keyword,
      search_volume: this.estimateSearchVolume(serperResponse),
      keyword_difficulty: this.calculateKeywordDifficulty(serperResponse.organic ?? []),
      cpc: 0.5, // Default CPC value
      competition: 0.3, // Default competition value
      related_keywords: serperResponse.relatedSearches?.map(rs => rs.query).slice(0, 10) ?? [],
    };
  }

  /**
   * DataforSEO compatible keyword research endpoint
   */
  async getKeywordData(request: DataforSEOKeywordRequest): Promise<{
    version: string;
    status_code: number;
    status_message: string;
    time: string;
    cost: number;
    tasks_count: number;
    tasks_error: number;
    tasks: Array<{
      id: string;
      status_code: number;
      status_message: string;
      time: string;
      cost: number;
      result_count: number;
      path: string[];
      data: {
        api: string;
        function: string;
        keyword: string;
        location_name: string;
        language_name: string;
      };
      result: DataforSEOCompatibleKeywordInfo[];
    }>;
  }> {
    try {
      const serperParams: SerperSearchParameters = {
        q: request.keyword,
        gl: this.mapLocationCode(request.location_name),
        hl: this.mapLanguageCode(request.language_name),
        num: Math.min(request.limit ?? 10, 100),
      };

      const serperResponse = await serperApiService.search(serperParams);
      const keywordInfo = this.mapKeywordInfo(request.keyword, serperResponse);

      return {
        version: '0.1.20240101',
        status_code: 20000,
        status_message: 'Ok.',
        time: '0.5 sec.',
        cost: 0.002,
        tasks_count: 1,
        tasks_error: 0,
        tasks: [{
          id: `keyword-${Date.now()}`,
          status_code: 20000,
          status_message: 'Ok.',
          time: '0.5 sec.',
          cost: 0.002,
          result_count: 1,
          path: ['keywords_data', 'google', 'keyword_ideas', 'live'],
          data: {
            api: 'keywords_data',
            function: 'keyword_ideas',
            keyword: request.keyword,
            location_name: request.location_name ?? 'United States',
            language_name: request.language_name ?? 'English',
          },
          result: [keywordInfo],
        }],
      };
    } catch (error) {
      logger.error('Keyword research mapping failed', {
        keyword: request.keyword,
        error: (error as Error).message,
      });

      return {
        version: '0.1.20240101',
        status_code: 40000,
        status_message: (error as Error).message,
        time: '0.1 sec.',
        cost: 0,
        tasks_count: 1,
        tasks_error: 1,
        tasks: [],
      };
    }
  }

  /**
   * DataforSEO compatible SERP analysis endpoint
   */
  async getSerpData(request: DataforSEOSerpRequest): Promise<{
    version: string;
    status_code: number;
    status_message: string;
    time: string;
    cost: number;
    tasks_count: number;
    tasks_error: number;
    tasks: Array<{
      id: string;
      status_code: number;
      status_message: string;
      time: string;
      cost: number;
      result_count: number;
      path: string[];
      data: {
        api: string;
        function: string;
        keyword: string;
        location_name: string;
        language_name: string;
        device: string;
      };
      result: DataforSEOCompatibleSerpResult[];
    }>;
  }> {
    try {
      const serperParams: SerperSearchParameters = {
        q: request.keyword,
        gl: this.mapLocationCode(request.location_name),
        hl: this.mapLanguageCode(request.language_name),
        num: Math.min(request.depth ?? 10, 100),
      };

      const serperResponse = await serperApiService.search(serperParams);
      const serpResult = this.mapSerpResponse(request, serperResponse);

      return {
        version: '0.1.20240101',
        status_code: 20000,
        status_message: 'Ok.',
        time: '0.8 sec.',
        cost: 0.002,
        tasks_count: 1,
        tasks_error: 0,
        tasks: [{
          id: `serp-${Date.now()}`,
          status_code: 20000,
          status_message: 'Ok.',
          time: '0.8 sec.',
          cost: 0.002,
          result_count: 1,
          path: ['serp', 'google', 'organic', 'live', 'advanced'],
          data: {
            api: 'serp',
            function: 'live',
            keyword: request.keyword,
            location_name: request.location_name ?? 'United States',
            language_name: request.language_name ?? 'English',
            device: request.device ?? 'desktop',
          },
          result: [serpResult],
        }],
      };
    } catch (error) {
      logger.error('SERP analysis mapping failed', {
        keyword: request.keyword,
        error: (error as Error).message,
      });

      return {
        version: '0.1.20240101',
        status_code: 40000,
        status_message: (error as Error).message,
        time: '0.1 sec.',
        cost: 0,
        tasks_count: 1,
        tasks_error: 1,
        tasks: [],
      };
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    serperApiStatus: string;
    responseTime?: number;
    error?: string;
  }> {
    try {
      const start = Date.now();
      const serperHealth = await serperApiService.healthCheck();
      const responseTime = Date.now() - start;

      return {
        healthy: serperHealth.healthy,
        serperApiStatus: serperHealth.healthy ? 'operational' : 'degraded',
        responseTime,
        error: serperHealth.error,
      };
    } catch (error) {
      return {
        healthy: false,
        serperApiStatus: 'error',
        error: (error as Error).message,
      };
    }
  }
}

// Global compatibility service instance
export const dataforSEOCompatibilityService = new DataforSEOCompatibilityService();