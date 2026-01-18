/**
 * Sovereign AI Client
 * Connects Next.js frontend to the private AI backend
 * ALL requests go through Next.js API routes to local FastAPI - NEVER external APIs
 */

// Use Next.js API routes as proxy for better security
const API_BASE_URL = typeof window !== 'undefined' ? '/api/ai' : 'http://localhost:8000/api/v1/ai';
const SOVEREIGN_AI_URL = process.env.SOVEREIGN_AI_URL || 'http://localhost:8000';

interface AIQueryRequest {
  query: string;
  context_type?: 'general' | 'policy' | 'risk' | 'compliance';
  include_sources?: boolean;
}

interface AIQueryResponse {
  answer: string;
  sources: Array<{
    id: string;
    type: string;
    relevance: number;
    excerpt: string;
  }>;
  confidence: number;
  model: string;
  processing_time_ms: number;
  filtered: boolean;
}

interface PolicyMappingRequest {
  policy_id: string;
  policy_title: string;
  policy_content: string;
  statements: Array<{ id: string; content: string }>;
  frameworks: string[];
}

interface PolicyMappingResponse {
  policy_id: string;
  mappings: Array<{
    statement_id: string;
    control_id: string;
    framework: string;
    coverage: string;
    confidence: number;
    rationale: string;
  }>;
  coverage_summary: Record<string, any>;
  gaps: Array<{
    type: string;
    framework: string;
    control_id: string;
    severity: string;
    description: string;
  }>;
  recommendations: string[];
  compliance_score: number;
  processing_time_ms: number;
}

interface SOCCMMRequest {
  organization: string;
  evidence: Array<{
    id: string;
    title: string;
    description: string;
    domain: string;
    content: string;
    artifact_type: string;
  }>;
  target_maturity: number;
}

interface SOCCMMResponse {
  assessment_id: string;
  overall_maturity: string;
  overall_score: number;
  domain_assessments: Array<{
    domain: string;
    current_level: string;
    score: number;
    strengths: string[];
    weaknesses: string[];
  }>;
  executive_summary: string;
  priority_improvements: Array<any>;
  roadmap: Array<any>;
  processing_time_ms: number;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

class SovereignAIClient {
  private baseUrl: string;
  private apiBaseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string = SOVEREIGN_AI_URL) {
    this.baseUrl = baseUrl;
    // Use Next.js API routes in browser, direct connection on server
    this.apiBaseUrl = typeof window !== 'undefined' ? '/api/ai' : `${baseUrl}/api/v1/ai`;
    this.validateLocalEndpoint();
  }

  /**
   * CRITICAL: Ensure we only connect to local endpoints
   */
  private validateLocalEndpoint(): void {
    // Skip validation for relative URLs (Next.js API routes)
    if (this.baseUrl.startsWith('/')) {
      return;
    }

    const url = new URL(this.baseUrl);
    const allowedHosts = ['localhost', '127.0.0.1', '0.0.0.0', 'sovereign-ai'];

    if (!allowedHosts.includes(url.hostname)) {
      throw new Error(
        `SOVEREIGNTY VIOLATION: Attempting to connect to external endpoint: ${url.hostname}. ` +
        `Only local endpoints are allowed.`
      );
    }
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    // Determine the full URL based on endpoint type
    let url: string;
    if (endpoint.startsWith('/api/ai/')) {
      // Next.js API route (relative URL)
      url = endpoint;
    } else {
      // Direct FastAPI endpoint
      url = `${this.baseUrl}${endpoint}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Ensure cookies are sent for session auth
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || error.error || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Health check for sovereign AI backend
   */
  async healthCheck(): Promise<{
    status: string;
    version: string;
    llm_available: boolean;
    sovereignty_validated: boolean;
  }> {
    // Health check goes through Next.js proxy in browser
    const url = typeof window !== 'undefined' ? '/api/ai/health' : `${this.baseUrl}/health`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  }

  /**
   * Authenticate with sovereign AI backend
   */
  async login(email: string, password: string, mfaToken?: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    mfa_required: boolean;
  }> {
    const response = await this.request<any>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, mfa_token: mfaToken }),
    });

    if (response.access_token) {
      this.setAccessToken(response.access_token);
    }

    return response;
  }

  /**
   * Query the AI Cybersecurity Director
   */
  async query(request: AIQueryRequest): Promise<AIQueryResponse> {
    // Use Next.js API route in browser
    const endpoint = typeof window !== 'undefined' ? '/api/ai/query' : '/api/v1/ai/query';
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Multi-turn chat with AI Director
   */
  async chat(messages: ChatMessage[]): Promise<{
    response: string;
    model: string;
    tokens_used: number;
    processing_time_ms: number;
  }> {
    return this.request('/api/v1/ai/chat', {
      method: 'POST',
      body: JSON.stringify(messages),
    });
  }

  /**
   * Map policy to compliance frameworks
   */
  async mapPolicy(request: PolicyMappingRequest): Promise<PolicyMappingResponse> {
    // Use Next.js API route in browser
    const endpoint = typeof window !== 'undefined' ? '/api/ai/policy-mapping' : '/api/v1/compliance/policy-mapping';
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Perform SOC-CMM maturity assessment
   */
  async assessSOCCMM(request: SOCCMMRequest): Promise<SOCCMMResponse> {
    // Use Next.js API route in browser
    const endpoint = typeof window !== 'undefined' ? '/api/ai/soc-cmm' : '/api/v1/assessment/soc-cmm';
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Index document into RAG system
   */
  async indexDocument(
    content: string,
    docType: string,
    docId?: string,
    metadata?: Record<string, any>
  ): Promise<{ doc_id: string; status: string }> {
    return this.request('/api/v1/documents/index', {
      method: 'POST',
      body: JSON.stringify({
        content,
        doc_type: docType,
        doc_id: docId,
        metadata,
      }),
    });
  }

  /**
   * Search documents in RAG system
   */
  async searchDocuments(
    query: string,
    docType?: string,
    topK: number = 5
  ): Promise<{
    query: string;
    results: Array<{
      id: string;
      type: string;
      relevance: number;
      content: string;
    }>;
  }> {
    const params = new URLSearchParams({ query, top_k: topK.toString() });
    if (docType) params.append('doc_type', docType);

    return this.request(`/api/v1/documents/search?${params}`);
  }
}

// Singleton instance
export const sovereignAI = new SovereignAIClient();

// Export types
export type {
  AIQueryRequest,
  AIQueryResponse,
  PolicyMappingRequest,
  PolicyMappingResponse,
  SOCCMMRequest,
  SOCCMMResponse,
  ChatMessage,
};
