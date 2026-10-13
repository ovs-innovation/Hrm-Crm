FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN mkdir -p uploads/avatars uploads/wfh uploads/policies data
EXPOSE 5000

HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
  CMD wget -qO- http://127.0.0.1:5000/health || exit 1

CMD ["node", "index.js"]
