# ==========================================
# 1. CONFIGURATION SECTION
# Define all versions in one place for easy management
# ==========================================
ARG NODE_VERSION=22-bookworm
ARG DENO_VERSION=2.9.6
ARG PLAYWRIGHT_VERSION=v1.63.0-noble
ARG DAGGER_VERSION=v0.21.9

# ==========================================
# 2. SOURCE STAGES ( The "Getter" Pattern )
# We pull these images solely to alias them.
# This separates "fetching" from "installing".
# ==========================================
FROM denoland/deno:bin-${DENO_VERSION} AS source-deno
FROM mcr.microsoft.com/playwright:${PLAYWRIGHT_VERSION} AS source-playwright
FROM registry.dagger.io/engine:${DAGGER_VERSION} AS source-dagger

# ==========================================
# 3. FINAL STAGE
# ==========================================
FROM mcr.microsoft.com/devcontainers/typescript-node:${NODE_VERSION}

# --- Install Deno ---
# We copy from the alias 'source-deno', not the external URL
COPY --from=source-deno /deno /usr/local/bin/deno

# --- Install Playwright ---
COPY --from=source-playwright /ms-playwright /ms-playwright

# --- Install Dagger ---
COPY --from=source-dagger /usr/local/bin/dagger /usr/local/bin/dagger

# --- Final Configuration ---
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# --- Install Playwright Dependencies ---
RUN apt-get update && \
    npx playwright@${PLAYWRIGHT_VERSION} install-deps && \
    rm -rf /var/lib/apt/lists/*

# --- Setup Playwright Browser Path ---
RUN mkdir -p $PLAYWRIGHT_BROWSERS_PATH \
    && chown -R node:node $PLAYWRIGHT_BROWSERS_PATH