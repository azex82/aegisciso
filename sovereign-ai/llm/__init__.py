# LLM module - Private Ollama integration
from .ollama_client import OllamaClient, ollama_client, LLMMessage, LLMRole, LLMResponse, EmbeddingResponse

__all__ = ["OllamaClient", "ollama_client", "LLMMessage", "LLMRole", "LLMResponse", "EmbeddingResponse"]
