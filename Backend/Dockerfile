FROM node:20-alpine

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy remaining code
COPY . .

# Expose port (default port is overridden by env file / compose mapping)
EXPOSE 3072

CMD ["npm", "start"]
