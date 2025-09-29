/**
 * Serper API Types and Interfaces
 */

export interface SerperSearchParameters {
  q: string;
  gl?: string; // Geographic location (e.g., 'us', 'uk')
  hl?: string; // Language (e.g., 'en', 'es')
  num?: number; // Number of results (max 100)
  type?: 'search' | 'images' | 'videos' | 'places' | 'news' | 'scholar';
  tbs?: string; // Time-based search parameters
  page?: number;
}

export interface SerperOrganicResult {
  position: number;
  title: string;
  link: string;
  snippet: string;
  date?: string;
  sitelinks?: SerperSitelink[];
  richSnippet?: SerperRichSnippet;
}

export interface SerperSitelink {
  title: string;
  link: string;
}

export interface SerperRichSnippet {
  top?: {
    detected_extensions?: Record<string, string>;
    extensions?: string[];
  };
  bottom?: {
    detected_extensions?: Record<string, string>;
    extensions?: string[];
  };
}

export interface SerperKnowledgeGraph {
  title: string;
  type?: string;
  website?: string;
  imageUrl?: string;
  description?: string;
  descriptionSource?: string;
  descriptionLink?: string;
  attributes?: Record<string, string>;
}

export interface SerperPeopleAlsoAsk {
  question: string;
  snippet: string;
  title: string;
  link: string;
}

export interface SerperRelatedSearch {
  query: string;
}

export interface SerperSearchResponse {
  searchParameters: SerperSearchParameters;
  organic: SerperOrganicResult[];
  peopleAlsoAsk?: SerperPeopleAlsoAsk[];
  relatedSearches?: SerperRelatedSearch[];
  knowledgeGraph?: SerperKnowledgeGraph;
  answerBox?: {
    answer: string;
    title: string;
    link: string;
  };
  credits: number;
}

// DataforSEO compatible response types for backward compatibility
export interface DataforSEOCompatibleKeywordInfo {
  keyword: string;
  search_volume: number;
  keyword_difficulty: number;
  cpc?: number;
  competition?: number;
  related_keywords?: string[];
}

export interface DataforSEOCompatibleSerpResult {
  keyword: string;
  location_name: string;
  language_name: string;
  check_url: string;
  datetime: string;
  spell?: {
    keyword: string;
    type: string;
  };
  item_types: string[];
  se_results_count: number;
  items_count: number;
  items: DataforSEOCompatibleItem[];
}

export interface DataforSEOCompatibleItem {
  type: string;
  rank_group: number;
  rank_absolute: number;
  position: string;
  xpath: string;
  domain: string;
  title: string;
  url: string;
  breadcrumb?: string;
  is_image: boolean;
  is_video: boolean;
  is_featured_snippet: boolean;
  is_malicious: boolean;
  description: string;
  pre_snippet?: string;
  extended_snippet?: string;
  amp_version?: boolean;
  rating?: {
    rating_type: string;
    value: number;
    votes_count: number;
    rating_max: number;
  };
  highlighted?: string[];
  links?: Array<{
    type: string;
    title: string;
    url: string;
  }>;
  about_this_result?: {
    type: string;
    url: string;
    source: string;
  };
  related_result?: Array<{
    type: string;
    url: string;
  }>;
}

export interface SerperApiError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;
}