FROM oven/bun:1.4

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bunx prisma generate

EXPOSE 5000

CMD ["bun", "src/server.ts"]
