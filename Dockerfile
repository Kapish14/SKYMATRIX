# Stage 1: Build C++ binary
FROM ubuntu:22.04 AS cpp-builder
RUN apt-get update && apt-get install -y cmake g++ make && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY CMakeLists.txt .
COPY include/ include/
COPY src/ src/
COPY tools/ tools/
RUN mkdir build && cd build && cmake .. && make -j$(nproc)

# Stage 2: Build frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/web/frontend
COPY web/frontend/package.json web/frontend/package-lock.json ./
RUN npm ci
COPY web/frontend/ .
RUN npm run build

# Stage 3: Final image
FROM python:3.12-slim
WORKDIR /app

# Copy C++ binary
COPY --from=cpp-builder /app/build/skymatrix /app/build/skymatrix
RUN chmod +x /app/build/skymatrix

# Copy test images
COPY test_images/ /app/test_images/

# Copy backend
COPY web/backend/main.py /app/web/backend/main.py
COPY web/backend/requirements.txt /app/web/backend/requirements.txt

# Copy built frontend
COPY --from=frontend-builder /app/web/frontend/dist /app/web/frontend/dist

# Install Python dependencies
RUN pip install --no-cache-dir -r /app/web/backend/requirements.txt numpy Pillow

# Create upload/output dirs
RUN mkdir -p /app/web/backend/uploads /app/web/backend/outputs

EXPOSE 8000
CMD ["uvicorn", "web.backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
