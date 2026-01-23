"""
Sovereign AI Cybersecurity Director - Configuration
All settings enforce data sovereignty and zero external dependencies
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List, Optional
from functools import lru_cache
import secrets


class SecuritySettings(BaseSettings):
    """Security configuration - Zero Trust principles"""

    # JWT Configuration
    jwt_secret_key: str = Field(default_factory=lambda: secrets.token_urlsafe(64))
    jwt_algorithm: str = "HS512"
    jwt_access_token_expire_minutes: int = 30
    jwt_refresh_token_expire_days: int = 7

    # Password Hashing (Argon2id - OWASP recommended)
    argon2_time_cost: int = 3
    argon2_memory_cost: int = 65536  # 64MB
    argon2_parallelism: int = 4
    argon2_hash_len: int = 32
    argon2_salt_len: int = 16

    # MFA Configuration
    mfa_issuer: str = "AegisCISO-Sovereign"
    mfa_digits: int = 6
    mfa_interval: int = 30

    # Session Security
    session_binding_enabled: bool = True
    max_sessions_per_user: int = 5
    session_idle_timeout_minutes: int = 15

    # Rate Limiting
    rate_limit_requests_per_minute: int = 60
    rate_limit_ai_requests_per_minute: int = 10

    # Encryption
    encryption_key: str = Field(default_factory=lambda: secrets.token_urlsafe(32))

    class Config:
        env_prefix = "SECURITY_"


class LLMSettings(BaseSettings):
    """LLM Configuration - Supports local and hybrid modes with multiple providers"""

    # Provider Selection: "ollama" (local) | "groq" | "openai" | "deepseek" (hybrid)
    provider: str = "ollama"

    # Ollama Configuration (Local LLM Server)
    ollama_host: str = "http://localhost:11434"
    ollama_model: str = "mistral:7b"  # Using Mistral for local deployment
    ollama_embedding_model: str = "nomic-embed-text"

    # Groq Configuration (Hybrid Mode - external API for LLM)
    groq_api_key: Optional[str] = None
    groq_model: str = "llama-3.3-70b-versatile"

    # OpenAI Configuration (Hybrid Mode - external API for LLM)
    openai_api_key: Optional[str] = None
    openai_model: str = "gpt-4o"  # Default to GPT-4o

    # DeepSeek Configuration (Hybrid Mode - external API for LLM)
    deepseek_api_key: Optional[str] = None
    deepseek_model: str = "deepseek-chat"  # DeepSeek's chat model

    # Model Parameters (shared across providers)
    temperature: float = 0.1  # Low for consistency
    max_tokens: int = 4096
    top_p: float = 0.9
    repeat_penalty: float = 1.1

    # Context Window
    context_window: int = 8192

    # Timeout Settings (increased for cold-start model loading)
    inference_timeout_seconds: int = 300
    embedding_timeout_seconds: int = 60

    # Fallback Model (lighter, faster) - Ollama only
    fallback_model: str = "mistral:7b"

    class Config:
        env_prefix = "LLM_"


class RAGSettings(BaseSettings):
    """RAG Engine Configuration - Fully Local"""

    # ChromaDB Configuration
    chroma_host: str = "localhost"
    chroma_port: int = 8000
    chroma_persist_directory: str = "./data/chromadb"

    # Collection Names
    policies_collection: str = "aegis_policies"
    frameworks_collection: str = "aegis_frameworks"
    evidence_collection: str = "aegis_evidence"
    threats_collection: str = "aegis_threats"

    # Embedding Configuration
    embedding_model: str = "all-MiniLM-L6-v2"
    embedding_dimension: int = 384

    # Retrieval Settings
    top_k_results: int = 5
    similarity_threshold: float = 0.5  # Minimum threshold (captures Weak matches)

    # Tiered Similarity Thresholds (ISO 27001 & ECC-2:2024 ML Pipeline)
    strong_match_threshold: float = 0.85   # Controls are likely equivalent
    moderate_match_threshold: float = 0.70  # Related, address similar concepts
    weak_match_threshold: float = 0.50      # Conceptually related, different aspects

    # Chunking Strategy
    chunk_size: int = 1000
    chunk_overlap: int = 200

    class Config:
        env_prefix = "RAG_"


class DatabaseSettings(BaseSettings):
    """Database Configuration - Local PostgreSQL"""

    # PostgreSQL Connection
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "aegisciso"
    postgres_user: str = "aegisciso"
    postgres_password: str = "aegisciso_secret"

    # Connection Pool
    pool_size: int = 20
    max_overflow: int = 10
    pool_timeout: int = 30

    # Encryption at Rest
    encryption_enabled: bool = True

    @property
    def database_url(self) -> str:
        return f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"

    @property
    def sync_database_url(self) -> str:
        return f"postgresql://{self.postgres_user}:{self.postgres_password}@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"

    class Config:
        env_prefix = "DB_"


class AuditSettings(BaseSettings):
    """Audit & Compliance Configuration"""

    # Audit Log Settings
    audit_log_encryption: bool = True
    audit_log_retention_days: int = 2555  # 7 years for compliance
    audit_log_immutable: bool = True

    # Compliance Frameworks
    enabled_frameworks: List[str] = [
        "NCA_ECC",
        "NIST_CSF",
        "ISO_27001",
        "SOC2",
        "PDPL"
    ]

    # Evidence Requirements
    evidence_retention_days: int = 2555
    evidence_integrity_check: bool = True

    class Config:
        env_prefix = "AUDIT_"


class DLPSettings(BaseSettings):
    """Data Loss Prevention Configuration"""

    # DLP Scanning
    dlp_enabled: bool = True
    dlp_scan_inputs: bool = True
    dlp_scan_outputs: bool = True

    # Sensitive Data Patterns
    detect_pii: bool = True
    detect_credentials: bool = True
    detect_api_keys: bool = True
    detect_ip_addresses: bool = True

    # Actions
    block_on_detection: bool = False  # Log only by default
    redact_sensitive_data: bool = True

    class Config:
        env_prefix = "DLP_"


class SovereignSettings(BaseSettings):
    """Master Configuration - Sovereign AI Director"""

    # Application Info
    app_name: str = "AegisCISO Sovereign AI Director"
    app_version: str = "2.0.0"
    environment: str = "production"
    debug: bool = False

    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_workers: int = 4

    # CORS (Restricted to internal)
    cors_origins: List[str] = ["http://localhost:3001"]

    # Data Sovereignty
    data_residency: str = "on-premises"
    external_api_calls_allowed: bool = False  # CRITICAL: Must remain False for full sovereignty
    telemetry_enabled: bool = False  # No external telemetry

    # Hybrid Mode: Allows external LLM API (Groq) while keeping data local
    # When True: LLM inference can use external APIs, but embeddings/RAG remain local
    # When False: Full sovereignty - all processing is local
    hybrid_mode: bool = False

    # Sub-configurations
    security: SecuritySettings = SecuritySettings()
    llm: LLMSettings = LLMSettings()
    rag: RAGSettings = RAGSettings()
    database: DatabaseSettings = DatabaseSettings()
    audit: AuditSettings = AuditSettings()
    dlp: DLPSettings = DLPSettings()

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        env_prefix = ""  # Allow HYBRID_MODE without prefix


@lru_cache()
def get_settings() -> SovereignSettings:
    """Get cached settings instance"""
    return SovereignSettings()


# Sovereignty Validation
def validate_sovereignty():
    """
    Validate sovereignty configuration

    In full sovereignty mode (hybrid_mode=False):
    - No external API calls allowed
    - All processing must be local

    In hybrid mode (hybrid_mode=True):
    - External LLM API (Groq) is allowed
    - Embeddings and data storage remain local
    - Warnings are logged but do not block
    """
    settings = get_settings()

    violations = []
    warnings = []

    # Check for completely forbidden configurations
    if settings.telemetry_enabled:
        violations.append("CRITICAL: Telemetry is enabled - data may leave system")

    if "api.openai.com" in settings.llm.ollama_host:
        violations.append("CRITICAL: OpenAI API detected in Ollama host configuration")

    if "api.anthropic.com" in settings.llm.ollama_host:
        violations.append("CRITICAL: Anthropic API detected in Ollama host configuration")

    # Hybrid mode specific checks
    if settings.hybrid_mode:
        # Hybrid mode is enabled - allow Groq but log warning
        if settings.llm.provider == "groq":
            warnings.append(
                "HYBRID MODE: Using Groq API for LLM inference. "
                "Embeddings and data storage remain local."
            )

        # external_api_calls_allowed should still be False even in hybrid mode
        # (hybrid_mode specifically enables LLM API, not general external calls)
        if settings.external_api_calls_allowed:
            warnings.append(
                "WARNING: external_api_calls_allowed=True is redundant with hybrid_mode=True"
            )
    else:
        # Full sovereignty mode
        if settings.external_api_calls_allowed:
            violations.append("CRITICAL: External API calls are enabled without hybrid_mode")

        if settings.llm.provider == "groq":
            violations.append(
                "CRITICAL: Groq provider requires hybrid_mode=True. "
                "Set HYBRID_MODE=true to use external LLM APIs."
            )

    # Log warnings but don't block
    if warnings:
        import structlog
        logger = structlog.get_logger()
        for warning in warnings:
            logger.warning("sovereignty_warning", message=warning)

    # Raise on violations
    if violations:
        raise ValueError(f"Sovereignty violations detected:\n" + "\n".join(violations))

    return True
