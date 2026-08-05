FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN addgroup -S app && adduser -S app -G app \
  && mkdir -p uploads \
  && chown -R app:app /app
USER app

EXPOSE 5000

HEALTHCHECK --interval=15s --timeout=5s --retries=5 \
  CMD wget -qO- http://127.0.0.1:5000/ready || exit 1

CMD ["npm", "start"]
