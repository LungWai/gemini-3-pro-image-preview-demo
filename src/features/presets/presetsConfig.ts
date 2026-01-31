/**
 * Preset Prompts Configuration
 * Manages a list of preset prompts that can be added, edited, removed, and persisted in localStorage
 */

const PRESETS_KEY = 'gemini_preset_prompts';

export interface Preset {
  id: string;
  name: string;
  prompt: string;
  icon?: string;
}

const generateId = (): string => {
  return `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Default presets that are available on first use
const DEFAULT_PRESETS: Preset[] = [
  {
    id: 'default_describe',
    name: 'Describe Image',
    prompt: 'Please describe this image in detail. Include information about the main subjects, colors, composition, and any notable elements.',
    icon: '🔍',
  },
  {
    id: 'default_extract_text',
    name: 'Extract Text',
    prompt: 'Please extract and transcribe all visible text from this image. Format the text clearly and maintain the original structure where possible.',
    icon: '📝',
  },
  {
    id: 'default_analyze',
    name: 'Analyze Content',
    prompt: 'Analyze this image and provide insights about its content, context, and any interesting observations. What story does this image tell?',
    icon: '🧠',
  },
  {
    id: 'default_creative',
    name: 'Creative Story',
    prompt: 'Create a short creative story inspired by this image. Use vivid descriptions and engaging narrative.',
    icon: '✨',
  },
];

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

const parseStoredPresets = (): Preset[] | null => {
  const raw = safeGetItem(PRESETS_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    
    return parsed.filter((item): item is Preset => 
      typeof item === 'object' &&
      item !== null &&
      typeof item.id === 'string' &&
      typeof item.name === 'string' &&
      typeof item.prompt === 'string'
    );
  } catch {
    return null;
  }
};

export const presetsConfig = {
  /**
   * Get all presets (user-defined or defaults if none saved)
   */
  getPresets: (): Preset[] => {
    const stored = parseStoredPresets();
    return stored !== null ? stored : [...DEFAULT_PRESETS];
  },

  /**
   * Add a new preset
   */
  addPreset: (name: string, prompt: string, icon?: string): Preset | null => {
    if (!name.trim() || !prompt.trim()) return null;

    const presets = presetsConfig.getPresets();
    const newPreset: Preset = {
      id: generateId(),
      name: name.trim(),
      prompt: prompt.trim(),
      icon: icon?.trim() || '📌',
    };

    presets.push(newPreset);
    if (safeSetItem(PRESETS_KEY, JSON.stringify(presets))) {
      return newPreset;
    }
    return null;
  },

  /**
   * Update an existing preset
   */
  updatePreset: (id: string, updates: Partial<Omit<Preset, 'id'>>): boolean => {
    const presets = presetsConfig.getPresets();
    const index = presets.findIndex((p) => p.id === id);
    
    if (index === -1) return false;

    presets[index] = {
      ...presets[index],
      ...updates,
      id, // Ensure ID doesn't change
    };

    return safeSetItem(PRESETS_KEY, JSON.stringify(presets));
  },

  /**
   * Remove a preset by ID
   */
  removePreset: (id: string): boolean => {
    const presets = presetsConfig.getPresets();
    const filtered = presets.filter((p) => p.id !== id);
    
    if (filtered.length === presets.length) return false;

    return safeSetItem(PRESETS_KEY, JSON.stringify(filtered));
  },

  /**
   * Reset to default presets
   */
  reset: (): boolean => {
    try {
      localStorage.removeItem(PRESETS_KEY);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Reorder presets
   */
  reorderPresets: (presets: Preset[]): boolean => {
    return safeSetItem(PRESETS_KEY, JSON.stringify(presets));
  },
};

