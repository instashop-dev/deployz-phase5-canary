FROM node:20-alpine AS build

ENV PRISMA_CLI_BINARY_TARGETS=debian-openssl-3.0.x

RUN apk add --no-cache openssl ca-certificates

WORKDIR /app

COPY package.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate
RUN npx tsc

FROM node:20-alpine AS runtime

ENV PRISMA_CLI_BINARY_TARGETS=debian-openssl-3.0.x

RUN apk add --no-cache openssl ca-certificates

WORKDIR /app

COPY package.json ./
COPY prisma ./prisma/

RUN npm install --omit=dev && npx prisma generate

COPY --from=build /app/dist ./dist

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:3000/health >/dev/null || exit 1

CMD ["node", "dist/server.js"]
