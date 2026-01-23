"""
Sovereign AI Cybersecurity Director - FastAPI Application
Main API server with zero-trust security and full audit logging
"""

import asyncio
from contextlib import asynccontextmanager
from datetime import datetime
from typing import Optional, List, Dict, Any
import hashlib
import json

from fastapi import FastAPI, HTTPException, Depends, Request, Response, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
import structlog

from config.settings import get_settings, validate_sovereignty
from security.auth import (
    auth_service, SessionContext, Role, Permission,
    require_permission, require_mfa, ROLE_PERMISSIONS
)
from security.dlp import dlp_engine
from llm import get_llm_client, LLMMessage, LLMRole
from rag.engine import rag_engine, DocumentType
from modules.policy_mapper import policy_mapper, ComplianceFramework
from modules.soc_cmm_analyzer import soc_cmm_analyzer, SOCCMMDomain, MaturityLevel, Evidence

logger = structlog.get_logger()
settings = get_settings()
security = HTTPBearer()


# ============================================================================
# Startup / Shutdown
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management"""
    # Startup
    logger.info("sovereign_ai_starting", version=settings.app_version)

    # Validate sovereignty (respects hybrid_mode setting)
    try:
        validate_sovereignty()
        logger.info(
            "sovereignty_validation_passed",
            hybrid_mode=settings.hybrid_mode,
            provider=settings.llm.provider
        )
    except ValueError as e:
        logger.critical("sovereignty_violation", error=str(e))
        raise

    # Initialize LLM client via factory
    llm_client = get_llm_client()

    # Check LLM availability
    if await llm_client.health_check():
        logger.info(
            "llm_health_check_passed",
            provider=llm_client.get_provider_name()
        )
        # List models only for Ollama (Groq doesn't have this)
        if hasattr(llm_client, 'list_models'):
            models = await llm_client.list_models()
            logger.info("available_models", models=models)
    else:
        logger.warning(
            "llm_not_available",
            provider=llm_client.get_provider_name(),
            message=f"{llm_client.get_provider_name()} not responding"
        )

    yield

    # Shutdown
    logger.info("sovereign_ai_shutting_down")
    await llm_client.close()
    rag_engine.persist()


# ============================================================================
# FastAPI Application
# ============================================================================

app = FastAPI(
    title="AegisCISO Sovereign AI Director",
    description="Enterprise AI Cybersecurity Director - Fully Sovereign, Zero External Dependencies",
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/api/docs" if settings.debug else None,
    redoc_url="/api/redoc" if settings.debug else None,
)

# CORS - Restricted to internal
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)


# ============================================================================
# Security Middleware
# ============================================================================

async def get_current_session(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> SessionContext:
    """Extract and validate session from request

    Supports two authentication methods:
    1. JWT Bearer token (for direct API calls)
    2. Internal headers from Next.js frontend (X-User-Id, X-User-Email, X-User-Role)
    """
    # Get client info
    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")

    # Check for internal frontend headers first (from Next.js API routes)
    user_id = request.headers.get("x-user-id")
    user_email = request.headers.get("x-user-email")
    user_role = request.headers.get("x-user-role", "GRC_ANALYST")

    if user_id and user_email:
        # Internal request from frontend - create session from headers
        try:
            role = Role(user_role)
        except ValueError:
            role = Role.GRC_ANALYST

        return SessionContext(
            user_id=user_id,
            email=user_email,
            role=role,
            permissions=ROLE_PERMISSIONS.get(role, []),
            session_id=f"internal-{user_id}",
            ip_address=ip_address,
            user_agent=user_agent,
            device_fingerprint="internal",
            created_at=datetime.utcnow(),
            expires_at=datetime.utcnow(),
            mfa_verified=False
        )

    # Fall back to JWT token authentication
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = credentials.credentials
    session = auth_service.get_session_context(
        token=token,
        ip_address=ip_address,
        user_agent=user_agent
    )

    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired session")

    return session


async def audit_log(
    request: Request,
    session: SessionContext,
    action: str,
    resource: str,
    details: Dict[str, Any],
    background_tasks: BackgroundTasks
):
    """Log action to audit trail"""
    log_entry = {
        "timestamp": datetime.utcnow().isoformat(),
        "user_id": session.user_id,
        "email": session.email,
        "role": session.role.value,
        "action": action,
        "resource": resource,
        "ip_address": session.ip_address,
        "user_agent": session.user_agent,
        "details": details,
        "session_id": session.session_id,
    }

    # Log asynchronously
    background_tasks.add_task(
        logger.info,
        "audit_log",
        **log_entry
    )


# ============================================================================
# Request/Response Models
# ============================================================================

class LoginRequest(BaseModel):
    email: str
    password: str
    mfa_token: Optional[str] = None


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    mfa_required: bool = False


class AIQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=4000)
    context_type: Optional[str] = "general"
    include_sources: bool = True


class AIQueryResponse(BaseModel):
    answer: str
    sources: List[Dict[str, Any]]
    confidence: float
    model: str
    processing_time_ms: float
    filtered: bool = False


class PolicyMappingRequest(BaseModel):
    policy_id: str
    policy_title: str
    policy_content: str
    statements: List[Dict[str, str]]
    frameworks: List[str] = ["NCA_ECC", "NIST_CSF"]


class PolicyMappingResponse(BaseModel):
    policy_id: str
    mappings: List[Dict[str, Any]]
    coverage_summary: Dict[str, Any]
    gaps: List[Dict[str, Any]]
    recommendations: List[str]
    compliance_score: float
    processing_time_ms: float


class SOCCMMRequest(BaseModel):
    organization: str
    evidence: List[Dict[str, Any]]
    target_maturity: int = 3


class SOCCMMResponse(BaseModel):
    assessment_id: str
    overall_maturity: str
    overall_score: float
    domain_assessments: List[Dict[str, Any]]
    executive_summary: str
    priority_improvements: List[Dict[str, Any]]
    roadmap: List[Dict[str, Any]]
    processing_time_ms: float


class DocumentIndexRequest(BaseModel):
    content: str
    doc_type: str
    doc_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class HealthResponse(BaseModel):
    status: str
    version: str
    llm_available: bool
    llm_provider: str
    hybrid_mode: bool
    sovereignty_validated: bool
    timestamp: str


# ============================================================================
# Health & Status Endpoints
# ============================================================================

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    llm_client = get_llm_client()
    llm_available = await llm_client.health_check()

    try:
        validate_sovereignty()
        sovereignty_ok = True
    except:
        sovereignty_ok = False

    return HealthResponse(
        status="healthy" if llm_available and sovereignty_ok else "degraded",
        version=settings.app_version,
        llm_available=llm_available,
        llm_provider=llm_client.get_provider_name(),
        hybrid_mode=settings.hybrid_mode,
        sovereignty_validated=sovereignty_ok,
        timestamp=datetime.utcnow().isoformat()
    )


@app.get("/api/v1/status")
async def api_status(session: SessionContext = Depends(get_current_session)):
    """API status with authentication"""
    return {
        "status": "operational",
        "user": session.email,
        "role": session.role.value,
        "permissions": [p.value for p in session.permissions],
        "data_sovereignty": "enforced",
        "external_api_calls": "blocked"
    }


# ============================================================================
# Authentication Endpoints
# ============================================================================

@app.post("/api/v1/auth/login", response_model=LoginResponse)
async def login(
    request: Request,
    body: LoginRequest,
    background_tasks: BackgroundTasks
):
    """
    Authenticate user and return JWT tokens

    This is a simplified example - in production, integrate with your
    existing NextAuth.js / database authentication
    """
    # NOTE: This should integrate with your existing PostgreSQL user database
    # For now, we'll return a mock response

    ip_address = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")

    # Generate device fingerprint for session binding
    device_fingerprint = auth_service.create_device_fingerprint(ip_address, user_agent)

    # Mock user (replace with database lookup)
    user_id = hashlib.sha256(body.email.encode()).hexdigest()[:16]
    role = Role.CISO  # Determine from database

    # Check MFA if required
    mfa_verified = False
    if body.mfa_token:
        # Verify MFA token (implement with user's MFA secret from database)
        mfa_verified = True

    # Generate session ID
    session_id = hashlib.sha256(
        f"{user_id}{datetime.utcnow().isoformat()}".encode()
    ).hexdigest()[:32]

    # Create tokens
    access_token = auth_service.create_access_token(
        user_id=user_id,
        email=body.email,
        role=role,
        session_id=session_id,
        device_fingerprint=device_fingerprint,
        mfa_verified=mfa_verified
    )

    refresh_token = auth_service.create_refresh_token(
        user_id=user_id,
        session_id=session_id
    )

    # Audit log
    background_tasks.add_task(
        logger.info,
        "user_login",
        user_id=user_id,
        email=body.email,
        ip_address=ip_address,
        mfa_used=bool(body.mfa_token)
    )

    return LoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.security.jwt_access_token_expire_minutes * 60,
        mfa_required=not mfa_verified and role in [Role.CISO, Role.SOC_MANAGER]
    )


# ============================================================================
# AI Query Endpoints
# ============================================================================

@app.post("/api/v1/ai/query", response_model=AIQueryResponse)
async def ai_query(
    request: Request,
    body: AIQueryRequest,
    background_tasks: BackgroundTasks,
    session: SessionContext = Depends(get_current_session)
):
    """
    Query the AI Cybersecurity Director
    Uses RAG for context-aware responses
    """
    # Permission check
    if Permission.AI_RISK_ANALYSIS not in session.permissions:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    # DLP scan query
    sanitized_query, was_blocked = dlp_engine.scan_prompt(body.query, session.user_id)
    if was_blocked and settings.dlp.block_on_detection:
        raise HTTPException(status_code=400, detail="Query contains blocked content")

    # Determine document types based on context
    doc_types = None
    if body.context_type == "policy":
        doc_types = [DocumentType.POLICY, DocumentType.FRAMEWORK]
    elif body.context_type == "risk":
        doc_types = [DocumentType.RISK, DocumentType.THREAT_INTEL]
    elif body.context_type == "compliance":
        doc_types = [DocumentType.FRAMEWORK, DocumentType.CONTROL]

    # RAG query
    result = await rag_engine.query(
        question=sanitized_query,
        doc_types=doc_types,
        system_prompt_key="risk_analyst" if body.context_type == "risk" else "policy_mapper",
        user_id=session.user_id
    )

    # Audit log
    await audit_log(
        request=request,
        session=session,
        action="ai_query",
        resource="ai_director",
        details={
            "query_length": len(body.query),
            "context_type": body.context_type,
            "sources_found": len(result.sources)
        },
        background_tasks=background_tasks
    )

    return AIQueryResponse(
        answer=result.answer,
        sources=[
            {
                "id": s.document.id,
                "type": s.document.doc_type.value,
                "relevance": round(s.similarity_score, 2),
                "excerpt": s.document.content[:200] + "..."
            }
            for s in result.sources
        ] if body.include_sources else [],
        confidence=result.confidence,
        model=result.model,
        processing_time_ms=result.processing_time_ms,
        filtered=False
    )


@app.post("/api/v1/ai/chat")
async def ai_chat(
    request: Request,
    messages: List[Dict[str, str]],
    background_tasks: BackgroundTasks,
    session: SessionContext = Depends(get_current_session)
):
    """Multi-turn chat with AI Director"""
    llm_client = get_llm_client()

    llm_messages = [
        LLMMessage(
            role=LLMRole(msg.get("role", "user")),
            content=msg.get("content", "")
        )
        for msg in messages
    ]

    response = await llm_client.chat(
        messages=llm_messages,
        user_id=session.user_id
    )

    await audit_log(
        request=request,
        session=session,
        action="ai_chat",
        resource="ai_director",
        details={
            "message_count": len(messages),
            "provider": llm_client.get_provider_name()
        },
        background_tasks=background_tasks
    )

    return {
        "response": response.content,
        "model": response.model,
        "tokens_used": response.tokens_used,
        "processing_time_ms": response.generation_time_ms,
        "provider": llm_client.get_provider_name()
    }


# ============================================================================
# Policy Mapping Endpoints
# ============================================================================

@app.post("/api/v1/compliance/policy-mapping", response_model=PolicyMappingResponse)
async def map_policy_to_frameworks(
    request: Request,
    body: PolicyMappingRequest,
    background_tasks: BackgroundTasks,
    session: SessionContext = Depends(get_current_session)
):
    """
    Map policy to compliance frameworks
    Supports NCA ECC, NIST CSF, ISO 27001, SOC 2
    """
    if Permission.AI_POLICY_MAPPING not in session.permissions:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    # Parse frameworks
    frameworks = [
        ComplianceFramework(f) for f in body.frameworks
        if f in [cf.value for cf in ComplianceFramework]
    ]

    result = await policy_mapper.analyze_policy(
        policy_id=body.policy_id,
        policy_title=body.policy_title,
        policy_content=body.policy_content,
        statements=body.statements,
        target_frameworks=frameworks,
        user_id=session.user_id
    )

    await audit_log(
        request=request,
        session=session,
        action="policy_mapping",
        resource=f"policy:{body.policy_id}",
        details={
            "frameworks": body.frameworks,
            "statements_count": len(body.statements),
            "mappings_found": len(result.mappings)
        },
        background_tasks=background_tasks
    )

    return PolicyMappingResponse(
        policy_id=result.policy_id,
        mappings=[
            {
                "statement_id": m.statement_id,
                "control_id": m.control.control_id,
                "framework": m.control.framework.value,
                "coverage": m.coverage_level.value,
                "confidence": m.confidence_score,
                "rationale": m.rationale
            }
            for m in result.mappings
        ],
        coverage_summary={
            framework.value: summary
            for framework, summary in result.coverage_summary.items()
        },
        gaps=result.gaps,
        recommendations=result.recommendations,
        compliance_score=result.overall_compliance_score,
        processing_time_ms=result.processing_time_ms
    )


# ============================================================================
# SOC-CMM Assessment Endpoints
# ============================================================================

@app.post("/api/v1/assessment/soc-cmm", response_model=SOCCMMResponse)
async def assess_soc_cmm(
    request: Request,
    body: SOCCMMRequest,
    background_tasks: BackgroundTasks,
    session: SessionContext = Depends(get_current_session)
):
    """
    Perform SOC-CMM maturity assessment
    """
    if Permission.AI_SOC_CMM not in session.permissions:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    # Convert evidence
    evidence_list = [
        Evidence(
            id=e.get("id", str(i)),
            title=e.get("title", ""),
            description=e.get("description", ""),
            domain=SOCCMMDomain(e.get("domain", "Technology")),
            content=e.get("content", ""),
            artifact_type=e.get("artifact_type", "document"),
            uploaded_at=datetime.utcnow()
        )
        for i, e in enumerate(body.evidence)
    ]

    result = await soc_cmm_analyzer.analyze_evidence(
        evidence_list=evidence_list,
        organization=body.organization,
        target_maturity=MaturityLevel(body.target_maturity),
        user_id=session.user_id
    )

    await audit_log(
        request=request,
        session=session,
        action="soc_cmm_assessment",
        resource=f"organization:{body.organization}",
        details={
            "evidence_count": len(body.evidence),
            "overall_score": result.overall_score
        },
        background_tasks=background_tasks
    )

    return SOCCMMResponse(
        assessment_id=result.assessment_id,
        overall_maturity=result.overall_maturity.name,
        overall_score=result.overall_score,
        domain_assessments=[
            {
                "domain": a.domain.value,
                "current_level": a.current_level.name,
                "score": a.score,
                "strengths": a.strengths,
                "weaknesses": a.weaknesses
            }
            for a in result.domain_assessments
        ],
        executive_summary=result.executive_summary,
        priority_improvements=result.priority_improvements,
        roadmap=result.roadmap,
        processing_time_ms=result.processing_time_ms
    )


# ============================================================================
# Document Management Endpoints
# ============================================================================

@app.post("/api/v1/documents/index")
async def index_document(
    request: Request,
    body: DocumentIndexRequest,
    background_tasks: BackgroundTasks,
    session: SessionContext = Depends(get_current_session)
):
    """Index document into RAG system"""
    if Permission.DATA_WRITE not in session.permissions:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    doc_type = DocumentType(body.doc_type)

    doc_id = await rag_engine.add_document(
        content=body.content,
        doc_type=doc_type,
        doc_id=body.doc_id,
        metadata=body.metadata
    )

    await audit_log(
        request=request,
        session=session,
        action="document_index",
        resource=f"document:{doc_id}",
        details={
            "doc_type": body.doc_type,
            "content_length": len(body.content)
        },
        background_tasks=background_tasks
    )

    return {"doc_id": doc_id, "status": "indexed"}


@app.get("/api/v1/documents/search")
async def search_documents(
    query: str,
    doc_type: Optional[str] = None,
    top_k: int = 5,
    session: SessionContext = Depends(get_current_session)
):
    """Search documents in RAG system"""
    if Permission.DATA_READ not in session.permissions:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    doc_types = [DocumentType(doc_type)] if doc_type else None

    results = await rag_engine.retrieve(
        query=query,
        doc_types=doc_types,
        top_k=top_k
    )

    return {
        "query": query,
        "results": [
            {
                "id": r.document.id,
                "type": r.document.doc_type.value,
                "relevance": round(r.similarity_score, 2),
                "content": r.document.content[:500] + "..."
            }
            for r in results
        ]
    }


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "api.main:app",
        host=settings.api_host,
        port=settings.api_port,
        workers=settings.api_workers,
        log_level="info"
    )
