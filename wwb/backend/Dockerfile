FROM node:24.15.0-slim

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage caching
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev --verbose

# Copy the rest of the backend source code (including public directory if any)
COPY . .

# Expose the default port
EXPOSE 3000

# Set environment variable defaults
ENV API_PORT=3000
ENV NODE_ENV=production

# Command to run the application
CMD ["npm", "start"]
