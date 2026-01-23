"""
Sovereign AI - Policy Mapping Module
AI-powered mapping of policies to compliance framework controls
Supports NCA ECC, NIST CSF, ISO 27001, SOC 2, CIS Controls
"""

import asyncio
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import json
import re

import structlog

from config.settings import get_settings
from llm.ollama_client import ollama_client, SYSTEM_PROMPTS, LLMMessage, LLMRole
from rag.engine import rag_engine, DocumentType

logger = structlog.get_logger()
settings = get_settings()


class ComplianceFramework(str, Enum):
    """Supported compliance frameworks"""
    NCA_ECC = "NCA_ECC"           # NCA Essential Cybersecurity Controls
    NIST_CSF = "NIST_CSF"         # NIST Cybersecurity Framework
    ISO_27001 = "ISO_27001"       # ISO 27001:2022
    SOC2 = "SOC2"                 # SOC 2 Trust Services Criteria
    CIS_CSC = "CIS_CSC"           # CIS Critical Security Controls


class CoverageLevel(str, Enum):
    """Coverage level of mapping"""
    FULL = "full"           # Completely addresses the control
    PARTIAL = "partial"     # Partially addresses the control
    MINIMAL = "minimal"     # Minimally addresses
    NONE = "none"           # Does not address


@dataclass
class FrameworkControl:
    """Compliance framework control"""
    framework: ComplianceFramework
    control_id: str
    domain: str
    title: str
    description: str
    requirements: List[str] = field(default_factory=list)


@dataclass
class PolicyMapping:
    """Mapping between policy statement and framework control"""
    policy_id: str
    statement_id: str
    statement_content: str
    control: FrameworkControl
    coverage_level: CoverageLevel
    confidence_score: float  # 0.0 - 1.0
    rationale: str
    gaps: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)


@dataclass
class PolicyAnalysisResult:
    """Result of policy analysis"""
    policy_id: str
    policy_title: str
    total_statements: int
    mappings: List[PolicyMapping]
    coverage_summary: Dict[ComplianceFramework, Dict[str, int]]
    gaps: List[Dict[str, Any]]
    recommendations: List[str]
    overall_compliance_score: float
    analysis_timestamp: datetime
    processing_time_ms: float


# Framework Control Knowledge Base
NCA_ECC_CONTROLS = {
    "1-1": FrameworkControl(
        framework=ComplianceFramework.NCA_ECC,
        control_id="1-1",
        domain="Cybersecurity Governance",
        title="Cybersecurity Strategy",
        description="Establish a cybersecurity strategy aligned with business objectives",
        requirements=[
            "Define cybersecurity vision and objectives",
            "Align with organizational strategy",
            "Obtain executive sponsorship",
            "Regular review and update"
        ]
    ),
    "1-2": FrameworkControl(
        framework=ComplianceFramework.NCA_ECC,
        control_id="1-2",
        domain="Cybersecurity Governance",
        title="Cybersecurity Policies",
        description="Develop and maintain cybersecurity policies",
        requirements=[
            "Comprehensive policy framework",
            "Clear roles and responsibilities",
            "Regular policy review",
            "Policy communication and awareness"
        ]
    ),
    "2-1": FrameworkControl(
        framework=ComplianceFramework.NCA_ECC,
        control_id="2-1",
        domain="Cybersecurity Defense",
        title="Asset Management",
        description="Identify and manage information assets",
        requirements=[
            "Complete asset inventory",
            "Asset classification",
            "Asset ownership assignment",
            "Regular inventory updates"
        ]
    ),
    "2-2": FrameworkControl(
        framework=ComplianceFramework.NCA_ECC,
        control_id="2-2",
        domain="Cybersecurity Defense",
        title="Identity and Access Management",
        description="Control access to systems and data",
        requirements=[
            "Identity lifecycle management",
            "Access control policies",
            "Privileged access management",
            "Authentication mechanisms"
        ]
    ),
    "2-3": FrameworkControl(
        framework=ComplianceFramework.NCA_ECC,
        control_id="2-3",
        domain="Cybersecurity Defense",
        title="Network Security",
        description="Protect network infrastructure",
        requirements=[
            "Network segmentation",
            "Firewall management",
            "Intrusion detection",
            "Secure remote access"
        ]
    ),
    "3-1": FrameworkControl(
        framework=ComplianceFramework.NCA_ECC,
        control_id="3-1",
        domain="Cybersecurity Resilience",
        title="Incident Management",
        description="Detect, respond to, and recover from incidents",
        requirements=[
            "Incident response plan",
            "Detection capabilities",
            "Response procedures",
            "Post-incident review"
        ]
    ),
    "3-2": FrameworkControl(
        framework=ComplianceFramework.NCA_ECC,
        control_id="3-2",
        domain="Cybersecurity Resilience",
        title="Business Continuity",
        description="Ensure business continuity and disaster recovery",
        requirements=[
            "BCP/DRP documentation",
            "Regular testing",
            "Recovery objectives (RTO/RPO)",
            "Crisis communication"
        ]
    ),
}

NIST_CSF_CONTROLS = {
    "ID.AM": FrameworkControl(
        framework=ComplianceFramework.NIST_CSF,
        control_id="ID.AM",
        domain="Identify",
        title="Asset Management",
        description="Data, personnel, devices, systems, and facilities are identified and managed",
        requirements=[
            "Physical devices and systems inventory",
            "Software platforms and applications inventory",
            "Communication and data flows mapped",
            "External systems catalogued",
            "Resources prioritized based on criticality"
        ]
    ),
    "ID.GV": FrameworkControl(
        framework=ComplianceFramework.NIST_CSF,
        control_id="ID.GV",
        domain="Identify",
        title="Governance",
        description="Policies, procedures, and processes to manage and monitor regulatory, legal, risk, environmental, and operational requirements",
        requirements=[
            "Organizational cybersecurity policy",
            "Cybersecurity roles and responsibilities",
            "Legal and regulatory requirements",
            "Governance and risk management processes"
        ]
    ),
    "PR.AC": FrameworkControl(
        framework=ComplianceFramework.NIST_CSF,
        control_id="PR.AC",
        domain="Protect",
        title="Access Control",
        description="Access to assets and associated facilities is limited to authorized users, processes, or devices",
        requirements=[
            "Identities and credentials management",
            "Physical access management",
            "Remote access management",
            "Access permissions management",
            "Network integrity protection"
        ]
    ),
    "PR.DS": FrameworkControl(
        framework=ComplianceFramework.NIST_CSF,
        control_id="PR.DS",
        domain="Protect",
        title="Data Security",
        description="Information and records are managed consistent with risk strategy",
        requirements=[
            "Data-at-rest protection",
            "Data-in-transit protection",
            "Asset disposal",
            "Capacity management",
            "Integrity checking mechanisms"
        ]
    ),
    "DE.CM": FrameworkControl(
        framework=ComplianceFramework.NIST_CSF,
        control_id="DE.CM",
        domain="Detect",
        title="Security Continuous Monitoring",
        description="The information system and assets are monitored to identify cybersecurity events",
        requirements=[
            "Network monitoring",
            "Physical environment monitoring",
            "Personnel activity monitoring",
            "Malicious code detection",
            "Unauthorized access detection"
        ]
    ),
    "RS.RP": FrameworkControl(
        framework=ComplianceFramework.NIST_CSF,
        control_id="RS.RP",
        domain="Respond",
        title="Response Planning",
        description="Response processes and procedures are executed and maintained",
        requirements=[
            "Response plan execution",
            "Response plan testing",
            "Response plan updates"
        ]
    ),
    "RC.RP": FrameworkControl(
        framework=ComplianceFramework.NIST_CSF,
        control_id="RC.RP",
        domain="Recover",
        title="Recovery Planning",
        description="Recovery processes and procedures are executed and maintained",
        requirements=[
            "Recovery plan execution",
            "Recovery plan updates",
            "Communication during recovery"
        ]
    ),
}


class PolicyMappingEngine:
    """
    AI-powered policy to compliance framework mapping engine
    Uses private LLM for intelligent analysis
    """

    def __init__(self):
        self.settings = get_settings()
        self.frameworks = {
            ComplianceFramework.NCA_ECC: NCA_ECC_CONTROLS,
            ComplianceFramework.NIST_CSF: NIST_CSF_CONTROLS,
        }

    async def analyze_policy(
        self,
        policy_id: str,
        policy_title: str,
        policy_content: str,
        statements: List[Dict[str, str]],
        target_frameworks: List[ComplianceFramework],
        user_id: Optional[str] = None
    ) -> PolicyAnalysisResult:
        """
        Analyze a policy and map to compliance frameworks

        Args:
            policy_id: Policy identifier
            policy_title: Policy title
            policy_content: Full policy content
            statements: List of policy statements
            target_frameworks: Frameworks to map against
            user_id: User performing analysis

        Returns:
            PolicyAnalysisResult with mappings and recommendations
        """
        import time
        start_time = time.time()

        mappings: List[PolicyMapping] = []
        all_gaps: List[Dict[str, Any]] = []
        all_recommendations: List[str] = []

        # Analyze each statement against each framework
        for statement in statements:
            stmt_id = statement.get("id", statement.get("code", ""))
            stmt_content = statement.get("content", "")

            for framework in target_frameworks:
                framework_controls = self.frameworks.get(framework, {})

                # Use AI to find relevant controls
                relevant_mappings = await self._map_statement_to_framework(
                    statement_id=stmt_id,
                    statement_content=stmt_content,
                    framework=framework,
                    controls=framework_controls,
                    user_id=user_id
                )

                mappings.extend(relevant_mappings)

        # Calculate coverage summary
        coverage_summary = self._calculate_coverage_summary(mappings, target_frameworks)

        # Identify gaps
        for framework in target_frameworks:
            framework_gaps = self._identify_gaps(mappings, framework)
            all_gaps.extend(framework_gaps)

        # Generate recommendations
        all_recommendations = await self._generate_recommendations(
            policy_title=policy_title,
            mappings=mappings,
            gaps=all_gaps,
            user_id=user_id
        )

        # Calculate overall compliance score
        overall_score = self._calculate_compliance_score(coverage_summary)

        processing_time = (time.time() - start_time) * 1000

        logger.info(
            "policy_analysis_complete",
            policy_id=policy_id,
            frameworks=len(target_frameworks),
            mappings=len(mappings),
            gaps=len(all_gaps),
            score=overall_score,
            processing_time_ms=processing_time
        )

        return PolicyAnalysisResult(
            policy_id=policy_id,
            policy_title=policy_title,
            total_statements=len(statements),
            mappings=mappings,
            coverage_summary=coverage_summary,
            gaps=all_gaps,
            recommendations=all_recommendations,
            overall_compliance_score=overall_score,
            analysis_timestamp=datetime.utcnow(),
            processing_time_ms=processing_time
        )

    async def _map_statement_to_framework(
        self,
        statement_id: str,
        statement_content: str,
        framework: ComplianceFramework,
        controls: Dict[str, FrameworkControl],
        user_id: Optional[str] = None
    ) -> List[PolicyMapping]:
        """Map a single statement to framework controls using AI"""

        # Build context of all controls
        controls_context = "\n".join([
            f"- {ctrl.control_id}: {ctrl.title}\n  {ctrl.description}\n  Requirements: {', '.join(ctrl.requirements)}"
            for ctrl in controls.values()
        ])

        prompt = f"""Analyze this policy statement and map it to the relevant {framework.value} controls.

POLICY STATEMENT:
{statement_content}

AVAILABLE CONTROLS:
{controls_context}

For each relevant control, provide:
1. Control ID
2. Coverage level (full/partial/minimal/none)
3. Confidence score (0.0-1.0)
4. Rationale for the mapping
5. Any gaps or missing elements
6. Recommendations to improve coverage

Return JSON array:
[{{
    "control_id": "string",
    "coverage_level": "full|partial|minimal|none",
    "confidence": 0.0-1.0,
    "rationale": "string",
    "gaps": ["string"],
    "recommendations": ["string"]
}}]

Only include controls with coverage_level != "none"."""

        try:
            response = await ollama_client.generate(
                prompt=prompt,
                system_prompt=SYSTEM_PROMPTS["policy_mapper"],
                user_id=user_id,
                temperature=0.1  # Low temperature for consistency
            )

            # Parse JSON from response
            json_match = re.search(r'\[[\s\S]*\]', response.content)
            if json_match:
                mapping_data = json.loads(json_match.group())
            else:
                logger.warning("no_json_in_response", statement_id=statement_id)
                return []

            # Convert to PolicyMapping objects
            mappings = []
            for item in mapping_data:
                control_id = item.get("control_id", "")
                if control_id in controls:
                    mappings.append(PolicyMapping(
                        policy_id="",  # Set by caller
                        statement_id=statement_id,
                        statement_content=statement_content,
                        control=controls[control_id],
                        coverage_level=CoverageLevel(item.get("coverage_level", "partial")),
                        confidence_score=float(item.get("confidence", 0.5)),
                        rationale=item.get("rationale", ""),
                        gaps=item.get("gaps", []),
                        recommendations=item.get("recommendations", [])
                    ))

            return mappings

        except Exception as e:
            logger.error("mapping_failed", statement_id=statement_id, error=str(e))
            return []

    def _calculate_coverage_summary(
        self,
        mappings: List[PolicyMapping],
        frameworks: List[ComplianceFramework]
    ) -> Dict[ComplianceFramework, Dict[str, int]]:
        """Calculate coverage summary per framework"""
        summary = {}

        for framework in frameworks:
            framework_mappings = [m for m in mappings if m.control.framework == framework]
            framework_controls = self.frameworks.get(framework, {})

            covered_controls = set(m.control.control_id for m in framework_mappings)

            summary[framework] = {
                "total_controls": len(framework_controls),
                "covered": len(covered_controls),
                "full_coverage": len([m for m in framework_mappings if m.coverage_level == CoverageLevel.FULL]),
                "partial_coverage": len([m for m in framework_mappings if m.coverage_level == CoverageLevel.PARTIAL]),
                "minimal_coverage": len([m for m in framework_mappings if m.coverage_level == CoverageLevel.MINIMAL]),
                "not_covered": len(framework_controls) - len(covered_controls),
            }

        return summary

    def _identify_gaps(
        self,
        mappings: List[PolicyMapping],
        framework: ComplianceFramework
    ) -> List[Dict[str, Any]]:
        """Identify coverage gaps for a framework"""
        gaps = []

        framework_controls = self.frameworks.get(framework, {})
        covered_controls = set(m.control.control_id for m in mappings if m.control.framework == framework)

        # Uncovered controls
        for control_id, control in framework_controls.items():
            if control_id not in covered_controls:
                gaps.append({
                    "type": "uncovered_control",
                    "framework": framework.value,
                    "control_id": control_id,
                    "control_title": control.title,
                    "severity": "high",
                    "description": f"Control {control_id} ({control.title}) has no policy coverage"
                })

        # Partial coverage gaps
        partial_mappings = [
            m for m in mappings
            if m.control.framework == framework and m.coverage_level in [CoverageLevel.PARTIAL, CoverageLevel.MINIMAL]
        ]

        for mapping in partial_mappings:
            for gap in mapping.gaps:
                gaps.append({
                    "type": "partial_coverage",
                    "framework": framework.value,
                    "control_id": mapping.control.control_id,
                    "control_title": mapping.control.title,
                    "severity": "medium" if mapping.coverage_level == CoverageLevel.PARTIAL else "high",
                    "description": gap
                })

        return gaps

    async def _generate_recommendations(
        self,
        policy_title: str,
        mappings: List[PolicyMapping],
        gaps: List[Dict[str, Any]],
        user_id: Optional[str] = None
    ) -> List[str]:
        """Generate AI-powered recommendations"""

        if not gaps:
            return ["Policy has comprehensive compliance coverage. Continue regular reviews."]

        gaps_summary = "\n".join([
            f"- {g['framework']} {g['control_id']}: {g['description']} (Severity: {g['severity']})"
            for g in gaps[:10]  # Top 10 gaps
        ])

        prompt = f"""Based on the compliance gaps identified for policy "{policy_title}", provide specific recommendations.

IDENTIFIED GAPS:
{gaps_summary}

Provide 5-7 actionable recommendations to address these gaps. Each recommendation should:
1. Be specific and actionable
2. Reference the relevant controls
3. Include priority level
4. Be achievable within reasonable timeframe

Return as JSON array of strings."""

        try:
            response = await ollama_client.generate(
                prompt=prompt,
                system_prompt=SYSTEM_PROMPTS["policy_mapper"],
                user_id=user_id
            )

            json_match = re.search(r'\[[\s\S]*\]', response.content)
            if json_match:
                return json.loads(json_match.group())
            else:
                # Fallback to parsing recommendations from text
                return [line.strip() for line in response.content.split('\n') if line.strip() and line.strip()[0].isdigit()]

        except Exception as e:
            logger.error("recommendation_generation_failed", error=str(e))
            return ["Unable to generate recommendations. Please review gaps manually."]

    def _calculate_compliance_score(
        self,
        coverage_summary: Dict[ComplianceFramework, Dict[str, int]]
    ) -> float:
        """Calculate overall compliance score"""
        if not coverage_summary:
            return 0.0

        total_score = 0.0
        total_weight = 0

        for framework, summary in coverage_summary.items():
            total_controls = summary.get("total_controls", 1)
            full = summary.get("full_coverage", 0)
            partial = summary.get("partial_coverage", 0)
            minimal = summary.get("minimal_coverage", 0)

            # Weighted scoring
            framework_score = (full * 1.0 + partial * 0.6 + minimal * 0.3) / total_controls
            total_score += framework_score
            total_weight += 1

        return round(total_score / total_weight * 100, 1) if total_weight > 0 else 0.0


# Singleton instance
policy_mapper = PolicyMappingEngine()
