#!/usr/bin/env python3
"""
Script to index organization cybersecurity policies into the RAG system.
"""

import os
import sys
import json
import requests
from pathlib import Path

# Configuration
API_BASE_URL = "http://localhost:8000"
POLICIES_DIR = Path(__file__).parent.parent / "data" / "policies"

# Headers for authentication (using internal header method)
HEADERS = {
    "Content-Type": "application/json",
    "X-User-Id": "system-indexer",
    "X-User-Email": "admin@aegisciso.local",
    "X-User-Role": "ADMIN"
}


def extract_metadata(content: str, filename: str) -> dict:
    """Extract metadata from policy document."""
    metadata = {
        "source": "organization_policy",
        "filename": filename,
    }

    # Extract document ID
    for line in content.split('\n'):
        if line.startswith('**Document ID:**'):
            metadata['document_id'] = line.replace('**Document ID:**', '').strip()
        elif line.startswith('**Version:**'):
            metadata['version'] = line.replace('**Version:**', '').strip()
        elif line.startswith('**Classification:**'):
            metadata['classification'] = line.replace('**Classification:**', '').strip()
        elif line.startswith('**Owner:**'):
            metadata['owner'] = line.replace('**Owner:**', '').strip()
        elif line.startswith('# '):
            metadata['title'] = line.replace('# ', '').strip()

    return metadata


def index_policy(file_path: Path) -> bool:
    """Index a single policy file into the RAG system."""
    print(f"Indexing: {file_path.name}")

    # Read the policy content
    with open(file_path, 'r') as f:
        content = f.read()

    # Extract metadata
    metadata = extract_metadata(content, file_path.name)

    # Prepare the request payload
    payload = {
        "content": content,
        "doc_type": "policy",
        "doc_id": metadata.get('document_id', file_path.stem),
        "metadata": metadata
    }

    try:
        response = requests.post(
            f"{API_BASE_URL}/api/v1/documents/index",
            headers=HEADERS,
            json=payload,
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            print(f"  ✓ Indexed successfully: {result.get('doc_id')}")
            return True
        else:
            print(f"  ✗ Failed to index: {response.status_code} - {response.text}")
            return False

    except requests.exceptions.RequestException as e:
        print(f"  ✗ Error indexing: {str(e)}")
        return False


def main():
    """Main function to index all policies."""
    print("=" * 60)
    print("AegisCISO Policy Indexer")
    print("=" * 60)
    print()

    # Check if API is available
    try:
        health = requests.get(f"{API_BASE_URL}/health", timeout=5)
        if health.status_code != 200:
            print("ERROR: API is not healthy")
            sys.exit(1)
        print(f"API Status: {health.json().get('status')}")
    except requests.exceptions.RequestException as e:
        print(f"ERROR: Cannot connect to API at {API_BASE_URL}")
        print(f"  {str(e)}")
        sys.exit(1)

    print()

    # Get all policy files
    if not POLICIES_DIR.exists():
        print(f"ERROR: Policies directory not found: {POLICIES_DIR}")
        sys.exit(1)

    policy_files = sorted(POLICIES_DIR.glob("*.md"))

    if not policy_files:
        print("No policy files found to index.")
        sys.exit(0)

    print(f"Found {len(policy_files)} policy files to index")
    print()

    # Index each policy
    success_count = 0
    fail_count = 0

    for policy_file in policy_files:
        if index_policy(policy_file):
            success_count += 1
        else:
            fail_count += 1

    # Summary
    print()
    print("=" * 60)
    print("Indexing Complete")
    print("=" * 60)
    print(f"  Successful: {success_count}")
    print(f"  Failed: {fail_count}")
    print(f"  Total: {len(policy_files)}")

    if fail_count > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
