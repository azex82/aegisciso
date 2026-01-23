"""
Sovereign AI - RAG Engine
Retrieval Augmented Generation using local embeddings and ChromaDB
ALL DATA STAYS LOCAL - No external vector databases or embedding APIs
"""

import asyncio
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import hashlib
import json

import chromadb
from sentence_transformers import SentenceTransformer
import structlog

from config.settings import get_settings
from llm import get_llm_client, SYSTEM_PROMPTS, LLMMessage, LLMRole

logger = structlog.get_logger()
settings = get_settings()


class DocumentType(str, Enum):
    """Types of documents in the RAG system"""
    POLICY = "policy"
    FRAMEWORK = "framework"
    CONTROL = "control"
    RISK = "risk"
    EVIDENCE = "evidence"
    THREAT_INTEL = "threat_intel"
    INCIDENT = "incident"
    AUDIT_FINDING = "audit_finding"


class MatchStrength(str, Enum):
    """
    Tiered similarity classification for control matching
    Based on ISO 27001 & ECC-2:2024 ML Pipeline thresholds
    """
    STRONG = "strong"      # ≥ 0.85: Controls are likely equivalent
    MODERATE = "moderate"  # 0.70-0.84: Related, similar security concepts
    WEAK = "weak"          # 0.50-0.69: Conceptually related, different aspects
    NONE = "none"          # < 0.50: Unrelated or unique to one framework


@dataclass
class Document:
    """Document structure for RAG"""
    id: str
    content: str
    doc_type: DocumentType
    metadata: Dict[str, Any] = field(default_factory=dict)
    embedding: Optional[List[float]] = None


@dataclass
class RetrievalResult:
    """Result from RAG retrieval"""
    document: Document
    similarity_score: float
    rank: int
    match_strength: MatchStrength = MatchStrength.NONE


@dataclass
class RAGResponse:
    """Response from RAG query"""
    answer: str
    sources: List[RetrievalResult]
    context_used: str
    confidence: float
    processing_time_ms: float
    model: str


class LocalEmbeddingModel:
    """
    Local embedding model using sentence-transformers
    NO EXTERNAL API CALLS - runs entirely on local hardware
    """

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self._model = None
        logger.info("initializing_local_embedding_model", model=model_name)

    @property
    def model(self) -> SentenceTransformer:
        """Lazy load model"""
        if self._model is None:
            self._model = SentenceTransformer(self.model_name)
            logger.info("embedding_model_loaded", model=self.model_name)
        return self._model

    def embed(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings locally"""
        embeddings = self.model.encode(
            texts,
            convert_to_numpy=True,
            show_progress_bar=False
        )
        return embeddings.tolist()

    def embed_single(self, text: str) -> List[float]:
        """Embed single text"""
        return self.embed([text])[0]


class RAGEngine:
    """
    Sovereign RAG Engine
    Uses local ChromaDB and sentence-transformers for fully local operation
    """

    def __init__(self):
        self.settings = get_settings()

        # Initialize local embedding model
        self.embedding_model = LocalEmbeddingModel(
            self.settings.rag.embedding_model
        )

        # Initialize ChromaDB (local persistent storage)
        self.chroma_client = chromadb.PersistentClient(
            path=self.settings.rag.chroma_persist_directory,
            settings=chromadb.Settings(anonymized_telemetry=False)  # CRITICAL: No telemetry
        )

        # Initialize collections
        self._init_collections()

        logger.info("rag_engine_initialized", persist_dir=self.settings.rag.chroma_persist_directory)

    def _init_collections(self):
        """Initialize ChromaDB collections"""
        self.collections = {
            "policies": self.chroma_client.get_or_create_collection(
                name=self.settings.rag.policies_collection,
                metadata={"hnsw:space": "cosine"}
            ),
            "frameworks": self.chroma_client.get_or_create_collection(
                name=self.settings.rag.frameworks_collection,
                metadata={"hnsw:space": "cosine"}
            ),
            "evidence": self.chroma_client.get_or_create_collection(
                name=self.settings.rag.evidence_collection,
                metadata={"hnsw:space": "cosine"}
            ),
            "threats": self.chroma_client.get_or_create_collection(
                name=self.settings.rag.threats_collection,
                metadata={"hnsw:space": "cosine"}
            ),
        }

    def _get_collection_for_type(self, doc_type: DocumentType):
        """Get appropriate collection for document type"""
        type_to_collection = {
            DocumentType.POLICY: "policies",
            DocumentType.FRAMEWORK: "frameworks",
            DocumentType.CONTROL: "frameworks",
            DocumentType.RISK: "evidence",
            DocumentType.EVIDENCE: "evidence",
            DocumentType.THREAT_INTEL: "threats",
            DocumentType.INCIDENT: "threats",
            DocumentType.AUDIT_FINDING: "evidence",
        }
        collection_name = type_to_collection.get(doc_type, "evidence")
        return self.collections[collection_name]

    def _classify_match_strength(self, similarity_score: float) -> MatchStrength:
        """
        Classify similarity score into tiered match strength
        Based on ISO 27001 & ECC-2:2024 ML Pipeline thresholds
        """
        if similarity_score >= self.settings.rag.strong_match_threshold:
            return MatchStrength.STRONG
        elif similarity_score >= self.settings.rag.moderate_match_threshold:
            return MatchStrength.MODERATE
        elif similarity_score >= self.settings.rag.weak_match_threshold:
            return MatchStrength.WEAK
        else:
            return MatchStrength.NONE

    def _chunk_text(self, text: str) -> List[str]:
        """Split text into chunks for embedding"""
        chunk_size = self.settings.rag.chunk_size
        chunk_overlap = self.settings.rag.chunk_overlap

        if len(text) <= chunk_size:
            return [text]

        chunks = []
        start = 0

        while start < len(text):
            end = start + chunk_size

            # Try to break at sentence boundary
            if end < len(text):
                # Look for sentence endings
                for sep in [". ", ".\n", "\n\n", "\n"]:
                    last_sep = text[start:end].rfind(sep)
                    if last_sep > chunk_size // 2:
                        end = start + last_sep + len(sep)
                        break

            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)

            start = end - chunk_overlap

        return chunks

    async def add_document(
        self,
        content: str,
        doc_type: DocumentType,
        doc_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Add document to RAG system

        Args:
            content: Document content
            doc_type: Type of document
            doc_id: Optional custom ID
            metadata: Optional metadata

        Returns:
            Document ID
        """
        # Generate ID if not provided
        if doc_id is None:
            doc_id = hashlib.sha256(content.encode()).hexdigest()[:16]

        # Chunk document
        chunks = self._chunk_text(content)

        # Generate embeddings locally
        embeddings = self.embedding_model.embed(chunks)

        # Get appropriate collection
        collection = self._get_collection_for_type(doc_type)

        # Prepare metadata
        doc_metadata = metadata or {}
        doc_metadata.update({
            "doc_type": doc_type.value,
            "added_at": datetime.utcnow().isoformat(),
            "chunk_count": len(chunks),
        })

        # Add chunks to collection
        chunk_ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
        chunk_metadatas = [
            {**doc_metadata, "chunk_index": i, "parent_id": doc_id}
            for i in range(len(chunks))
        ]

        collection.add(
            ids=chunk_ids,
            embeddings=embeddings,
            documents=chunks,
            metadatas=chunk_metadatas
        )

        logger.info(
            "document_added",
            doc_id=doc_id,
            doc_type=doc_type.value,
            chunks=len(chunks)
        )

        return doc_id

    async def retrieve(
        self,
        query: str,
        doc_types: Optional[List[DocumentType]] = None,
        top_k: Optional[int] = None,
        similarity_threshold: Optional[float] = None
    ) -> List[RetrievalResult]:
        """
        Retrieve relevant documents for query

        Args:
            query: Search query
            doc_types: Filter by document types
            top_k: Number of results to return
            similarity_threshold: Minimum similarity score

        Returns:
            List of retrieval results
        """
        top_k = top_k or self.settings.rag.top_k_results
        similarity_threshold = similarity_threshold or self.settings.rag.similarity_threshold

        # Generate query embedding locally
        query_embedding = self.embedding_model.embed_single(query)

        results = []

        # Search relevant collections
        collections_to_search = []
        if doc_types:
            for doc_type in doc_types:
                collection = self._get_collection_for_type(doc_type)
                if collection not in collections_to_search:
                    collections_to_search.append(collection)
        else:
            collections_to_search = list(self.collections.values())

        for collection in collections_to_search:
            try:
                search_results = collection.query(
                    query_embeddings=[query_embedding],
                    n_results=top_k,
                    include=["documents", "metadatas", "distances"]
                )

                if search_results and search_results["documents"]:
                    for i, (doc, metadata, distance) in enumerate(zip(
                        search_results["documents"][0],
                        search_results["metadatas"][0],
                        search_results["distances"][0]
                    )):
                        # Convert distance to similarity (cosine)
                        similarity = 1 - distance

                        if similarity >= similarity_threshold:
                            match_strength = self._classify_match_strength(similarity)
                            results.append(RetrievalResult(
                                document=Document(
                                    id=metadata.get("parent_id", "unknown"),
                                    content=doc,
                                    doc_type=DocumentType(metadata.get("doc_type", "evidence")),
                                    metadata=metadata
                                ),
                                similarity_score=similarity,
                                rank=i,
                                match_strength=match_strength
                            ))

            except Exception as e:
                logger.error("retrieval_error", collection=collection.name, error=str(e))

        # Sort by similarity and return top k
        results.sort(key=lambda x: x.similarity_score, reverse=True)
        return results[:top_k]

    async def query(
        self,
        question: str,
        doc_types: Optional[List[DocumentType]] = None,
        system_prompt_key: str = "policy_mapper",
        user_id: Optional[str] = None
    ) -> RAGResponse:
        """
        RAG query: retrieve context and generate answer

        Args:
            question: User question
            doc_types: Filter document types
            system_prompt_key: Key for system prompt
            user_id: User ID for audit

        Returns:
            RAGResponse with answer and sources
        """
        import time
        start_time = time.time()

        # Retrieve relevant documents
        retrieval_results = await self.retrieve(
            query=question,
            doc_types=doc_types,
            top_k=self.settings.rag.top_k_results
        )

        # Build context from retrieved documents
        context_parts = []
        for i, result in enumerate(retrieval_results):
            context_parts.append(
                f"[Source {i+1}] (Type: {result.document.doc_type.value}, "
                f"Match: {result.match_strength.value.upper()}, "
                f"Score: {result.similarity_score:.2f})\n"
                f"{result.document.content}"
            )

        context = "\n\n---\n\n".join(context_parts)

        # Get system prompt
        system_prompt = SYSTEM_PROMPTS.get(
            system_prompt_key,
            SYSTEM_PROMPTS["policy_mapper"]
        )

        # Augment system prompt with context
        augmented_prompt = f"""{system_prompt}

CONTEXT FROM KNOWLEDGE BASE:
{context}

Based on the above context, answer the following question.
If the context doesn't contain relevant information, say so.
Always cite your sources using [Source N] notation."""

        # Generate response using configured LLM provider
        messages = [
            LLMMessage(role=LLMRole.SYSTEM, content=augmented_prompt),
            LLMMessage(role=LLMRole.USER, content=question)
        ]

        llm_client = get_llm_client()
        llm_response = await llm_client.chat(
            messages=messages,
            user_id=user_id
        )

        processing_time = (time.time() - start_time) * 1000

        # Calculate confidence based on retrieval scores
        if retrieval_results:
            avg_similarity = sum(r.similarity_score for r in retrieval_results) / len(retrieval_results)
            confidence = min(avg_similarity * 1.2, 1.0)  # Boost slightly, cap at 1.0
        else:
            confidence = 0.3  # Low confidence without sources

        logger.info(
            "rag_query_complete",
            question_length=len(question),
            sources_found=len(retrieval_results),
            confidence=confidence,
            processing_time_ms=processing_time
        )

        return RAGResponse(
            answer=llm_response.content,
            sources=retrieval_results,
            context_used=context,
            confidence=confidence,
            processing_time_ms=processing_time,
            model=llm_response.model
        )

    async def index_policy(
        self,
        policy_id: str,
        title: str,
        content: str,
        statements: List[Dict[str, str]],
        metadata: Optional[Dict] = None
    ) -> str:
        """Index a policy document with its statements"""
        # Index main policy
        full_content = f"# {title}\n\n{content}"

        # Add statements
        for stmt in statements:
            full_content += f"\n\n## {stmt.get('code', 'Statement')}\n{stmt.get('content', '')}"

        doc_metadata = metadata or {}
        doc_metadata.update({
            "title": title,
            "statement_count": len(statements),
        })

        return await self.add_document(
            content=full_content,
            doc_type=DocumentType.POLICY,
            doc_id=policy_id,
            metadata=doc_metadata
        )

    async def index_framework_control(
        self,
        control_id: str,
        framework: str,
        code: str,
        title: str,
        description: str,
        guidance: Optional[str] = None
    ) -> str:
        """Index a framework control"""
        content = f"""# {framework} - {code}: {title}

{description}

{f"## Implementation Guidance{chr(10)}{guidance}" if guidance else ""}"""

        return await self.add_document(
            content=content,
            doc_type=DocumentType.CONTROL,
            doc_id=control_id,
            metadata={
                "framework": framework,
                "code": code,
                "title": title,
            }
        )

    async def index_threat_intel(
        self,
        threat_id: str,
        name: str,
        description: str,
        indicators: List[str],
        mitre_techniques: List[str],
        severity: str
    ) -> str:
        """Index threat intelligence"""
        content = f"""# Threat: {name}

## Description
{description}

## Indicators of Compromise
{chr(10).join(f"- {ioc}" for ioc in indicators)}

## MITRE ATT&CK Techniques
{chr(10).join(f"- {tech}" for tech in mitre_techniques)}

## Severity: {severity}"""

        return await self.add_document(
            content=content,
            doc_type=DocumentType.THREAT_INTEL,
            doc_id=threat_id,
            metadata={
                "name": name,
                "severity": severity,
                "mitre_count": len(mitre_techniques),
            }
        )

    def get_match_distribution(self, results: List[RetrievalResult]) -> Dict[str, int]:
        """
        Calculate distribution of match strengths across results
        Returns counts for Strong/Moderate/Weak/None matches
        """
        distribution = {
            MatchStrength.STRONG.value: 0,
            MatchStrength.MODERATE.value: 0,
            MatchStrength.WEAK.value: 0,
            MatchStrength.NONE.value: 0
        }
        for result in results:
            distribution[result.match_strength.value] += 1
        return distribution

    def persist(self):
        """Persist ChromaDB to disk"""
        self.chroma_client.persist()
        logger.info("rag_data_persisted")


# Singleton instance
rag_engine = RAGEngine()
