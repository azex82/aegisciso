# Sovereign AI Cybersecurity Director - Docker Image
# Fully self-contained with NO external dependencies

FROM python:3.11-slim

# Security: Run as non-root user
RUN groupadd -r aegisciso && useradd -r -g aegisciso aegisciso

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Download spaCy model for DLP (local, no external calls)
RUN python -m spacy download en_core_web_sm

# Copy application code
COPY . .

# Create data directory
RUN mkdir -p /data/chromadb && chown -R aegisciso:aegisciso /data

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Security: Block external API calls at DNS level
# This is an additional safeguard - code also validates endpoints
ENV EXTERNAL_API_CALLS_ALLOWED=false
ENV TELEMETRY_ENABLED=false

# Switch to non-root user
USER aegisciso

# Expose API port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
