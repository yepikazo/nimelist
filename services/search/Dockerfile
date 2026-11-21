FROM node:24-alpine

WORKDIR /app
COPY packages/service-runtime/src ./packages/service-runtime/src
COPY services/search/package.json ./services/search/package.json
RUN npm install --omit=dev --no-package-lock --ignore-scripts --prefix services/search
COPY services/search ./services/search

ENV NODE_ENV=production
ENV PORT=4103
EXPOSE 4103
USER node

CMD ["node", "services/search/src/server.mjs"]
