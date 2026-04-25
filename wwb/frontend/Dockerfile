# Stage 1: Build the Vue application
FROM node:lts-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
# We copy only package files first to leverage Docker's layer caching
COPY package*.json ./
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Build the Vite/Vue project for production
RUN npm run build

# Stage 2: Serve the built application using Caddy
FROM caddy:2-alpine

# Copy the compiled static files from the build stage
COPY --from=build /app/dist /srv

# Copy the Caddyfile configuration
COPY Caddyfile /etc/caddy/Caddyfile

# Expose port 80 for web traffic
EXPOSE 80
