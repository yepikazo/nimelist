FROM node:24-alpine

WORKDIR /app
COPY packages/service-runtime/src ./packages/service-runtime/src
COPY services/schedule/package.json ./services/schedule/package.json
RUN npm install --omit=dev --no-package-lock --ignore-scripts --prefix services/schedule
COPY services/schedule/src ./services/schedule/src
COPY services/schedule/migrations ./services/schedule/migrations

ENV NODE_ENV=production
ENV PORT=4102
EXPOSE 4102
USER node

CMD ["node", "services/schedule/src/server.mjs"]
