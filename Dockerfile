FROM node:22-alpine AS build

WORKDIR /app
RUN corepack enable
COPY package.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable
COPY . .
RUN yarn build

FROM node:22-alpine AS runtime

RUN apk add --no-cache docker-cli
WORKDIR /app
# The server only uses Node built-ins and the UI is bundled into dist, so no node_modules here.
COPY package.json server.js config.example.json LICENSE ./
COPY server ./server
COPY --from=build /app/dist ./dist

ENV PORT=4173
ENV HOST=0.0.0.0
ENV AUTH_MODE=apikey
ENV CONFIG_PATH=/app/.data/config.json
RUN mkdir -p /app/.data
EXPOSE 4173

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://127.0.0.1:4173/api/health || exit 1

CMD ["npm", "start"]
