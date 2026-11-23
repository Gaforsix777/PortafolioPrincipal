FROM node:24-bookworm-slim AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM dependencies AS build
COPY index.html vite.config.js ./
COPY src ./src
COPY server/validation.js ./server/validation.js
COPY public ./public
RUN npm run build

FROM node:24-bookworm-slim AS production
ENV NODE_ENV=production PORT=3000 DATABASE_PATH=/app/data/portfolio.sqlite
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force && mkdir /app/data && chown node:node /app/data
COPY --from=build /app/dist ./dist
COPY server ./server
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "server/index.js"]
