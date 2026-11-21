FROM node:24-alpine

WORKDIR /app
COPY packages/service-runtime/src ./packages/service-runtime/src
COPY services/catalog/package.json ./services/catalog/package.json
RUN npm install --omit=dev --no-package-lock --ignore-scripts --prefix services/catalog
COPY services/catalog/src ./services/catalog/src
COPY services/catalog/migrations ./services/catalog/migrations

ENV NODE_ENV=production
ENV PORT=4101
EXPOSE 4101
USER node

CMD ["node", "services/catalog/src/server.mjs"]
