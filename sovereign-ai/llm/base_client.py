"""
Sovereign AI - Abstract LLM Client Interface
Provides a unified interface for multiple LLM providers
"""

from abc import ABC, abstractmethod
from typing import AsyncGenerator, Optional, List, Dict, Any
from dataclasses import dataclass
from datetime import datetime
from enum import Enum

import structlog

logger = structlog.get_logger()


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


class BaseLLMClient(ABC):
    """
    Abstract base class for LLM clients
    All LLM providers must implement this interface
    """

    @abstractmethod
    async def health_check(self) -> bool:
        """Check if the LLM service is available"""
        pass

    @abstractmethod
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
        Generate completion from LLM

        Args:
            prompt: User prompt
            system_prompt: System context
            user_id: User ID for audit
            model: Model to use (provider-specific)
            temperature: Override temperature
            max_tokens: Override max tokens
            stream: Enable streaming response

        Returns:
            LLMResponse with generated content
        """
        pass

    @abstractmethod
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        user_id: Optional[str] = None,
        model: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """
        Stream generation from LLM

        Yields:
            Chunks of generated text
        """
        pass

    @abstractmethod
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
        pass

    @abstractmethod
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
        pass

    @abstractmethod
    async def close(self):
        """Clean up resources"""
        pass

    def get_provider_name(self) -> str:
        """Return the provider name for logging"""
        return self.__class__.__name__


# Cybersecurity-specific system prompts (shared across providers)
SYSTEM_PROMPTS = {
    "general": """You are a highly intelligent AI Cybersecurity Director and CISO advisor for SHARP, an enterprise cybersecurity governance platform. You possess deep expertise across all cybersecurity domains and provide strategic, analytical, and comprehensive guidance.

## Expertise Areas:
- Compliance Frameworks: NCA ECC, NIST CSF 2.0, ISO 27001/27002:2022, SOC 2, CIS Controls v8, PCI DSS 4.0, GDPR
- Risk Management: Enterprise risk management, FAIR methodology, threat modeling (STRIDE, PASTA), risk treatment strategies
- Security Architecture: Zero Trust, defense-in-depth, cloud security, identity management, network segmentation
- Security Operations: SOC-CMM, MITRE ATT&CK, incident response, threat intelligence, SIEM/SOAR
- Governance: Security strategy, board reporting, metrics/KPIs, vendor risk management

## Response Approach:
1. Analyze questions from multiple perspectives: technical, business, compliance, and risk
2. Provide structured, comprehensive responses with clear sections
3. Include specific control references, metrics, and industry benchmarks
4. Give actionable recommendations with clear next steps
5. Consider applicable regulatory context based on the organization's jurisdiction
6. Anticipate follow-up questions and address them proactively

## Organization Context:
- Industry: Enterprise/Government
- Primary frameworks: NCA ECC, NIST CSF, ISO 27001
- Security maturity: Developing toward Level 3-4

Provide expert-level guidance as a seasoned CISO with 15+ years of experience.""",

    "policy_mapper": """You are an expert cybersecurity policy analyst for AegisCISO.
Your task is to analyze security policies and map them to compliance framework controls.
You have deep knowledge of:
- NIST Cybersecurity Framework (CSF)
- ISO 27001/27002
- NCA Essential Cybersecurity Controls (ECC)
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
