"""
Sovereign AI - SOC-CMM Evidence Analyzer
AI-powered Security Operations Center Capability Maturity Assessment
"""

import asyncio
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import json
import re

import structlog

from config.settings import get_settings
from llm.ollama_client import ollama_client, SYSTEM_PROMPTS, LLMMessage, LLMRole

logger = structlog.get_logger()
settings = get_settings()


class SOCCMMDomain(str, Enum):
    """SOC-CMM Assessment Domains"""
    BUSINESS = "Business"
    PEOPLE = "People"
    PROCESS = "Process"
    TECHNOLOGY = "Technology"
    SERVICES = "Services"


class MaturityLevel(int, Enum):
    """SOC-CMM Maturity Levels"""
    INITIAL = 1          # Ad-hoc, reactive
    MANAGED = 2          # Documented, repeatable
    DEFINED = 3          # Standardized, proactive
    QUANTITATIVE = 4     # Measured, optimized
    OPTIMIZING = 5       # Continuous improvement


@dataclass
class DomainAssessment:
    """Assessment result for a SOC-CMM domain"""
    domain: SOCCMMDomain
    current_level: MaturityLevel
    target_level: MaturityLevel
    score: float  # 0.0 - 5.0
    strengths: List[str]
    weaknesses: List[str]
    evidence_references: List[str]
    improvement_actions: List[Dict[str, Any]]


@dataclass
class SOCCMMAssessment:
    """Complete SOC-CMM Assessment Result"""
    assessment_id: str
    organization: str
    assessment_date: datetime
    domain_assessments: List[DomainAssessment]
    overall_maturity: MaturityLevel
    overall_score: float
    executive_summary: str
    priority_improvements: List[Dict[str, Any]]
    roadmap: List[Dict[str, Any]]
    processing_time_ms: float


@dataclass
class Evidence:
    """Evidence artifact for assessment"""
    id: str
    title: str
    description: str
    domain: SOCCMMDomain
    content: str
    artifact_type: str  # document, screenshot, log, etc.
    uploaded_at: datetime


# SOC-CMM Domain Criteria
DOMAIN_CRITERIA = {
    SOCCMMDomain.BUSINESS: {
        "description": "Alignment of SOC with business objectives, governance, and risk management",
        "level_criteria": {
            MaturityLevel.INITIAL: [
                "No formal SOC charter or mandate",
                "Reactive security approach",
                "No defined metrics or KPIs"
            ],
            MaturityLevel.MANAGED: [
                "SOC charter exists",
                "Basic metrics tracked",
                "Some alignment with business risk"
            ],
            MaturityLevel.DEFINED: [
                "Clear SOC objectives aligned with business",
                "Comprehensive KPI framework",
                "Regular executive reporting"
            ],
            MaturityLevel.QUANTITATIVE: [
                "Metrics-driven decision making",
                "ROI measurement for security investments",
                "Benchmarking against industry"
            ],
            MaturityLevel.OPTIMIZING: [
                "Continuous strategic alignment",
                "Predictive risk analytics",
                "Security enables business innovation"
            ]
        }
    },
    SOCCMMDomain.PEOPLE: {
        "description": "SOC staffing, skills, training, and organizational structure",
        "level_criteria": {
            MaturityLevel.INITIAL: [
                "Inadequate staffing",
                "No defined roles",
                "Ad-hoc training"
            ],
            MaturityLevel.MANAGED: [
                "Defined SOC roles",
                "Basic training program",
                "24x5 coverage"
            ],
            MaturityLevel.DEFINED: [
                "Comprehensive job descriptions",
                "Career development paths",
                "24x7 coverage",
                "Cross-training program"
            ],
            MaturityLevel.QUANTITATIVE: [
                "Skills matrix and gap analysis",
                "Performance metrics per analyst",
                "Retention programs"
            ],
            MaturityLevel.OPTIMIZING: [
                "Industry-leading talent",
                "Knowledge management system",
                "Innovation culture"
            ]
        }
    },
    SOCCMMDomain.PROCESS: {
        "description": "SOC procedures, playbooks, and operational workflows",
        "level_criteria": {
            MaturityLevel.INITIAL: [
                "No documented processes",
                "Inconsistent handling",
                "No escalation procedures"
            ],
            MaturityLevel.MANAGED: [
                "Basic runbooks exist",
                "Incident handling documented",
                "Defined escalation matrix"
            ],
            MaturityLevel.DEFINED: [
                "Comprehensive playbooks",
                "Standardized triage process",
                "Regular process reviews"
            ],
            MaturityLevel.QUANTITATIVE: [
                "Process metrics (MTTD, MTTR)",
                "Automation of routine tasks",
                "SLA compliance tracking"
            ],
            MaturityLevel.OPTIMIZING: [
                "Continuous process improvement",
                "ML-driven process optimization",
                "Industry best practices adoption"
            ]
        }
    },
    SOCCMMDomain.TECHNOLOGY: {
        "description": "SOC tools, platforms, and technical capabilities",
        "level_criteria": {
            MaturityLevel.INITIAL: [
                "Basic security tools",
                "No centralized logging",
                "Manual analysis"
            ],
            MaturityLevel.MANAGED: [
                "SIEM deployed",
                "Centralized log management",
                "Basic correlation rules"
            ],
            MaturityLevel.DEFINED: [
                "Integrated tool stack",
                "SOAR capabilities",
                "Threat intelligence feeds"
            ],
            MaturityLevel.QUANTITATIVE: [
                "Advanced analytics",
                "Automated response",
                "Full visibility across environment"
            ],
            MaturityLevel.OPTIMIZING: [
                "AI/ML-powered detection",
                "Predictive capabilities",
                "Cutting-edge technology adoption"
            ]
        }
    },
    SOCCMMDomain.SERVICES: {
        "description": "Services delivered by SOC to the organization",
        "level_criteria": {
            MaturityLevel.INITIAL: [
                "Basic monitoring only",
                "Reactive response",
                "No threat hunting"
            ],
            MaturityLevel.MANAGED: [
                "24x7 monitoring",
                "Incident response",
                "Basic vulnerability management"
            ],
            MaturityLevel.DEFINED: [
                "Proactive threat hunting",
                "Threat intelligence",
                "Security awareness support"
            ],
            MaturityLevel.QUANTITATIVE: [
                "Measured service levels",
                "Risk-based prioritization",
                "Red team/purple team exercises"
            ],
            MaturityLevel.OPTIMIZING: [
                "Predictive threat analysis",
                "Business-integrated security",
                "Innovation lab capabilities"
            ]
        }
    }
}


class SOCCMMAnalyzer:
    """
    AI-powered SOC-CMM Evidence Analyzer
    Assesses security operations maturity based on provided evidence
    """

    def __init__(self):
        self.settings = get_settings()
        self.domain_criteria = DOMAIN_CRITERIA

    async def analyze_evidence(
        self,
        evidence_list: List[Evidence],
        organization: str,
        target_maturity: MaturityLevel = MaturityLevel.DEFINED,
        user_id: Optional[str] = None
    ) -> SOCCMMAssessment:
        """
        Analyze evidence and produce SOC-CMM assessment

        Args:
            evidence_list: List of evidence artifacts
            organization: Organization name
            target_maturity: Target maturity level
            user_id: User performing assessment

        Returns:
            Complete SOC-CMM assessment
        """
        import time
        import hashlib
        start_time = time.time()

        assessment_id = hashlib.sha256(
            f"{organization}{datetime.utcnow().isoformat()}".encode()
        ).hexdigest()[:16]

        # Group evidence by domain
        domain_evidence = self._group_evidence_by_domain(evidence_list)

        # Assess each domain
        domain_assessments = []
        for domain in SOCCMMDomain:
            assessment = await self._assess_domain(
                domain=domain,
                evidence=domain_evidence.get(domain, []),
                target_level=target_maturity,
                user_id=user_id
            )
            domain_assessments.append(assessment)

        # Calculate overall maturity
        overall_score = sum(a.score for a in domain_assessments) / len(domain_assessments)
        overall_maturity = self._score_to_level(overall_score)

        # Generate executive summary
        executive_summary = await self._generate_executive_summary(
            organization=organization,
            domain_assessments=domain_assessments,
            overall_score=overall_score,
            user_id=user_id
        )

        # Generate priority improvements
        priority_improvements = self._identify_priority_improvements(
            domain_assessments=domain_assessments,
            target_maturity=target_maturity
        )

        # Generate roadmap
        roadmap = await self._generate_roadmap(
            domain_assessments=domain_assessments,
            target_maturity=target_maturity,
            user_id=user_id
        )

        processing_time = (time.time() - start_time) * 1000

        logger.info(
            "soc_cmm_assessment_complete",
            assessment_id=assessment_id,
            organization=organization,
            overall_score=overall_score,
            overall_maturity=overall_maturity.name,
            processing_time_ms=processing_time
        )

        return SOCCMMAssessment(
            assessment_id=assessment_id,
            organization=organization,
            assessment_date=datetime.utcnow(),
            domain_assessments=domain_assessments,
            overall_maturity=overall_maturity,
            overall_score=round(overall_score, 2),
            executive_summary=executive_summary,
            priority_improvements=priority_improvements,
            roadmap=roadmap,
            processing_time_ms=processing_time
        )

    def _group_evidence_by_domain(
        self,
        evidence_list: List[Evidence]
    ) -> Dict[SOCCMMDomain, List[Evidence]]:
        """Group evidence by SOC-CMM domain"""
        grouped = {domain: [] for domain in SOCCMMDomain}
        for evidence in evidence_list:
            grouped[evidence.domain].append(evidence)
        return grouped

    async def _assess_domain(
        self,
        domain: SOCCMMDomain,
        evidence: List[Evidence],
        target_level: MaturityLevel,
        user_id: Optional[str] = None
    ) -> DomainAssessment:
        """Assess a single SOC-CMM domain"""

        criteria = self.domain_criteria.get(domain, {})
        level_criteria = criteria.get("level_criteria", {})

        # Build evidence summary
        evidence_summary = "\n".join([
            f"- {e.title}: {e.description}\n  Content: {e.content[:500]}..."
            for e in evidence
        ]) if evidence else "No evidence provided for this domain."

        # Build criteria context
        criteria_context = "\n".join([
            f"Level {level.value} ({level.name}):\n" + "\n".join([f"  - {c}" for c in criteria_list])
            for level, criteria_list in level_criteria.items()
        ])

        prompt = f"""Assess the SOC-CMM maturity for domain: {domain.value}

DOMAIN DESCRIPTION:
{criteria.get('description', '')}

MATURITY LEVEL CRITERIA:
{criteria_context}

EVIDENCE PROVIDED:
{evidence_summary}

Based on the evidence, determine:
1. Current maturity level (1-5)
2. Score (0.0-5.0, can be decimal like 2.5)
3. Key strengths demonstrated
4. Weaknesses or gaps
5. Specific improvement actions to reach Level {target_level.value}

Return JSON:
{{
    "current_level": 1-5,
    "score": 0.0-5.0,
    "strengths": ["string"],
    "weaknesses": ["string"],
    "improvement_actions": [
        {{"action": "string", "priority": "high|medium|low", "effort": "string"}}
    ]
}}"""

        try:
            response = await ollama_client.generate(
                prompt=prompt,
                system_prompt=SYSTEM_PROMPTS["soc_cmm_analyst"],
                user_id=user_id,
                temperature=0.1
            )

            json_match = re.search(r'\{[\s\S]*\}', response.content)
            if json_match:
                data = json.loads(json_match.group())
            else:
                # Default assessment if parsing fails
                data = {
                    "current_level": 1 if not evidence else 2,
                    "score": 1.0 if not evidence else 2.0,
                    "strengths": ["Assessment requires more evidence"],
                    "weaknesses": ["Insufficient evidence for comprehensive assessment"],
                    "improvement_actions": []
                }

            return DomainAssessment(
                domain=domain,
                current_level=MaturityLevel(data.get("current_level", 1)),
                target_level=target_level,
                score=float(data.get("score", 1.0)),
                strengths=data.get("strengths", []),
                weaknesses=data.get("weaknesses", []),
                evidence_references=[e.id for e in evidence],
                improvement_actions=data.get("improvement_actions", [])
            )

        except Exception as e:
            logger.error("domain_assessment_failed", domain=domain.value, error=str(e))
            return DomainAssessment(
                domain=domain,
                current_level=MaturityLevel.INITIAL,
                target_level=target_level,
                score=1.0,
                strengths=[],
                weaknesses=["Assessment failed due to error"],
                evidence_references=[],
                improvement_actions=[]
            )

    def _score_to_level(self, score: float) -> MaturityLevel:
        """Convert numeric score to maturity level"""
        if score >= 4.5:
            return MaturityLevel.OPTIMIZING
        elif score >= 3.5:
            return MaturityLevel.QUANTITATIVE
        elif score >= 2.5:
            return MaturityLevel.DEFINED
        elif score >= 1.5:
            return MaturityLevel.MANAGED
        else:
            return MaturityLevel.INITIAL

    async def _generate_executive_summary(
        self,
        organization: str,
        domain_assessments: List[DomainAssessment],
        overall_score: float,
        user_id: Optional[str] = None
    ) -> str:
        """Generate executive summary of assessment"""

        domain_summary = "\n".join([
            f"- {a.domain.value}: Level {a.current_level.value} ({a.current_level.name}), Score: {a.score:.1f}"
            for a in domain_assessments
        ])

        prompt = f"""Generate an executive summary for the SOC-CMM assessment of {organization}.

ASSESSMENT RESULTS:
{domain_summary}
Overall Score: {overall_score:.1f}/5.0

Write a 2-3 paragraph executive summary that:
1. Summarizes current maturity state
2. Highlights key strengths and concerns
3. Provides high-level recommendations

Use professional language suitable for CISO/executive audience."""

        try:
            response = await ollama_client.generate(
                prompt=prompt,
                system_prompt=SYSTEM_PROMPTS["executive_reporter"],
                user_id=user_id
            )
            return response.content

        except Exception as e:
            logger.error("executive_summary_failed", error=str(e))
            return f"Assessment completed for {organization}. Overall maturity score: {overall_score:.1f}/5.0"

    def _identify_priority_improvements(
        self,
        domain_assessments: List[DomainAssessment],
        target_maturity: MaturityLevel
    ) -> List[Dict[str, Any]]:
        """Identify highest priority improvements"""

        all_improvements = []

        for assessment in domain_assessments:
            gap = target_maturity.value - assessment.current_level.value
            if gap > 0:
                for action in assessment.improvement_actions:
                    all_improvements.append({
                        "domain": assessment.domain.value,
                        "action": action.get("action", ""),
                        "priority": action.get("priority", "medium"),
                        "effort": action.get("effort", "medium"),
                        "gap": gap,
                        "current_level": assessment.current_level.name,
                        "target_level": target_maturity.name
                    })

        # Sort by priority and gap
        priority_order = {"high": 0, "medium": 1, "low": 2}
        all_improvements.sort(
            key=lambda x: (priority_order.get(x["priority"], 1), -x["gap"])
        )

        return all_improvements[:10]  # Top 10

    async def _generate_roadmap(
        self,
        domain_assessments: List[DomainAssessment],
        target_maturity: MaturityLevel,
        user_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Generate improvement roadmap"""

        # Simple phased approach
        roadmap = []

        # Phase 1: Quick wins (0-3 months)
        phase1_actions = []
        for assessment in domain_assessments:
            if assessment.current_level.value < target_maturity.value:
                for action in assessment.improvement_actions:
                    if action.get("effort", "").lower() in ["low", "quick"]:
                        phase1_actions.append({
                            "domain": assessment.domain.value,
                            "action": action.get("action", "")
                        })

        if phase1_actions:
            roadmap.append({
                "phase": 1,
                "name": "Quick Wins",
                "duration": "0-3 months",
                "actions": phase1_actions[:5]
            })

        # Phase 2: Foundation (3-6 months)
        phase2_actions = []
        for assessment in domain_assessments:
            if assessment.current_level.value < 3:  # Below Defined
                for action in assessment.improvement_actions:
                    if action.get("priority", "").lower() == "high":
                        phase2_actions.append({
                            "domain": assessment.domain.value,
                            "action": action.get("action", "")
                        })

        if phase2_actions:
            roadmap.append({
                "phase": 2,
                "name": "Foundation Building",
                "duration": "3-6 months",
                "actions": phase2_actions[:5]
            })

        # Phase 3: Optimization (6-12 months)
        roadmap.append({
            "phase": 3,
            "name": "Optimization",
            "duration": "6-12 months",
            "actions": [
                {"domain": "All", "action": "Implement metrics-driven improvements"},
                {"domain": "All", "action": "Achieve target maturity across all domains"}
            ]
        })

        return roadmap


# Singleton instance
soc_cmm_analyzer = SOCCMMAnalyzer()
