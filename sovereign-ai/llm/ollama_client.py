"""
Sovereign AI - Private LLM Client
Interfaces with Ollama for fully local LLM inference
NO DATA LEAVES THE SYSTEM
"""

import asyncio
from typing import AsyncGenerator, Optional, List, Dict, Any
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
import json

import httpx
import structlog

from config.settings import get_settings
from security.dlp import dlp_engine

logger = structlog.get_logger()
settings = get_settings()


class LLMRole(str, Enum):
    """Message roles for chat"""
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


@dataclass
class LLMMessage:
    """Chat message structure"""
    role: LLMRole
    content: str


@dataclass
class LLMResponse:
    """LLM response structure"""
    content: str
    model: str
    tokens_used: int
    generation_time_ms: float
    timestamp: datetime
    filtered: bool = False
    original_content: Optional[str] = None


@dataclass
class EmbeddingResponse:
    """Embedding response structure"""
    embedding: List[float]
    model: str
    dimension: int
    processing_time_ms: float


class OllamaClient:
    """
    Private LLM Client using Ollama
    Ensures all inference happens locally with no external API calls
    """

    def __init__(self):
        self.settings = get_settings()
        self.base_url = self.settings.llm.ollama_host

        # Verify no external endpoints
        self._validate_local_endpoint()

        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=httpx.Timeout(
                connect=10.0,
                read=self.settings.llm.inference_timeout_seconds,
                write=10.0,
                pool=5.0
            )
        )

    def _validate_local_endpoint(self):
        """Ensure Ollama endpoint is local - CRITICAL for sovereignty"""
        allowed_hosts = [
            "localhost",
            "127.0.0.1",
            "0.0.0.0",
            "ollama",  # Docker service name
            "host.docker.internal"
        ]

        from urllib.parse import urlparse
        parsed = urlparse(self.base_url)

        if parsed.hostname not in allowed_hosts:
            raise ValueError(
                f"SOVEREIGNTY VIOLATION: LLM endpoint '{parsed.hostname}' is not local. "
                f"Only local endpoints are allowed: {allowed_hosts}"
            )

        # Block known external LLM APIs
        blocked_domains = [
            "api.openai.com",
            "api.anthropic.com",
            "api.cohere.ai",
            "api.ai21.com",
            "generativelanguage.googleapis.com",
            "bedrock-runtime",
        ]

        for domain in blocked_domains:
            if domain in self.base_url.lower():
                raise ValueError(
                    f"SOVEREIGNTY VIOLATION: External LLM API detected: {domain}. "
                    "This system must use local LLM inference only."
                )

        logger.info("llm_endpoint_validated", endpoint=self.base_url, status="local")

    async def health_check(self) -> bool:
        """Check if Ollama server is running"""
        try:
            response = await self.client.get("/api/tags")
            return response.status_code == 200
        except Exception as e:
            logger.error("ollama_health_check_failed", error=str(e))
            return False

    async def list_models(self) -> List[str]:
        """List available models"""
        try:
            response = await self.client.get("/api/tags")
            data = response.json()
            return [model["name"] for model in data.get("models", [])]
        except Exception as e:
            logger.error("list_models_failed", error=str(e))
            return []

    async def pull_model(self, model_name: str) -> bool:
        """Pull a model if not available"""
        try:
            async with self.client.stream(
                "POST",
                "/api/pull",
                json={"name": model_name}
            ) as response:
                async for line in response.aiter_lines():
                    if line:
                        data = json.loads(line)
                        logger.info(
                            "model_pull_progress",
                            model=model_name,
                            status=data.get("status")
                        )
            return True
        except Exception as e:
            logger.error("model_pull_failed", model=model_name, error=str(e))
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
        """
        Generate completion from private LLM

        Args:
            prompt: User prompt (will be DLP scanned)
            system_prompt: System context
            user_id: User ID for audit
            model: Model to use (defaults to configured model)
            temperature: Override temperature
            max_tokens: Override max tokens
            stream: Enable streaming response

        Returns:
            LLMResponse with generated content
        """
        import time
        start_time = time.time()

        # DLP scan input prompt
        if self.settings.dlp.dlp_scan_inputs:
            sanitized_prompt, was_blocked = dlp_engine.scan_prompt(
                prompt, user_id or "anonymous"
            )
            if was_blocked and self.settings.dlp.block_on_detection:
                raise ValueError("Prompt blocked by DLP policy")
            prompt = sanitized_prompt

        # Build request
        request_body = {
            "model": model or self.settings.llm.ollama_model,
            "prompt": prompt,
            "stream": False,  # We'll handle streaming separately
            "options": {
                "temperature": temperature or self.settings.llm.temperature,
                "num_predict": max_tokens or self.settings.llm.max_tokens,
                "top_p": self.settings.llm.top_p,
                "repeat_penalty": self.settings.llm.repeat_penalty,
            }
        }

        if system_prompt:
            request_body["system"] = system_prompt

        # Make request
        try:
            response = await self.client.post(
                "/api/generate",
                json=request_body
            )
            response.raise_for_status()
            data = response.json()

            content = data.get("response", "")
            original_content = None
            filtered = False

            # DLP scan output
            if self.settings.dlp.dlp_scan_outputs:
                content, had_findings = dlp_engine.scan_output(
                    content, user_id or "anonymous"
                )
                if had_findings:
                    filtered = True
                    original_content = data.get("response", "")

            generation_time = (time.time() - start_time) * 1000

            logger.info(
                "llm_generation_complete",
                model=request_body["model"],
                user_id=user_id,
                prompt_length=len(prompt),
                response_length=len(content),
                generation_time_ms=generation_time,
                filtered=filtered
            )

            return LLMResponse(
                content=content,
                model=data.get("model", request_body["model"]),
                tokens_used=data.get("eval_count", 0),
                generation_time_ms=generation_time,
                timestamp=datetime.utcnow(),
                filtered=filtered,
                original_content=original_content if filtered else None
            )

        except httpx.HTTPStatusError as e:
            logger.error(
                "llm_generation_failed",
                status_code=e.response.status_code,
                error=str(e)
            )
            raise
        except Exception as e:
            logger.error("llm_generation_error", error=str(e))
            raise

    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        user_id: Optional[str] = None,
        model: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """
        Stream generation from private LLM

        Yields:
            Chunks of generated text
        """
        # DLP scan input
        if self.settings.dlp.dlp_scan_inputs:
            sanitized_prompt, _ = dlp_engine.scan_prompt(
                prompt, user_id or "anonymous"
            )
            prompt = sanitized_prompt

        request_body = {
            "model": model or self.settings.llm.ollama_model,
            "prompt": prompt,
            "stream": True,
            "options": {
                "temperature": self.settings.llm.temperature,
                "num_predict": self.settings.llm.max_tokens,
            }
        }

        if system_prompt:
            request_body["system"] = system_prompt

        try:
            async with self.client.stream(
                "POST",
                "/api/generate",
                json=request_body
            ) as response:
                async for line in response.aiter_lines():
                    if line:
                        data = json.loads(line)
                        chunk = data.get("response", "")
                        if chunk:
                            yield chunk

        except Exception as e:
            logger.error("llm_stream_error", error=str(e))
            raise

    async def chat(
        self,
        messages: List[LLMMessage],
        user_id: Optional[str] = None,
        model: Optional[str] = None
    ) -> LLMResponse:
        """
        Multi-turn chat completion

        Args:
            messages: List of chat messages
            user_id: User ID for audit
            model: Model to use

        Returns:
            LLMResponse with assistant reply
        """
        import time
        start_time = time.time()

        # DLP scan all user messages
        scanned_messages = []
        for msg in messages:
            if msg.role == LLMRole.USER and self.settings.dlp.dlp_scan_inputs:
                sanitized, _ = dlp_engine.scan_prompt(
                    msg.content, user_id or "anonymous"
                )
                scanned_messages.append(LLMMessage(role=msg.role, content=sanitized))
            else:
                scanned_messages.append(msg)

        request_body = {
            "model": model or self.settings.llm.ollama_model,
            "messages": [
                {"role": m.role.value, "content": m.content}
                for m in scanned_messages
            ],
            "stream": False,
            "options": {
                "temperature": self.settings.llm.temperature,
                "num_predict": self.settings.llm.max_tokens,
            }
        }

        try:
            response = await self.client.post(
                "/api/chat",
                json=request_body
            )
            response.raise_for_status()
            data = response.json()

            content = data.get("message", {}).get("content", "")
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
                model=data.get("model", request_body["model"]),
                tokens_used=data.get("eval_count", 0),
                generation_time_ms=generation_time,
                timestamp=datetime.utcnow(),
                filtered=filtered
            )

        except Exception as e:
            logger.error("llm_chat_error", error=str(e))
            raise

    async def get_embeddings(
        self,
        text: str,
        model: Optional[str] = None
    ) -> EmbeddingResponse:
        """
        Generate embeddings for RAG

        Args:
            text: Text to embed
            model: Embedding model to use

        Returns:
            EmbeddingResponse with vector
        """
        import time
        start_time = time.time()

        request_body = {
            "model": model or self.settings.llm.ollama_embedding_model,
            "prompt": text
        }

        try:
            response = await self.client.post(
                "/api/embeddings",
                json=request_body
            )
            response.raise_for_status()
            data = response.json()

            embedding = data.get("embedding", [])
            processing_time = (time.time() - start_time) * 1000

            return EmbeddingResponse(
                embedding=embedding,
                model=request_body["model"],
                dimension=len(embedding),
                processing_time_ms=processing_time
            )

        except Exception as e:
            logger.error("embedding_generation_error", error=str(e))
            raise

    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()


# Cybersecurity-specific system prompts
SYSTEM_PROMPTS = {
    "general": """You are a highly intelligent AI Cybersecurity Director and CISO advisor for SHARP, an enterprise cybersecurity governance platform. You possess deep expertise across all cybersecurity domains and provide strategic, analytical, and comprehensive guidance.

## Expertise Areas:
- Compliance Frameworks: NCA ECC, SAMA CSF, NIST CSF 2.0, ISO 27001/27002:2022, SOC 2, CIS Controls v8, PCI DSS 4.0, PDPL
- Risk Management: Enterprise risk management, FAIR methodology, threat modeling (STRIDE, PASTA), risk treatment strategies
- Security Architecture: Zero Trust, defense-in-depth, cloud security, identity management, network segmentation
- Security Operations: SOC-CMM, MITRE ATT&CK, incident response, threat intelligence, SIEM/SOAR
- Governance: Security strategy, board reporting, metrics/KPIs, vendor risk management

## Response Approach:
1. Analyze questions from multiple perspectives: technical, business, compliance, and risk
2. Provide structured, comprehensive responses with clear sections
3. Include specific control references, metrics, and industry benchmarks
4. Give actionable recommendations with clear next steps
5. Consider Saudi Arabia regulatory context (NCA, SAMA, PDPL) as primary
6. Anticipate follow-up questions and address them proactively

## Organization Context:
- Industry: Enterprise/Government in Saudi Arabia
- Primary frameworks: NCA ECC, SAMA CSF, ISO 27001
- Security maturity: Developing toward Level 3-4

Provide expert-level guidance as a seasoned CISO with 15+ years of experience.""",

    "policy_mapper": """You are an expert cybersecurity policy analyst for AegisCISO.
Your task is to analyze security policies and map them to compliance framework controls.
You have deep knowledge of:
- NIST Cybersecurity Framework (CSF)
- ISO 27001/27002
- NCA Essential Cybersecurity Controls (ECC)
- SAMA Cyber Security Framework
- SOC 2 Trust Criteria
- CIS Controls

When analyzing policies:
1. Identify the security domain (access control, incident response, etc.)
2. Extract key requirements and controls
3. Map to relevant framework controls with confidence scores
4. Identify any gaps or missing coverage

Always provide structured JSON output with mappings and confidence levels.""",

    "risk_analyst": """You are a senior cybersecurity risk analyst for AegisCISO.
Your task is to analyze and assess security risks using industry-standard methodologies.
You are expert in:
- FAIR (Factor Analysis of Information Risk)
- NIST Risk Management Framework
- ISO 27005 Risk Assessment
- Threat modeling (STRIDE, DREAD, PASTA)
- Attack tree analysis

When analyzing risks:
1. Identify threat actors and their capabilities
2. Assess likelihood based on threat landscape
3. Evaluate impact across CIA triad
4. Calculate risk scores using quantitative methods
5. Recommend mitigating controls

Provide structured risk assessments with clear justification.""",

    "soc_cmm_analyst": """You are a SOC-CMM (Security Operations Center Capability Maturity Model) expert.
Your task is to analyze evidence and assess SOC maturity levels.
You understand:
- SOC-CMM domains: Business, People, Process, Technology, Services
- Maturity levels: Initial, Managed, Defined, Quantitatively Managed, Optimizing
- Key performance indicators for SOC operations

When analyzing evidence:
1. Categorize evidence by SOC-CMM domain
2. Assess current maturity level with justification
3. Identify gaps to next maturity level
4. Recommend improvement actions
5. Prioritize based on impact and effort

Provide structured maturity assessments.""",

    "executive_reporter": """You are an executive communications expert for cybersecurity.
Your task is to synthesize technical security information into executive-level reports.
You excel at:
- Translating technical findings into business impact
- Quantifying security posture and risk
- Creating clear visualizations and metrics
- Providing actionable recommendations
- Aligning security to business objectives

When creating reports:
1. Lead with key findings and recommendations
2. Use business language, not technical jargon
3. Quantify risks in financial/operational terms
4. Provide clear action items with owners
5. Include trend analysis and benchmarks

Create concise, impactful executive summaries.""",

    "threat_modeler": """You are an advanced threat modeling expert.
Your task is to analyze systems and identify potential attack paths.
You are expert in:
- MITRE ATT&CK Framework
- Kill Chain methodology
- STRIDE threat modeling
- Attack surface analysis
- Adversary simulation

When modeling threats:
1. Map system components and data flows
2. Identify attack surfaces and entry points
3. Model potential attack paths
4. Assess exploitability and impact
5. Prioritize threats by risk

Provide detailed threat models with attack paths and mitigations.""",
}


# Singleton instance
ollama_client = OllamaClient()
