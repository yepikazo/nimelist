FROM node:24-alpine

WORKDIR /app
COPY packages/service-runtime/src ./packages/service-runtime/src
COPY services/search ./services/search

ENV NODE_ENV=production
ENV PORT=4103
EXPOSE 4103
USER node

CMD ["node", "services/search/src/server.mjs"]
