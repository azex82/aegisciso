"""
Sovereign AI - DeepSeek LLM Client
Uses DeepSeek API (OpenAI-compatible) for LLM inference with local embeddings
For HYBRID MODE deployment - allows external API for LLM, local for embeddings
"""

import asyncio
import time
from typing import AsyncGenerator, Optional, List
from datetime import datetime

import structlog
from openai import AsyncOpenAI

from .base_client import (
    BaseLLMClient, LLMMessage, LLMRole, LLMResponse, EmbeddingResponse, SYSTEM_PROMPTS
)
from config.settings import get_settings

logger = structlog.get_logger()

# DeepSeek API base URL
DEEPSEEK_API_BASE = "https://api.deepseek.com"


class DeepSeekClient(BaseLLMClient):
    """
    DeepSeek LLM Client for hybrid deployment

    Uses DeepSeek API (OpenAI-compatible) for LLM inference (external)
    Uses local sentence-transformers for embeddings (privacy preserved)
    """

    def __init__(self):
        self.settings = get_settings()

        # Get DeepSeek configuration
        self.api_key = self.settings.llm.deepseek_api_key
        self.model = self.settings.llm.deepseek_model

        if not self.api_key:
            raise ValueError(
                "DEEPSEEK_API_KEY is required for DeepSeek provider. "
                "Set LLM_DEEPSEEK_API_KEY environment variable."
            )

        # Initialize DeepSeek client (using OpenAI SDK with custom base URL)
        self.client = AsyncOpenAI(
            api_key=self.api_key,
            base_url=DEEPSEEK_API_BASE
        )

        # Initialize local embedding model (lazy load)
        self._embedding_model = None
        self._embedding_model_name = self.settings.rag.embedding_model

        # Log hybrid mode warning
        if self.settings.hybrid_mode:
            logger.warning(
                "hybrid_mode_enabled",
                provider="deepseek",
                message="LLM inference uses external DeepSeek API. Embeddings remain local."
            )

        logger.info(
            "deepseek_client_initialized",
            model=self.model,
            embedding_model=self._embedding_model_name
        )

    def _get_embedding_model(self):
        """Lazy load the embedding model"""
        if self._embedding_model is None:
            from sentence_transformers import SentenceTransformer
            logger.info("loading_local_embedding_model", model=self._embedding_model_name)
            self._embedding_model = SentenceTransformer(self._embedding_model_name)
        return self._embedding_model

    async def health_check(self) -> bool:
        """Check if DeepSeek API is accessible"""
        try:
            # Simple API call to verify connectivity
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "ping"}],
                max_tokens=5
            )
            return response is not None
        except Exception as e:
            logger.error("deepseek_health_check_failed", error=str(e))
            return False

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        user_id: Optional[str] = None,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        stream: bool = False
    ) -> LLMResponse:
        """Generate completion using DeepSeek API"""
        start_time = time.time()

        # DLP scanning
        from security.dlp import dlp_engine

        if self.settings.dlp.dlp_scan_inputs:
            sanitized_prompt, was_blocked = dlp_engine.scan_prompt(
                prompt, user_id or "anonymous"
            )
            if was_blocked and self.settings.dlp.block_on_detection:
                raise ValueError("Prompt blocked by DLP policy")
            prompt = sanitized_prompt

        # Build messages
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            response = await self.client.chat.completions.create(
                model=model or self.model,
                messages=messages,
                temperature=temperature or self.settings.llm.temperature,
                max_tokens=max_tokens or self.settings.llm.max_tokens,
                top_p=self.settings.llm.top_p,
            )

            content = response.choices[0].message.content or ""
            original_content = None
            filtered = False

            # DLP scan output
            if self.settings.dlp.dlp_scan_outputs:
                content, had_findings = dlp_engine.scan_output(
                    content, user_id or "anonymous"
                )
                if had_findings:
                    filtered = True
                    original_content = response.choices[0].message.content

            generation_time = (time.time() - start_time) * 1000

            logger.info(
                "deepseek_generation_complete",
                model=model or self.model,
                user_id=user_id,
                prompt_length=len(prompt),
                response_length=len(content),
                generation_time_ms=generation_time,
                filtered=filtered
            )

            return LLMResponse(
                content=content,
                model=response.model,
                tokens_used=response.usage.total_tokens if response.usage else 0,
                generation_time_ms=generation_time,
                timestamp=datetime.utcnow(),
                filtered=filtered,
                original_content=original_content if filtered else None
            )

        except Exception as e:
            logger.error("deepseek_generation_error", error=str(e))
            raise

    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        user_id: Optional[str] = None,
        model: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """Stream generation from DeepSeek"""
        # DLP scan input
        from security.dlp import dlp_engine

        if self.settings.dlp.dlp_scan_inputs:
            sanitized_prompt, _ = dlp_engine.scan_prompt(
                prompt, user_id or "anonymous"
            )
            prompt = sanitized_prompt

        # Build messages
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        try:
            stream = await self.client.chat.completions.create(
                model=model or self.model,
                messages=messages,
                temperature=self.settings.llm.temperature,
                max_tokens=self.settings.llm.max_tokens,
                stream=True
            )

            async for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content

        except Exception as e:
            logger.error("deepseek_stream_error", error=str(e))
            raise

    async def chat(
        self,
        messages: List[LLMMessage],
        user_id: Optional[str] = None,
        model: Optional[str] = None
    ) -> LLMResponse:
        """Multi-turn chat completion using DeepSeek"""
        start_time = time.time()

        from security.dlp import dlp_engine

        # DLP scan user messages
        scanned_messages = []
        for msg in messages:
            if msg.role == LLMRole.USER and self.settings.dlp.dlp_scan_inputs:
                sanitized, _ = dlp_engine.scan_prompt(
                    msg.content, user_id or "anonymous"
                )
                scanned_messages.append(LLMMessage(role=msg.role, content=sanitized))
            else:
                scanned_messages.append(msg)

        # Convert to OpenAI format (DeepSeek is compatible)
        deepseek_messages = [
            {"role": m.role.value, "content": m.content}
            for m in scanned_messages
        ]

        try:
            response = await self.client.chat.completions.create(
                model=model or self.model,
                messages=deepseek_messages,
                temperature=self.settings.llm.temperature,
                max_tokens=self.settings.llm.max_tokens,
                top_p=self.settings.llm.top_p,
            )

            content = response.choices[0].message.content or ""
            filtered = False

            # DLP scan output
            if self.settings.dlp.dlp_scan_outputs:
                content, had_findings = dlp_engine.scan_output(
                    content, user_id or "anonymous"
                )
                filtered = had_findings

            generation_time = (time.time() - start_time) * 1000

            return LLMResponse(
                content=content,
                model=response.model,
                tokens_used=response.usage.total_tokens if response.usage else 0,
                generation_time_ms=generation_time,
                timestamp=datetime.utcnow(),
                filtered=filtered
            )

        except Exception as e:
            logger.error("deepseek_chat_error", error=str(e))
            raise

    async def get_embeddings(
        self,
        text: str,
        model: Optional[str] = None
    ) -> EmbeddingResponse:
        """
        Generate embeddings using LOCAL sentence-transformers

        Note: We use local models for embeddings to preserve data sovereignty
        """
        start_time = time.time()

        try:
            # Run embedding in thread pool to avoid blocking
            embedding_model = self._get_embedding_model()
            loop = asyncio.get_event_loop()
            embedding = await loop.run_in_executor(
                None,
                lambda: embedding_model.encode(text).tolist()
            )

            processing_time = (time.time() - start_time) * 1000

            return EmbeddingResponse(
                embedding=embedding,
                model=model or self._embedding_model_name,
                dimension=len(embedding),
                processing_time_ms=processing_time
            )

        except Exception as e:
            logger.error("local_embedding_error", error=str(e))
            raise

    async def close(self):
        """Clean up resources"""
        self._embedding_model = None
        logger.info("deepseek_client_closed")

    def get_provider_name(self) -> str:
        return "DeepSeek"
