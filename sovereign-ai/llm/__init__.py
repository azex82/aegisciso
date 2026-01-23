# LLM module - Provider abstraction layer
# Supports Ollama (local) and Groq (hybrid mode)

from .base_client import (
    BaseLLMClient,
    LLMMessage,
    LLMRole,
    LLMResponse,
    EmbeddingResponse,
    SYSTEM_PROMPTS
)
from .ollama_client import OllamaClient

import structlog

logger = structlog.get_logger()

# Cached client instance
_llm_client = None


def get_llm_client() -> BaseLLMClient:
    """
    Factory function to get the configured LLM client

    Returns the appropriate client based on LLM_PROVIDER setting:
    - "ollama": Local Ollama server (default, full sovereignty)
    - "groq": Groq API (hybrid mode, requires HYBRID_MODE=true)
    - "openai": OpenAI API (hybrid mode, requires HYBRID_MODE=true)
    - "deepseek": DeepSeek API (hybrid mode, requires HYBRID_MODE=true)

    Returns:
        BaseLLMClient: The configured LLM client instance
    """
    global _llm_client

    if _llm_client is not None:
        return _llm_client

    from config.settings import get_settings
    settings = get_settings()

    provider = settings.llm.provider.lower()

    # Providers that require hybrid mode
    hybrid_providers = ["groq", "openai", "deepseek"]

    if provider in hybrid_providers:
        # Verify hybrid mode is enabled for external API
        if not settings.hybrid_mode:
            raise ValueError(
                f"{provider.capitalize()} provider requires HYBRID_MODE=true. "
                "This enables external API calls for LLM inference while "
                "keeping embeddings and data processing local."
            )

    if provider == "groq":
        from .groq_client import GroqClient
        _llm_client = GroqClient()
        logger.info(
            "llm_client_initialized",
            provider="groq",
            model=settings.llm.groq_model,
            hybrid_mode=True
        )

    elif provider == "openai":
        from .openai_client import OpenAIClient
        _llm_client = OpenAIClient()
        logger.info(
            "llm_client_initialized",
            provider="openai",
            model=settings.llm.openai_model,
            hybrid_mode=True
        )

    elif provider == "deepseek":
        from .deepseek_client import DeepSeekClient
        _llm_client = DeepSeekClient()
        logger.info(
            "llm_client_initialized",
            provider="deepseek",
            model=settings.llm.deepseek_model,
            hybrid_mode=True
        )

    elif provider == "ollama":
        _llm_client = OllamaClient()
        logger.info(
            "llm_client_initialized",
            provider="ollama",
            model=settings.llm.ollama_model,
            hybrid_mode=False
        )

    else:
        raise ValueError(
            f"Unknown LLM provider: {provider}. "
            f"Supported providers: ollama, groq, openai, deepseek"
        )

    return _llm_client


def reset_llm_client():
    """Reset the cached LLM client (useful for testing)"""
    global _llm_client
    _llm_client = None


# Legacy: maintain backward compatibility with direct ollama_client import
# This will be initialized lazily when first accessed
def _get_ollama_client():
    """Get Ollama client for backward compatibility"""
    from .ollama_client import ollama_client
    return ollama_client


# For backward compatibility - modules importing ollama_client directly
# will get the singleton from ollama_client.py
from .ollama_client import ollama_client

__all__ = [
    # Base classes
    "BaseLLMClient",
    "LLMMessage",
    "LLMRole",
    "LLMResponse",
    "EmbeddingResponse",
    "SYSTEM_PROMPTS",
    # Clients
    "OllamaClient",
    "get_llm_client",
    "reset_llm_client",
    # Legacy
    "ollama_client",
]
