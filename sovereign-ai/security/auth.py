"""
Sovereign AI - Zero-Trust Authentication Module
Implements Argon2id hashing, MFA, session binding, and audit logging
"""

import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from enum import Enum

from passlib.context import CryptContext
from jose import JWTError, jwt
import pyotp
import structlog

from config.settings import get_settings

logger = structlog.get_logger()
settings = get_settings()


class Role(str, Enum):
    """RBAC Roles with hierarchical permissions"""
    CISO = "CISO"           # Full access
    SOC_MANAGER = "SOC_MANAGER"  # Security operations
    GRC_ANALYST = "GRC_ANALYST"  # Governance, Risk, Compliance
    OT_ENGINEER = "OT_ENGINEER"  # OT/ICS security
    CLOUD_ARCHITECT = "CLOUD_ARCHITECT"  # Cloud security
    AUDITOR = "AUDITOR"     # Read-only with audit access
    VIEWER = "VIEWER"       # Basic read-only


class Permission(str, Enum):
    """Granular permissions for zero-trust access"""
    # AI Module Permissions
    AI_POLICY_MAPPING = "ai:policy:mapping"
    AI_RISK_ANALYSIS = "ai:risk:analysis"
    AI_THREAT_MODELING = "ai:threat:modeling"
    AI_EXECUTIVE_REPORTS = "ai:reports:executive"
    AI_SOC_CMM = "ai:soc:cmm"

    # Data Permissions
    DATA_READ = "data:read"
    DATA_WRITE = "data:write"
    DATA_DELETE = "data:delete"
    DATA_EXPORT = "data:export"

    # Admin Permissions
    ADMIN_USERS = "admin:users"
    ADMIN_ROLES = "admin:roles"
    ADMIN_AUDIT = "admin:audit"
    ADMIN_SYSTEM = "admin:system"

    # Evidence & Compliance
    EVIDENCE_UPLOAD = "evidence:upload"
    EVIDENCE_APPROVE = "evidence:approve"
    COMPLIANCE_MANAGE = "compliance:manage"


# Role-Permission Matrix
ROLE_PERMISSIONS: Dict[Role, List[Permission]] = {
    Role.CISO: list(Permission),  # All permissions

    Role.SOC_MANAGER: [
        Permission.AI_POLICY_MAPPING,
        Permission.AI_RISK_ANALYSIS,
        Permission.AI_THREAT_MODELING,
        Permission.AI_EXECUTIVE_REPORTS,
        Permission.AI_SOC_CMM,
        Permission.DATA_READ,
        Permission.DATA_WRITE,
        Permission.EVIDENCE_UPLOAD,
        Permission.EVIDENCE_APPROVE,
    ],

    Role.GRC_ANALYST: [
        Permission.AI_POLICY_MAPPING,
        Permission.AI_RISK_ANALYSIS,
        Permission.AI_EXECUTIVE_REPORTS,
        Permission.AI_SOC_CMM,
        Permission.DATA_READ,
        Permission.DATA_WRITE,
        Permission.EVIDENCE_UPLOAD,
        Permission.COMPLIANCE_MANAGE,
    ],

    Role.OT_ENGINEER: [
        Permission.AI_RISK_ANALYSIS,
        Permission.AI_THREAT_MODELING,
        Permission.DATA_READ,
        Permission.DATA_WRITE,
        Permission.EVIDENCE_UPLOAD,
    ],

    Role.CLOUD_ARCHITECT: [
        Permission.AI_RISK_ANALYSIS,
        Permission.AI_THREAT_MODELING,
        Permission.DATA_READ,
        Permission.DATA_WRITE,
        Permission.EVIDENCE_UPLOAD,
    ],

    Role.AUDITOR: [
        Permission.DATA_READ,
        Permission.DATA_EXPORT,
        Permission.ADMIN_AUDIT,
    ],

    Role.VIEWER: [
        Permission.DATA_READ,
    ],
}


# Argon2id Password Context (OWASP recommended)
pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
    argon2__rounds=settings.security.argon2_time_cost,
    argon2__memory_cost=settings.security.argon2_memory_cost,
    argon2__parallelism=settings.security.argon2_parallelism,
    argon2__hash_len=settings.security.argon2_hash_len,
    argon2__salt_len=settings.security.argon2_salt_len,
)


@dataclass
class SessionContext:
    """Immutable session context with binding"""
    user_id: str
    email: str
    role: Role
    permissions: List[Permission]
    session_id: str
    ip_address: str
    user_agent: str
    device_fingerprint: str
    created_at: datetime
    expires_at: datetime
    mfa_verified: bool = False


class AuthService:
    """Zero-Trust Authentication Service"""

    def __init__(self):
        self.settings = get_settings()

    def hash_password(self, password: str) -> str:
        """Hash password using Argon2id"""
        return pwd_context.hash(password)

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password against Argon2id hash"""
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception as e:
            logger.error("password_verification_failed", error=str(e))
            return False

    def generate_mfa_secret(self) -> str:
        """Generate TOTP secret for MFA"""
        return pyotp.random_base32()

    def get_mfa_uri(self, email: str, secret: str) -> str:
        """Generate MFA provisioning URI for authenticator apps"""
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(
            name=email,
            issuer_name=self.settings.security.mfa_issuer
        )

    def verify_mfa_token(self, secret: str, token: str) -> bool:
        """Verify TOTP token"""
        totp = pyotp.TOTP(secret)
        # Allow 1 window tolerance for clock drift
        return totp.verify(token, valid_window=1)

    def create_device_fingerprint(
        self,
        ip_address: str,
        user_agent: str,
        additional_data: Optional[Dict] = None
    ) -> str:
        """Create device fingerprint for session binding"""
        fingerprint_data = f"{ip_address}:{user_agent}"
        if additional_data:
            fingerprint_data += f":{str(additional_data)}"

        return hashlib.sha256(fingerprint_data.encode()).hexdigest()[:32]

    def create_access_token(
        self,
        user_id: str,
        email: str,
        role: Role,
        session_id: str,
        device_fingerprint: str,
        mfa_verified: bool = False
    ) -> str:
        """Create JWT access token with session binding"""
        expires = datetime.utcnow() + timedelta(
            minutes=self.settings.security.jwt_access_token_expire_minutes
        )

        payload = {
            "sub": user_id,
            "email": email,
            "role": role.value,
            "session_id": session_id,
            "device_fp": device_fingerprint,
            "mfa": mfa_verified,
            "permissions": [p.value for p in ROLE_PERMISSIONS.get(role, [])],
            "exp": expires,
            "iat": datetime.utcnow(),
            "iss": "aegisciso-sovereign",
            "aud": "aegisciso-api",
        }

        return jwt.encode(
            payload,
            self.settings.security.jwt_secret_key,
            algorithm=self.settings.security.jwt_algorithm
        )

    def create_refresh_token(self, user_id: str, session_id: str) -> str:
        """Create refresh token for token renewal"""
        expires = datetime.utcnow() + timedelta(
            days=self.settings.security.jwt_refresh_token_expire_days
        )

        payload = {
            "sub": user_id,
            "session_id": session_id,
            "type": "refresh",
            "exp": expires,
            "iat": datetime.utcnow(),
        }

        return jwt.encode(
            payload,
            self.settings.security.jwt_secret_key,
            algorithm=self.settings.security.jwt_algorithm
        )

    def decode_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Decode and validate JWT token"""
        try:
            payload = jwt.decode(
                token,
                self.settings.security.jwt_secret_key,
                algorithms=[self.settings.security.jwt_algorithm],
                audience="aegisciso-api",
                issuer="aegisciso-sovereign"
            )
            return payload
        except JWTError as e:
            logger.warning("token_decode_failed", error=str(e))
            return None

    def validate_session_binding(
        self,
        token_fingerprint: str,
        current_fingerprint: str
    ) -> bool:
        """Validate that session is bound to same device"""
        if not self.settings.security.session_binding_enabled:
            return True
        return secrets.compare_digest(token_fingerprint, current_fingerprint)

    def check_permission(self, role: Role, required_permission: Permission) -> bool:
        """Check if role has required permission"""
        role_permissions = ROLE_PERMISSIONS.get(role, [])
        return required_permission in role_permissions

    def get_session_context(
        self,
        token: str,
        ip_address: str,
        user_agent: str
    ) -> Optional[SessionContext]:
        """Extract and validate session context from token"""
        payload = self.decode_token(token)
        if not payload:
            return None

        # Validate session binding
        current_fingerprint = self.create_device_fingerprint(ip_address, user_agent)
        if not self.validate_session_binding(
            payload.get("device_fp", ""),
            current_fingerprint
        ):
            logger.warning(
                "session_binding_mismatch",
                user_id=payload.get("sub"),
                expected_fp=payload.get("device_fp"),
                actual_fp=current_fingerprint
            )
            return None

        role = Role(payload.get("role"))
        permissions = [Permission(p) for p in payload.get("permissions", [])]

        return SessionContext(
            user_id=payload.get("sub"),
            email=payload.get("email"),
            role=role,
            permissions=permissions,
            session_id=payload.get("session_id"),
            ip_address=ip_address,
            user_agent=user_agent,
            device_fingerprint=current_fingerprint,
            created_at=datetime.fromtimestamp(payload.get("iat", 0)),
            expires_at=datetime.fromtimestamp(payload.get("exp", 0)),
            mfa_verified=payload.get("mfa", False)
        )


# Singleton instance
auth_service = AuthService()


def require_permission(permission: Permission):
    """Decorator for permission-based access control"""
    def decorator(func):
        async def wrapper(*args, session: SessionContext, **kwargs):
            if permission not in session.permissions:
                logger.warning(
                    "permission_denied",
                    user_id=session.user_id,
                    required=permission.value,
                    role=session.role.value
                )
                raise PermissionError(f"Permission denied: {permission.value}")
            return await func(*args, session=session, **kwargs)
        return wrapper
    return decorator


def require_mfa(func):
    """Decorator requiring MFA verification"""
    async def wrapper(*args, session: SessionContext, **kwargs):
        if not session.mfa_verified:
            logger.warning(
                "mfa_required",
                user_id=session.user_id,
                endpoint=func.__name__
            )
            raise PermissionError("MFA verification required")
        return await func(*args, session=session, **kwargs)
    return wrapper
