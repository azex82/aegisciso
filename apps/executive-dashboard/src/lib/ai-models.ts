/**
 * AI Model Providers Configuration
 * Minimal list of supported providers and models
 */

export enum AIProvider {
  GROQ = 'groq',
  OPENAI = 'openai',
  DEEPSEEK = 'deepseek',
  OLLAMA = 'ollama',
}

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  description: string;
  isDefault?: boolean;
  isReasoning?: boolean;
}

export interface ProviderConfig {
  id: AIProvider;
  name: string;
  description: string;
  requiresApiKey: boolean;
  baseUrl?: string;
  models: AIModel[];
}

// Provider configurations with their models
export const PROVIDER_CONFIGS: Record<AIProvider, ProviderConfig> = {
  [AIProvider.GROQ]: {
    id: AIProvider.GROQ,
    name: 'Groq',
    description: 'Ultra-fast inference with Groq',
    requiresApiKey: true,
    models: [
      {
        id: 'llama-3.3-70b-versatile',
        name: 'Llama 3.3 70B',
        provider: AIProvider.GROQ,
        description: 'Most capable Llama model',
        isDefault: true,
      },
      {
        id: 'llama-3.1-8b-instant',
        name: 'Llama 3.1 8B',
        provider: AIProvider.GROQ,
        description: 'Fast and efficient',
      },
      {
        id: 'mixtral-8x7b-32768',
        name: 'Mixtral 8x7B',
        provider: AIProvider.GROQ,
        description: 'Mixture of experts model',
      },
    ],
  },
  [AIProvider.OPENAI]: {
    id: AIProvider.OPENAI,
    name: 'OpenAI',
    description: 'GPT models from OpenAI',
    requiresApiKey: true,
    models: [
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: AIProvider.OPENAI,
        description: 'Most capable model with vision',
        isDefault: true,
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: AIProvider.OPENAI,
        description: 'Fast and cost-effective',
      },
    ],
  },
  [AIProvider.DEEPSEEK]: {
    id: AIProvider.DEEPSEEK,
    name: 'DeepSeek',
    description: 'DeepSeek AI models',
    requiresApiKey: true,
    models: [
      {
        id: 'deepseek-chat',
        name: 'DeepSeek Chat',
        provider: AIProvider.DEEPSEEK,
        description: 'General-purpose chat model',
      },
      {
        id: 'deepseek-reasoner',
        name: 'DeepSeek Reasoner',
        provider: AIProvider.DEEPSEEK,
        description: 'Advanced reasoning capabilities',
        isReasoning: true,
      },
    ],
  },
  [AIProvider.OLLAMA]: {
    id: AIProvider.OLLAMA,
    name: 'Ollama (Local)',
    description: 'Run models locally with Ollama',
    requiresApiKey: false,
    baseUrl: 'http://localhost:11434',
    models: [], // Populated dynamically from /api/tags
  },
};

// Get all static models as a flat array (excludes Ollama which is dynamic)
export function getAllStaticModels(): AIModel[] {
  return Object.values(PROVIDER_CONFIGS)
    .filter(config => config.id !== AIProvider.OLLAMA)
    .flatMap(config => config.models);
}

// Get models by provider
export function getModelsByProvider(provider: AIProvider): AIModel[] {
  return PROVIDER_CONFIGS[provider]?.models || [];
}

// Get a specific model by ID
export function getModelById(modelId: string): AIModel | undefined {
  return getAllStaticModels().find(model => model.id === modelId);
}

// Get provider config by model ID
export function getProviderByModelId(modelId: string): ProviderConfig | undefined {
  const model = getModelById(modelId);
  if (!model) return undefined;
  return PROVIDER_CONFIGS[model.provider];
}

// Default model configuration (Groq Llama 3.3 70B)
export const DEFAULT_MODEL: AIModel = PROVIDER_CONFIGS[AIProvider.GROQ].models[0];

// Fallback model (Groq Llama 3.1 8B)
export const FALLBACK_MODEL: AIModel = PROVIDER_CONFIGS[AIProvider.GROQ].models[1];

// Storage key for persisting selection
export const MODEL_STORAGE_KEY = 'aegis-ai-selected-model';
export const PROVIDER_STORAGE_KEY = 'aegis-ai-selected-provider';

// Get stored model or default
export function getStoredSelection(): { provider: AIProvider; modelId: string } {
  if (typeof window === 'undefined') {
    return { provider: DEFAULT_MODEL.provider, modelId: DEFAULT_MODEL.id };
  }

  try {
    const storedProvider = localStorage.getItem(PROVIDER_STORAGE_KEY);
    const storedModel = localStorage.getItem(MODEL_STORAGE_KEY);

    if (storedProvider && storedModel) {
      return {
        provider: storedProvider as AIProvider,
        modelId: storedModel,
      };
    }
  } catch {
    // localStorage not available
  }

  return { provider: DEFAULT_MODEL.provider, modelId: DEFAULT_MODEL.id };
}

// Save selected model
export function saveSelection(provider: AIProvider, modelId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROVIDER_STORAGE_KEY, provider);
    localStorage.setItem(MODEL_STORAGE_KEY, modelId);
  } catch {
    // localStorage not available
  }
}

// Provider display information
export const PROVIDER_ICONS: Record<AIProvider, string> = {
  [AIProvider.GROQ]: '⚡',
  [AIProvider.OPENAI]: '🤖',
  [AIProvider.DEEPSEEK]: '🔍',
  [AIProvider.OLLAMA]: '🏠',
};

// Provider colors for badges
export const PROVIDER_COLORS: Record<AIProvider, string> = {
  [AIProvider.GROQ]: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  [AIProvider.OPENAI]: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  [AIProvider.DEEPSEEK]: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  [AIProvider.OLLAMA]: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};
