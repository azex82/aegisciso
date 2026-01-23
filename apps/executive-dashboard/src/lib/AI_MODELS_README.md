# AI Model Configuration Guide

This guide explains how to configure the AI Security Advisor chatbot with different providers.

## Supported Providers

| Provider | Models | API Key Required | Status |
|----------|--------|-----------------|--------|
| **OpenAI** | gpt-4.1 (default), gpt-4.1-mini | Yes | Cloud API |
| **xAI (Grok)** | grok-3 | Yes | Cloud API |
| **DeepSeek** | deepseek-chat, deepseek-reasoner | Yes | Cloud API |
| **Ollama** | Dynamic (from /api/tags) | No | Local |

## Quick Setup

### 1. OpenAI (Default Provider)

```bash
# Add to .env.local
OPENAI_API_KEY="sk-..."
```

- Get API key: https://platform.openai.com/api-keys
- Models: `gpt-4.1` (default), `gpt-4.1-mini` (fallback)
- This is the recommended provider for best quality responses

### 2. xAI (Grok)

```bash
# Add to .env.local
XAI_API_KEY="xai-..."
```

- Get API key: https://console.x.ai
- Model: `grok-3`
- Sign in with your X (Twitter) account

### 3. DeepSeek

```bash
# Add to .env.local
DEEPSEEK_API_KEY="sk-..."
```

- Get API key: https://platform.deepseek.com
- Models: `deepseek-chat` (general), `deepseek-reasoner` (reasoning)
- OpenAI-compatible API format

### 4. Ollama (Local)

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama
ollama serve

# Pull a model
ollama pull llama3.1
ollama pull mistral:7b

# Optional: Set custom URL in .env.local
OLLAMA_BASE_URL="http://localhost:11434"
```

- No API key needed
- Models are fetched dynamically from `/api/tags`
- Use the "Custom model name" field for any Ollama model

## Environment Variables

```bash
# .env.local

# OpenAI (required for default/fallback)
OPENAI_API_KEY="sk-..."

# xAI (Grok) - optional
XAI_API_KEY="xai-..."

# DeepSeek - optional
DEEPSEEK_API_KEY="sk-..."

# Ollama - optional, defaults to localhost:11434
OLLAMA_BASE_URL="http://localhost:11434"
```

## API Health Check

Check which providers are configured:

```bash
curl http://localhost:3001/api/ai/chat
```

Response:
```json
{
  "status": "ok",
  "providers": {
    "openai": { "available": true },
    "xai": { "available": false, "error": "API key not configured" },
    "deepseek": { "available": true },
    "ollama": { "available": true }
  }
}
```

## Fallback Behavior

If a provider fails, the system will automatically fallback to OpenAI `gpt-4.1-mini` (if configured).

## Troubleshooting

### "API key not configured"
- Check that the environment variable is set in `.env.local`
- Restart the dev server after adding new env vars

### "Insufficient credits"
- Add credits to your provider account (OpenAI, DeepSeek, etc.)

### "Ollama is not running or not reachable"
- Run `ollama serve` in a terminal
- Check if port 11434 is available

### "Model not found" (Ollama)
- Run `ollama pull <model-name>` to download the model
- Check available models with `ollama list`

## Model Recommendations

| Use Case | Recommended |
|----------|------------|
| **Best quality** | OpenAI gpt-4.1 |
| **Cost-effective** | OpenAI gpt-4.1-mini |
| **Reasoning tasks** | DeepSeek deepseek-reasoner |
| **Privacy (local)** | Ollama with llama3.1 or mistral |
| **Alternative cloud** | xAI grok-3 |

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   Frontend      │     │   Backend       │
│   ModelSelector │────▶│   /api/ai/chat  │
│   (Dropdown)    │     │   (Route)       │
└─────────────────┘     └────────┬────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              ┌─────────┐  ┌─────────┐  ┌─────────┐
              │ OpenAI  │  │ DeepSeek│  │ Ollama  │
              │   API   │  │   API   │  │ (Local) │
              └─────────┘  └─────────┘  └─────────┘
```

## Files

- `src/lib/ai-models.ts` - Provider/model configuration
- `src/components/ai/model-selector.tsx` - Dropdown UI component
- `src/components/ai/ai-chat.tsx` - Chat interface
- `src/app/api/ai/chat/route.ts` - Backend API route
