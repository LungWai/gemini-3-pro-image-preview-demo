/**
 * Editable API Sites Configuration
 * Manages a list of API base URLs that can be added, removed, and persisted in localStorage
 */

const API_SITES_KEY = 'gemini_api_sites';
const API_SITES_VISIBLE_KEY = 'gemini_api_sites_visible';

// Default sites from proxy.allowlist.json (original configuration)
const DEFAULT_API_SITES = [
  { url: 'https://www.packyapi.com', name: 'Packy API' },
  { url: 'https://api-slb.packyapi.com', name: 'Packy API SLB' },
  { url: 'https://poloai.top', name: 'Polo AI' },
  { url: 'https://jp.duckcoding.com', name: 'Duck Coding JP' },
  { url: 'https://www.galaapi.com', name: 'Gala API' },
  { url: 'https://privnode.com', name: 'Privnode' },
  { url: 'https://jp.privnode.com', name: 'Privnode JP' },
  { url: 'https://privcoding.cc', name: 'Privcoding' },
] as const;

export type ApiSite = {
  url: string;
  name: string;
  isDefault?: boolean;
};

const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

const normalizeUrl = (url: string): string => {
  let normalized = url.trim();
  // Remove trailing slashes
  while (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
};

const parseStoredSites = (): ApiSite[] => {
  const raw = safeGetItem(API_SITES_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    
    return parsed.filter((item): item is ApiSite => 
      typeof item === 'object' &&
      item !== null &&
      typeof item.url === 'string' &&
      typeof item.name === 'string'
    );
  } catch {
    return [];
  }
};

const getDefaultSites = (): ApiSite[] => {
  return DEFAULT_API_SITES.map((site) => ({
    url: site.url,
    name: site.name,
    isDefault: true,
  }));
};

export const apiSitesConfig = {
  /**
   * Get all configured API sites (user-defined + defaults)
   */
  getSites: (): ApiSite[] => {
    const userSites = parseStoredSites();
    const defaultSites = getDefaultSites();
    
    // Merge: user sites first, then defaults that aren't already in user sites
    const userUrls = new Set(userSites.map((s) => normalizeUrl(s.url)));
    const mergedDefaults = defaultSites.filter((d) => !userUrls.has(normalizeUrl(d.url)));
    
    return [...userSites, ...mergedDefaults];
  },

  /**
   * Get just the user-defined sites
   */
  getUserSites: (): ApiSite[] => {
    return parseStoredSites();
  },

  /**
   * Add a new API site
   */
  addSite: (url: string, name?: string): boolean => {
    const normalized = normalizeUrl(url);
    if (!normalized) return false;

    try {
      new URL(normalized); // Validate URL
    } catch {
      return false;
    }

    const sites = parseStoredSites();
    const existingUrls = new Set(sites.map((s) => normalizeUrl(s.url)));
    
    if (existingUrls.has(normalized)) {
      return false; // Already exists
    }

    const newSite: ApiSite = {
      url: normalized,
      name: name?.trim() || new URL(normalized).hostname,
    };

    sites.push(newSite);
    return safeSetItem(API_SITES_KEY, JSON.stringify(sites));
  },

  /**
   * Remove an API site by URL
   */
  removeSite: (url: string): boolean => {
    const normalized = normalizeUrl(url);
    const sites = parseStoredSites();
    const filteredSites = sites.filter((s) => normalizeUrl(s.url) !== normalized);
    
    if (filteredSites.length === sites.length) {
      return false; // Not found
    }

    return safeSetItem(API_SITES_KEY, JSON.stringify(filteredSites));
  },

  /**
   * Update an existing site's name or URL
   */
  updateSite: (oldUrl: string, newUrl: string, newName?: string): boolean => {
    const normalizedOld = normalizeUrl(oldUrl);
    const normalizedNew = normalizeUrl(newUrl);
    
    const sites = parseStoredSites();
    const index = sites.findIndex((s) => normalizeUrl(s.url) === normalizedOld);
    
    if (index === -1) return false;

    sites[index] = {
      url: normalizedNew,
      name: newName?.trim() || new URL(normalizedNew).hostname,
    };

    return safeSetItem(API_SITES_KEY, JSON.stringify(sites));
  },

  /**
   * Reset to default sites only
   */
  reset: (): boolean => {
    try {
      localStorage.removeItem(API_SITES_KEY);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get URL suggestions for autocomplete
   */
  getBaseUrls: (): string[] => {
    return apiSitesConfig.getSites().map((s) => s.url);
  },

  /**
   * Get visibility state of API sites list
   */
  isVisible: (): boolean => {
    try {
      const stored = localStorage.getItem(API_SITES_VISIBLE_KEY);
      // Default to true if not set
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  },

  /**
   * Set visibility state of API sites list
   */
  setVisible: (visible: boolean): boolean => {
    try {
      localStorage.setItem(API_SITES_VISIBLE_KEY, String(visible));
      return true;
    } catch {
      return false;
    }
  },
};

