# ─────────────────────────────────────────────────────────────
# 1. aşama: frontend'i derle
# ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS client-build

WORKDIR /app/frontend

# Önce sadece manifest'leri kopyala: kaynak kod değiştiğinde
# bağımlılık katmanı cache'ten gelir, kurulum tekrar çalışmaz.
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ─────────────────────────────────────────────────────────────
# 2. aşama: çalışma imajı (sadece backend + derlenmiş frontend)
# ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Yalnızca production bağımlılıkları: nodemon/eslint imaja girmez
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY backend/ ./backend/
COPY --from=client-build /app/frontend/dist ./frontend/dist

# root olarak çalıştırma; node imajındaki hazır kullanıcıyı kullan
USER node

EXPOSE 5000

# Orkestratörün konteynerin sağlığını görebilmesi için
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||5000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "backend/server.js"]
