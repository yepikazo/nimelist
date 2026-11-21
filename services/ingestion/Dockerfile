FROM node:24-alpine

WORKDIR /app
COPY packages/service-runtime/src ./packages/service-runtime/src
COPY services/ingestion ./services/ingestion

ENV NODE_ENV=production
ENV PORT=4104
EXPOSE 4104
USER node

CMD ["node", "services/ingestion/src/server.mjs"]
