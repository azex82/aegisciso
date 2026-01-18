import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// ============================================================================
// RAG DOCUMENT MANAGEMENT API
// Add, list, and manage documents for AI context
// ============================================================================

const SOVEREIGN_AI_URL = process.env.SOVEREIGN_AI_URL || 'http://localhost:8000';

// In-memory document store (for when sovereign-ai is not available)
// In production, this should be persisted to a database
interface Document {
  id: string;
  content: string;
  doc_type: string;
  title?: string;
  metadata?: Record<string, any>;
  created_at: string;
  created_by: string;
}

const documentStore = new Map<string, Document>();

// Allowed roles for document management
const ALLOWED_ROLES = ['CISO', 'ADMIN', 'GRC_ANALYST'];

function validateLocalEndpoint(url: string): boolean {
  try {
    const parsed = new URL(url);
    const allowedHosts = ['localhost', '127.0.0.1', '0.0.0.0', 'sovereign-ai'];
    return allowedHosts.includes(parsed.hostname);
  } catch {
    return false;
  }
}

function generateDocId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// GET - List documents
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!ALLOWED_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Try sovereign-ai backend first
    if (validateLocalEndpoint(SOVEREIGN_AI_URL)) {
      try {
        const response = await fetch(`${SOVEREIGN_AI_URL}/api/v1/documents/list`, {
          method: 'GET',
          headers: {
            'X-User-Id': (session.user as any).id || '',
            'X-User-Email': session.user.email || '',
            'X-User-Role': userRole,
          },
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        }
      } catch {
        // Fall through to local store
      }
    }

    // Return from local store
    const documents = Array.from(documentStore.values()).map(doc => ({
      id: doc.id,
      doc_type: doc.doc_type,
      title: doc.title || doc.id,
      created_at: doc.created_at,
      created_by: doc.created_by,
      content_preview: doc.content.substring(0, 200) + '...',
    }));

    return NextResponse.json({
      documents,
      total: documents.length,
      storage: 'local',
    });

  } catch (error) {
    console.error('List documents error:', error);
    return NextResponse.json({ error: 'Failed to list documents' }, { status: 500 });
  }
}

// ============================================================================
// POST - Add document to RAG
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!ALLOWED_ROLES.includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { content, doc_type, title, metadata } = body;

    // Validate input
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (content.length < 10) {
      return NextResponse.json({ error: 'Content too short (minimum 10 characters)' }, { status: 400 });
    }

    if (content.length > 100000) {
      return NextResponse.json({ error: 'Content too long (maximum 100,000 characters)' }, { status: 400 });
    }

    const validDocTypes = ['policy', 'framework', 'control', 'risk', 'evidence', 'threat_intel'];
    if (!doc_type || !validDocTypes.includes(doc_type)) {
      return NextResponse.json({
        error: `Invalid doc_type. Must be one of: ${validDocTypes.join(', ')}`
      }, { status: 400 });
    }

    const docId = generateDocId();

    // Try sovereign-ai backend first
    if (validateLocalEndpoint(SOVEREIGN_AI_URL)) {
      try {
        const response = await fetch(`${SOVEREIGN_AI_URL}/api/v1/documents/index`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': (session.user as any).id || '',
            'X-User-Email': session.user.email || '',
            'X-User-Role': userRole,
          },
          body: JSON.stringify({
            content,
            doc_type,
            doc_id: docId,
            metadata: {
              ...metadata,
              title,
              uploaded_by: session.user.email,
            },
          }),
          signal: AbortSignal.timeout(30000),
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json({
            success: true,
            doc_id: data.doc_id,
            message: 'Document indexed successfully',
            storage: 'sovereign-ai',
          });
        }
      } catch {
        // Fall through to local store
      }
    }

    // Store locally
    const document: Document = {
      id: docId,
      content,
      doc_type,
      title,
      metadata,
      created_at: new Date().toISOString(),
      created_by: session.user.email || 'unknown',
    };

    documentStore.set(docId, document);

    console.log(`[RAG] Document indexed locally: ${docId} (${doc_type})`);

    return NextResponse.json({
      success: true,
      doc_id: docId,
      message: 'Document stored locally (will be indexed when sovereign-ai is available)',
      storage: 'local',
    });

  } catch (error) {
    console.error('Index document error:', error);
    return NextResponse.json({ error: 'Failed to index document' }, { status: 500 });
  }
}

// ============================================================================
// DELETE - Remove document from RAG
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    if (!['CISO', 'ADMIN'].includes(userRole)) {
      return NextResponse.json({ error: 'Only CISO and ADMIN can delete documents' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const docId = searchParams.get('id');

    if (!docId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Try sovereign-ai backend first
    if (validateLocalEndpoint(SOVEREIGN_AI_URL)) {
      try {
        const response = await fetch(`${SOVEREIGN_AI_URL}/api/v1/documents/${docId}`, {
          method: 'DELETE',
          headers: {
            'X-User-Id': (session.user as any).id || '',
            'X-User-Email': session.user.email || '',
            'X-User-Role': userRole,
          },
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          // Also remove from local store if exists
          documentStore.delete(docId);
          return NextResponse.json({
            success: true,
            message: 'Document deleted successfully',
          });
        }
      } catch {
        // Fall through to local deletion
      }
    }

    // Delete from local store
    if (documentStore.has(docId)) {
      documentStore.delete(docId);
      return NextResponse.json({
        success: true,
        message: 'Document deleted from local store',
      });
    }

    return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
