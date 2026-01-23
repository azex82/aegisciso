'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check, Cpu, Brain, AlertCircle, Loader2, Server } from 'lucide-react';
import {
  AIProvider,
  AIModel,
  PROVIDER_CONFIGS,
  PROVIDER_ICONS,
  DEFAULT_MODEL,
  getStoredSelection,
  saveSelection,
} from '@/lib/ai-models';

interface OllamaModel {
  name: string;
  model: string;
  size: number;
  details?: {
    parameter_size?: string;
  };
}

interface ModelSelectorProps {
  onModelChange: (provider: AIProvider, modelId: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function ModelSelector({ onModelChange, disabled = false, compact = false }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>(DEFAULT_MODEL.provider);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL.id);
  const [customModel, setCustomModel] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [ollamaModels, setOllamaModels] = useState<AIModel[]>([]);
  const [ollamaLoading, setOllamaLoading] = useState(false);
  const [ollamaError, setOllamaError] = useState<string | null>(null);
  const [providerHealth, setProviderHealth] = useState<Record<string, boolean>>({});
  const [expandedProvider, setExpandedProvider] = useState<AIProvider | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Store callback ref to avoid stale closures
  const onModelChangeRef = useRef(onModelChange);
  onModelChangeRef.current = onModelChange;

  // Load stored selection on mount
  useEffect(() => {
    const stored = getStoredSelection();
    setSelectedProvider(stored.provider);
    setSelectedModel(stored.modelId);

    // Check if it's a custom Ollama model
    if (stored.provider === AIProvider.OLLAMA) {
      setCustomModel(stored.modelId);
    }

    onModelChangeRef.current(stored.provider, stored.modelId);
  }, []);

  // Fetch provider health status
  useEffect(() => {
    async function checkHealth() {
      try {
        const response = await fetch('/api/ai/chat');
        if (response.ok) {
          const data = await response.json();
          const health: Record<string, boolean> = {};
          for (const [key, value] of Object.entries(data.providers || {})) {
            health[key] = (value as any).available;
          }
          setProviderHealth(health);
        }
      } catch {
        // Ignore errors
      }
    }
    checkHealth();
  }, []);

  // Fetch Ollama models dynamically via backend proxy
  useEffect(() => {
    async function fetchOllamaModels() {
      setOllamaLoading(true);
      setOllamaError(null);

      try {
        // Use backend proxy to fetch Ollama models (Ollama runs on server, not client)
        const response = await fetch('/api/ai/ollama', {
          signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch');
        }

        const data = await response.json();
        const models: AIModel[] = (data.models || []).map((m: OllamaModel) => ({
          id: m.name,
          name: m.name,
          provider: AIProvider.OLLAMA,
          description: m.details?.parameter_size ? `${m.details.parameter_size} parameters` : 'Local model',
        }));

        setOllamaModels(models);
      } catch {
        setOllamaError('Ollama is not running or not reachable');
        setOllamaModels([]);
      } finally {
        setOllamaLoading(false);
      }
    }

    fetchOllamaModels();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (provider: AIProvider, modelId: string) => {
    setSelectedProvider(provider);
    setSelectedModel(modelId);
    setShowCustomInput(false);
    saveSelection(provider, modelId);
    setIsOpen(false);
    onModelChange(provider, modelId);
  };

  const handleCustomModelSubmit = () => {
    if (customModel.trim()) {
      const modelId = customModel.trim();
      setSelectedProvider(AIProvider.OLLAMA);
      setSelectedModel(modelId);
      saveSelection(AIProvider.OLLAMA, modelId);
      setIsOpen(false);
      onModelChange(AIProvider.OLLAMA, modelId);
    }
  };

  const getSelectedModelName = () => {
    if (selectedProvider === AIProvider.OLLAMA) {
      const ollamaModel = ollamaModels.find(m => m.id === selectedModel);
      if (ollamaModel) return ollamaModel.name;
      return selectedModel; // Custom model
    }

    const providerConfig = PROVIDER_CONFIGS[selectedProvider];
    const model = providerConfig?.models.find(m => m.id === selectedModel);
    return model?.name || selectedModel;
  };

  const getProviderDisplayName = () => {
    return PROVIDER_CONFIGS[selectedProvider]?.name || selectedProvider;
  };

  // Combine static models with dynamic Ollama models
  const getModelsForProvider = (provider: AIProvider): AIModel[] => {
    if (provider === AIProvider.OLLAMA) {
      return ollamaModels;
    }
    return PROVIDER_CONFIGS[provider]?.models || [];
  };

  const isProviderAvailable = (provider: AIProvider): boolean => {
    if (provider === AIProvider.OLLAMA) {
      return !ollamaError && ollamaModels.length > 0;
    }
    return providerHealth[provider] !== false;
  };

  const toggleProvider = (provider: AIProvider) => {
    setExpandedProvider(expandedProvider === provider ? null : provider);
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center gap-2 rounded-lg border bg-background transition-all
          ${compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted hover:border-primary/30 cursor-pointer'}
          ${isOpen ? 'border-primary ring-1 ring-primary/20' : 'border-input'}
        `}
      >
        <span className="text-base">{PROVIDER_ICONS[selectedProvider]}</span>
        <div className="flex flex-col items-start">
          <span className="font-medium truncate max-w-[120px]">{getSelectedModelName()}</span>
          {!compact && (
            <span className="text-[10px] text-muted-foreground">
              {getProviderDisplayName()}
            </span>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-80 rounded-xl border bg-background shadow-xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
          {/* Header */}
          <div className="px-4 py-3 border-b">
            <h3 className="font-semibold text-sm">AI Model</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Select the model for your conversation</p>
          </div>

          {/* Provider List */}
          <div className="max-h-[400px] overflow-y-auto p-2">
            {Object.values(PROVIDER_CONFIGS).map((provider) => {
              const models = getModelsForProvider(provider.id);
              const isAvailable = isProviderAvailable(provider.id);
              const isOllama = provider.id === AIProvider.OLLAMA;

              return (
                <div key={provider.id} className="mb-1">
                  {/* Provider Header */}
                  <button
                    type="button"
                    onClick={() => toggleProvider(provider.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{PROVIDER_ICONS[provider.id]}</span>
                      <div className="text-left">
                        <span className="font-medium text-sm">{provider.name}</span>
                        <span className="block text-xs text-muted-foreground">{provider.description}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isAvailable && !isOllama && (
                        <span className="text-[10px] text-amber-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Not configured
                        </span>
                      )}
                      {isOllama && ollamaError && (
                        <span className="text-[10px] text-amber-600 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Not running
                        </span>
                      )}
                      {!provider.requiresApiKey && !ollamaError && (
                        <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded">
                          Local
                        </span>
                      )}
                      <ChevronDown
                        className={`h-4 w-4 text-muted-foreground transition-transform ${
                          expandedProvider === provider.id ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </button>

                  {/* Models List (expanded) */}
                  {expandedProvider === provider.id && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {isOllama && ollamaLoading ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading models...
                        </div>
                      ) : models.length === 0 && isOllama ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          {ollamaError || 'No models found. Run: ollama pull <model>'}
                        </div>
                      ) : (
                        models.map((model) => {
                          const isSelected = selectedProvider === provider.id && selectedModel === model.id;

                          return (
                            <button
                              key={model.id}
                              type="button"
                              onClick={() => handleSelect(provider.id, model.id)}
                              disabled={!isAvailable && !isOllama}
                              className={`
                                w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all
                                ${isSelected
                                  ? 'bg-primary/10 border border-primary/30'
                                  : 'hover:bg-muted border border-transparent'
                                }
                                ${!isAvailable && !isOllama ? 'opacity-50 cursor-not-allowed' : ''}
                              `}
                            >
                              <div className="flex items-center gap-2">
                                <Cpu className={`h-4 w-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                <div className="text-left">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-sm ${isSelected ? 'font-medium' : ''}`}>
                                      {model.name}
                                    </span>
                                    {model.isDefault && (
                                      <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                                        Default
                                      </span>
                                    )}
                                    {model.isReasoning && (
                                      <Brain className="h-3 w-3 text-purple-500" />
                                    )}
                                  </div>
                                  <span className="block text-xs text-muted-foreground line-clamp-1">
                                    {model.description}
                                  </span>
                                </div>
                              </div>
                              {isSelected && <Check className="h-4 w-4 text-primary" />}
                            </button>
                          );
                        })
                      )}

                      {/* Custom Model Input for Ollama */}
                      {isOllama && (
                        <div className="px-3 py-2 border-t border-border mt-2">
                          <button
                            type="button"
                            onClick={() => setShowCustomInput(!showCustomInput)}
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <Cpu className="w-3 h-3" />
                            {showCustomInput ? 'Hide custom input' : 'Use custom model name...'}
                          </button>

                          {showCustomInput && (
                            <div className="mt-2 flex gap-2">
                              <input
                                type="text"
                                value={customModel}
                                onChange={(e) => setCustomModel(e.target.value)}
                                placeholder="e.g., llama3:8b"
                                className="flex-1 px-2 py-1 text-sm border border-input rounded bg-background"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleCustomModelSubmit();
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={handleCustomModelSubmit}
                                disabled={!customModel.trim()}
                                className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded disabled:opacity-50"
                              >
                                Use
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t bg-muted/30 rounded-b-xl">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Server className="h-3 w-3" />
                <span>Current: {getSelectedModelName()}</span>
              </div>
              <span className="text-[10px]">{getProviderDisplayName()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact inline model selector for chat header
export function CompactModelSelector({ onModelChange, disabled }: ModelSelectorProps) {
  return <ModelSelector onModelChange={onModelChange} disabled={disabled} compact />;
}
