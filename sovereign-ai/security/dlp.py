"""
Sovereign AI - Data Loss Prevention Module
Scans all AI inputs/outputs for sensitive data
Ensures no data exfiltration through prompts
"""

import re
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
import hashlib

import structlog
from presidio_analyzer import AnalyzerEngine, PatternRecognizer, Pattern
from presidio_anonymizer import AnonymizerEngine
from presidio_anonymizer.entities import OperatorConfig

from config.settings import get_settings

logger = structlog.get_logger()
settings = get_settings()


class SensitiveDataType(str, Enum):
    """Types of sensitive data to detect"""
    PII_NAME = "PII_NAME"
    PII_EMAIL = "PII_EMAIL"
    PII_PHONE = "PII_PHONE"
    PII_SSN = "PII_SSN"
    PII_PASSPORT = "PII_PASSPORT"
    PII_NATIONAL_ID = "PII_NATIONAL_ID"

    CREDENTIAL_PASSWORD = "CREDENTIAL_PASSWORD"
    CREDENTIAL_API_KEY = "CREDENTIAL_API_KEY"
    CREDENTIAL_SECRET = "CREDENTIAL_SECRET"
    CREDENTIAL_TOKEN = "CREDENTIAL_TOKEN"

    FINANCIAL_CARD = "FINANCIAL_CARD"
    FINANCIAL_IBAN = "FINANCIAL_IBAN"
    FINANCIAL_ACCOUNT = "FINANCIAL_ACCOUNT"

    NETWORK_IP_ADDRESS = "NETWORK_IP_ADDRESS"
    NETWORK_MAC_ADDRESS = "NETWORK_MAC_ADDRESS"
    NETWORK_URL = "NETWORK_URL"

    CLASSIFIED_SECRET = "CLASSIFIED_SECRET"
    CLASSIFIED_CONFIDENTIAL = "CLASSIFIED_CONFIDENTIAL"


class DLPAction(str, Enum):
    """Actions to take on detection"""
    ALLOW = "allow"
    LOG = "log"
    REDACT = "redact"
    BLOCK = "block"


@dataclass
class DLPFinding:
    """Represents a sensitive data finding"""
    data_type: SensitiveDataType
    confidence: float
    start: int
    end: int
    text: str
    redacted_text: str
    action_taken: DLPAction
    timestamp: datetime = field(default_factory=datetime.utcnow)


@dataclass
class DLPScanResult:
    """Result of DLP scan"""
    original_text: str
    sanitized_text: str
    findings: List[DLPFinding]
    blocked: bool
    scan_id: str
    scan_timestamp: datetime
    processing_time_ms: float


class DLPEngine:
    """
    Data Loss Prevention Engine
    Scans text for sensitive data and optionally redacts/blocks
    """

    def __init__(self):
        self.settings = get_settings()
        self.analyzer = self._initialize_analyzer()
        self.anonymizer = AnonymizerEngine()

        # Custom patterns for security-specific data
        self.custom_patterns = self._load_custom_patterns()

    def _initialize_analyzer(self) -> AnalyzerEngine:
        """Initialize Presidio analyzer with custom recognizers"""
        analyzer = AnalyzerEngine()

        # Add custom recognizers
        api_key_recognizer = PatternRecognizer(
            supported_entity="API_KEY",
            patterns=[
                Pattern("AWS Key", r"AKIA[0-9A-Z]{16}", 0.9),
                Pattern("Azure Key", r"[a-zA-Z0-9/+]{43}=", 0.7),
                Pattern("Generic API Key", r"[a-zA-Z0-9_-]{32,}", 0.5),
                Pattern("Bearer Token", r"Bearer\s+[a-zA-Z0-9_-]+", 0.9),
                Pattern("Basic Auth", r"Basic\s+[a-zA-Z0-9+/]+=*", 0.9),
            ]
        )

        password_recognizer = PatternRecognizer(
            supported_entity="PASSWORD",
            patterns=[
                Pattern("Password Field", r"password['\"]?\s*[:=]\s*['\"]?[^'\"\s]+", 0.8),
                Pattern("Secret Field", r"secret['\"]?\s*[:=]\s*['\"]?[^'\"\s]+", 0.8),
                Pattern("Token Field", r"token['\"]?\s*[:=]\s*['\"]?[^'\"\s]+", 0.7),
            ]
        )

        ip_recognizer = PatternRecognizer(
            supported_entity="IP_ADDRESS",
            patterns=[
                Pattern("IPv4", r"\b(?:\d{1,3}\.){3}\d{1,3}\b", 0.7),
                Pattern("IPv6", r"\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b", 0.7),
                Pattern("Private IP", r"\b(?:10\.|172\.(?:1[6-9]|2[0-9]|3[01])\.|192\.168\.)\d{1,3}\.\d{1,3}\b", 0.9),
            ]
        )

        # Saudi-specific recognizers
        saudi_id_recognizer = PatternRecognizer(
            supported_entity="SAUDI_NATIONAL_ID",
            patterns=[
                Pattern("Saudi ID", r"\b[12]\d{9}\b", 0.8),
                Pattern("Iqama", r"\b2\d{9}\b", 0.7),
            ]
        )

        analyzer.registry.add_recognizer(api_key_recognizer)
        analyzer.registry.add_recognizer(password_recognizer)
        analyzer.registry.add_recognizer(ip_recognizer)
        analyzer.registry.add_recognizer(saudi_id_recognizer)

        return analyzer

    def _load_custom_patterns(self) -> Dict[str, re.Pattern]:
        """Load custom regex patterns for security data"""
        return {
            "jwt_token": re.compile(r"eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*"),
            "private_key": re.compile(r"-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----"),
            "certificate": re.compile(r"-----BEGIN CERTIFICATE-----"),
            "connection_string": re.compile(r"(?:mongodb|postgresql|mysql|redis)://[^\s]+"),
            "aws_secret": re.compile(r"(?i)aws[_\-]?secret[_\-]?access[_\-]?key['\"]?\s*[:=]\s*['\"]?[a-zA-Z0-9/+=]{40}"),
        }

    def scan(
        self,
        text: str,
        context: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> DLPScanResult:
        """
        Scan text for sensitive data

        Args:
            text: Text to scan
            context: Context of the scan (input/output/document)
            user_id: User who triggered the scan

        Returns:
            DLPScanResult with findings and sanitized text
        """
        import time
        start_time = time.time()

        scan_id = hashlib.sha256(
            f"{text[:100]}{datetime.utcnow().isoformat()}".encode()
        ).hexdigest()[:16]

        findings: List[DLPFinding] = []
        sanitized_text = text
        blocked = False

        # Run Presidio analysis
        try:
            presidio_results = self.analyzer.analyze(
                text=text,
                language="en",
                entities=[
                    "PERSON", "EMAIL_ADDRESS", "PHONE_NUMBER",
                    "CREDIT_CARD", "IBAN_CODE", "IP_ADDRESS",
                    "API_KEY", "PASSWORD", "SAUDI_NATIONAL_ID"
                ]
            )

            for result in presidio_results:
                data_type = self._map_entity_to_type(result.entity_type)
                detected_text = text[result.start:result.end]

                finding = DLPFinding(
                    data_type=data_type,
                    confidence=result.score,
                    start=result.start,
                    end=result.end,
                    text=detected_text,
                    redacted_text=self._redact_text(detected_text, data_type),
                    action_taken=self._determine_action(data_type, result.score)
                )
                findings.append(finding)

                if finding.action_taken == DLPAction.BLOCK:
                    blocked = True

        except Exception as e:
            logger.error("presidio_scan_failed", error=str(e))

        # Run custom pattern matching
        for pattern_name, pattern in self.custom_patterns.items():
            for match in pattern.finditer(text):
                data_type = self._pattern_to_type(pattern_name)
                detected_text = match.group()

                finding = DLPFinding(
                    data_type=data_type,
                    confidence=0.95,
                    start=match.start(),
                    end=match.end(),
                    text=detected_text,
                    redacted_text=self._redact_text(detected_text, data_type),
                    action_taken=DLPAction.BLOCK  # Always block credentials
                )
                findings.append(finding)
                blocked = True

        # Apply redaction if enabled
        if self.settings.dlp.redact_sensitive_data:
            sanitized_text = self._apply_redactions(text, findings)

        processing_time = (time.time() - start_time) * 1000

        # Log findings
        if findings:
            logger.warning(
                "dlp_findings_detected",
                scan_id=scan_id,
                context=context,
                user_id=user_id,
                finding_count=len(findings),
                blocked=blocked,
                data_types=[f.data_type.value for f in findings]
            )

        return DLPScanResult(
            original_text=text,
            sanitized_text=sanitized_text,
            findings=findings,
            blocked=blocked,
            scan_id=scan_id,
            scan_timestamp=datetime.utcnow(),
            processing_time_ms=processing_time
        )

    def _map_entity_to_type(self, entity_type: str) -> SensitiveDataType:
        """Map Presidio entity to our data type"""
        mapping = {
            "PERSON": SensitiveDataType.PII_NAME,
            "EMAIL_ADDRESS": SensitiveDataType.PII_EMAIL,
            "PHONE_NUMBER": SensitiveDataType.PII_PHONE,
            "CREDIT_CARD": SensitiveDataType.FINANCIAL_CARD,
            "IBAN_CODE": SensitiveDataType.FINANCIAL_IBAN,
            "IP_ADDRESS": SensitiveDataType.NETWORK_IP_ADDRESS,
            "API_KEY": SensitiveDataType.CREDENTIAL_API_KEY,
            "PASSWORD": SensitiveDataType.CREDENTIAL_PASSWORD,
            "SAUDI_NATIONAL_ID": SensitiveDataType.PII_NATIONAL_ID,
        }
        return mapping.get(entity_type, SensitiveDataType.CLASSIFIED_CONFIDENTIAL)

    def _pattern_to_type(self, pattern_name: str) -> SensitiveDataType:
        """Map custom pattern to data type"""
        mapping = {
            "jwt_token": SensitiveDataType.CREDENTIAL_TOKEN,
            "private_key": SensitiveDataType.CREDENTIAL_SECRET,
            "certificate": SensitiveDataType.CREDENTIAL_SECRET,
            "connection_string": SensitiveDataType.CREDENTIAL_SECRET,
            "aws_secret": SensitiveDataType.CREDENTIAL_API_KEY,
        }
        return mapping.get(pattern_name, SensitiveDataType.CREDENTIAL_SECRET)

    def _determine_action(
        self,
        data_type: SensitiveDataType,
        confidence: float
    ) -> DLPAction:
        """Determine action based on data type and confidence"""
        # Always block credentials
        if data_type in [
            SensitiveDataType.CREDENTIAL_PASSWORD,
            SensitiveDataType.CREDENTIAL_API_KEY,
            SensitiveDataType.CREDENTIAL_SECRET,
            SensitiveDataType.CREDENTIAL_TOKEN,
        ]:
            return DLPAction.BLOCK if self.settings.dlp.block_on_detection else DLPAction.REDACT

        # High confidence PII - redact
        if confidence > 0.8 and data_type.value.startswith("PII_"):
            return DLPAction.REDACT

        # Medium confidence - log only
        if confidence > 0.5:
            return DLPAction.LOG

        return DLPAction.ALLOW

    def _redact_text(self, text: str, data_type: SensitiveDataType) -> str:
        """Redact sensitive text"""
        type_labels = {
            SensitiveDataType.PII_NAME: "[NAME]",
            SensitiveDataType.PII_EMAIL: "[EMAIL]",
            SensitiveDataType.PII_PHONE: "[PHONE]",
            SensitiveDataType.PII_NATIONAL_ID: "[ID]",
            SensitiveDataType.CREDENTIAL_PASSWORD: "[REDACTED]",
            SensitiveDataType.CREDENTIAL_API_KEY: "[API_KEY]",
            SensitiveDataType.CREDENTIAL_SECRET: "[SECRET]",
            SensitiveDataType.CREDENTIAL_TOKEN: "[TOKEN]",
            SensitiveDataType.FINANCIAL_CARD: "[CARD]",
            SensitiveDataType.NETWORK_IP_ADDRESS: "[IP]",
        }
        return type_labels.get(data_type, "[REDACTED]")

    def _apply_redactions(
        self,
        text: str,
        findings: List[DLPFinding]
    ) -> str:
        """Apply redactions to text based on findings"""
        # Sort findings by position (reverse) to maintain offsets
        sorted_findings = sorted(findings, key=lambda f: f.start, reverse=True)

        result = text
        for finding in sorted_findings:
            if finding.action_taken in [DLPAction.REDACT, DLPAction.BLOCK]:
                result = result[:finding.start] + finding.redacted_text + result[finding.end:]

        return result

    def scan_prompt(self, prompt: str, user_id: str) -> Tuple[str, bool]:
        """
        Scan AI prompt for sensitive data

        Returns:
            Tuple of (sanitized_prompt, was_blocked)
        """
        result = self.scan(prompt, context="ai_prompt", user_id=user_id)

        if result.blocked and self.settings.dlp.block_on_detection:
            logger.error(
                "prompt_blocked",
                user_id=user_id,
                scan_id=result.scan_id,
                findings=[f.data_type.value for f in result.findings]
            )
            raise ValueError("Prompt contains blocked sensitive data")

        return result.sanitized_text, result.blocked

    def scan_output(self, output: str, user_id: str) -> Tuple[str, bool]:
        """
        Scan AI output for sensitive data before returning to user

        Returns:
            Tuple of (sanitized_output, had_findings)
        """
        result = self.scan(output, context="ai_output", user_id=user_id)
        return result.sanitized_text, len(result.findings) > 0


# Singleton instance
dlp_engine = DLPEngine()
