# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy backend code
COPY backend/ /app/backend/

# Create virtual environment and install dependencies
RUN cd backend && \
    python -m venv /opt/venv && \
    /opt/venv/bin/pip install --upgrade pip && \
    /opt/venv/bin/pip install -r requirements.txt

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PATH="/opt/venv/bin:$PATH"

# Expose port
EXPOSE 8000

# Health check managed by railway.toml

# Start command - Direct uvicorn without blocking init script
CMD ["/opt/venv/bin/uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
