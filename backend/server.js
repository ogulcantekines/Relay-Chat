import "./config/env.js"; // .env'i diğer tüm importlardan önce yükler

import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cookieParser from "cookie-parser";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import compression from "compression";
import helmet from "helmet";
import mongoose from "mongoose";
import { protectOrigin } from "./middleware/origin.js";
import connectToMongoDB from "./db/connectToMongoDB.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import userRoutes from "./routes/user.route.js";
import friendRoutes from "./routes/friend.route.js";
import conversationRoutes from "./routes/conversation.route.js";
import { app, server, io } from "./socket/socket.js";

const PORT = process.env.PORT || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Uygulama JWT_SECRET olmadan çalışmamalı: eksikse token'lar imzalanamaz.
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.error("JWT_SECRET must contain at least 32 random characters.");
    process.exit(1);
}

// Reverse proxy (nginx, PaaS) arkasında doğru istemci IP'si için.
// Yalnızca X-Forwarded-For başlığı ekleyen L7 proxy'lerde işe yarar.
//
// Not: Docker Desktop (Windows/macOS) portu bir L4 kullanıcı-alanı proxy'si
// ile aktarır; bağlantıyı sonlandırıp yenisini açtığı için gerçek istemci
// IP'si kaybolur ve uygulama tüm istekleri bridge adresinden (172.x.x.1)
// geliyormuş gibi görür. Bu durumda aşağıdaki rate limit, farklı cihazları
// tek bir istemci sayar. Linux sunucuda gerçek DNAT uygulandığı için
// istemci IP'si korunur ve limit cihaz başına çalışır.
const proxyHops = Number(process.env.TRUST_PROXY || 0);
if (!Number.isInteger(proxyHops) || proxyHops < 0 || proxyHops > 5) throw new Error("TRUST_PROXY must be an integer from 0 to 5");
app.set("trust proxy", proxyHops);

// Güvenlik başlıkları.
// Uygulama kendi arayüzünü servis ettiği için CSP'de 'self' yeterli;
// avatarlar ui-avatars.com'dan geldiği için img-src'ye o da ekleniyor.
// connect-src'de ws/wss var, yoksa Socket.IO bağlantısı CSP'ye takılır.
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"], // bileşenler satır içi stil kullanıyor
            imgSrc: ["'self'", "data:", "https:"],
            mediaSrc: ["'self'"],
            connectSrc: ["'self'", "ws:", "wss:"],
            objectSrc: ["'none'"],
            frameAncestors: ["'none'"], // clickjacking
            baseUri: ["'self'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: process.env.COOKIE_SECURE === "true" ? [] : null
        }
    },
    // Çapraz kaynak izolasyonu arayüzdeki harici avatarları engelliyordu
    crossOriginEmbedderPolicy: false,
    // HSTS yalnızca HTTPS arkasında anlamlı
    hsts: process.env.COOKIE_SECURE === "true"
}));

// Yanıtları gzip ile sıkıştır: derlenmiş JS paketi 351 KB'tan ~108 KB'a iner.
app.use(compression());

app.use(protectOrigin);
app.use(express.json({ limit: "16kb" })); // JSON formatındaki istek gövdelerini işlemek için
app.use(express.urlencoded({ extended: false, limit: "16kb" })); // URL-encoded verileri işlemek için
// CSRF koruması iki katmanlı ve yukarıdaki protectOrigin ile sağlanıyor:
// durum değiştiren her istekte Origin başlığı doğrulanıyor, oturum çerezi
// ise SameSite=Lax olduğu için çapraz site isteklerinde gönderilmiyor.
// CodeQL yalnızca csurf benzeri bir paket aradığından bunu göremiyor.
// codeql[js/missing-token-validation]
app.use(cookieParser());
app.use("/api", (req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    if (["POST", "PUT", "PATCH"].includes(req.method) && (req.body === null || (req.body !== undefined && (typeof req.body !== "object" || Array.isArray(req.body))))) return res.status(400).json({ message: "Expected a JSON object" });
    req.body ??= {};
    next();
}); // Cookie'leri işlemek için

// Kaba kuvvet denemelerini yavaşlatmak için giriş/kayıt uçlarına limit
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,

    // Sayaç yalnızca IP'ye değil, denenen kullanıcı adına da bağlı.
    //
    // Tek başına IP kullanmak, istemci adresinin ayırt edici olmadığı her
    // durumda yanlış sonuç veriyordu: aynı ağın arkasındaki (ya da Docker
    // Desktop'ın L4 proxy'si yüzünden tek adrese düşen) kullanıcılar aynı
    // kovayı paylaşıyor, biri limiti tüketince diğerleri de kilitleniyordu.
    //
    // Kullanıcı adını anahtara katmak asıl amacı korur: tek bir hesaba
    // yapılan kaba kuvvet denemesi yine 20'de durur, ama farklı hesaplara
    // giren kişiler birbirini etkilemez.
    keyGenerator: (req) => {
        const account = typeof req.body?.username === "string"
            ? req.body.username.toLowerCase().slice(0, 64)
            : "";
        return `${ipKeyGenerator(req.ip)}:${account}`;
    },

    message: { message: "Too many attempts, please try again later." }
});

// Konteyner/orkestrasyon sağlık kontrolü
app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", uptime: process.uptime() });
});

app.get("/api/ready", (req, res) => {
    const ready = mongoose.connection.readyState === 1;
    res.status(ready ? 200 : 503).json({ status: ready ? "ready" : "unavailable" });
});

// A second IP-wide limit prevents cycling usernames to bypass account limits.
app.use("/api", rateLimit({ windowMs: 60000, limit: 300, standardHeaders: "draft-8", legacyHeaders: false, message: { message: "Too many requests, please try again shortly." } }));
const authIpLimit = rateLimit({ windowMs: 15 * 60000, limit: 100, standardHeaders: "draft-8", legacyHeaders: false, message: { message: "Too many authentication attempts." } });
app.use(["/api/auth/login", "/api/auth/signup", "/api/auth/password"], authIpLimit);
app.use("/api/auth/password", rateLimit({ windowMs: 15 * 60000, limit: 10, legacyHeaders: false, message: { message: "Too many password change attempts." } }));

// API route'ları
//app. ile kullanılan işlemler express serverına uygulanır bu api işlemleri backenddeki işlemlerdir. socket işlemleri io. veya socket. ile yapılır

// Limit yalnızca kimlik doğrulama denemelerine uygulanır; /me veya profil
// güncelleme gibi oturum içi uçlar normal kullanımda bu sınıra takılmamalı.
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/signup", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/conversations", conversationRoutes);

app.use("/api", (req, res) => res.status(404).json({ message: "API route not found" }));

// Production'da derlenmiş frontend'i aynı sunucudan servis et.
// Frontend tüm istekleri /api ile göreli attığı için ek CORS ayarı gerekmez.
if (process.env.NODE_ENV === "production") {
    const clientDist = path.join(__dirname, "..", "frontend", "dist");

    // Derlenmiş dosya adları içerik hash'i taşıdığı için (index-C-zoC6mx.js)
    // uzun süre önbelleğe alınabilir; index.html ise her zaman tazelenmeli.
    app.use(express.static(clientDist, {
        maxAge: 0,
        setHeaders: (res, filePath) => {
            if (filePath.includes(`${path.sep}assets${path.sep}`)) res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
            if (filePath.endsWith("index.html")) {
                res.setHeader("Cache-Control", "no-cache");
            }
        }
    }));

    // API dışındaki tüm yollar SPA'ya düşer (client-side routing)
    app.get(/^\/(?!api\/).*/, (req, res) => {
        res.setHeader("Cache-Control", "no-cache");
        res.sendFile(path.join(clientDist, "index.html"));
    });
}

app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error.type === "entity.too.large" ? 413 : error instanceof SyntaxError || error.name === "CastError" ? 400 : 500;
    res.status(status).json({ message: status === 413 ? "Request body too large" : status === 400 ? "Invalid request" : "Internal Server Error" });
});

// Önce veritabanına bağlan, sonra dinlemeye başla.
// Aksi halde DB hazır değilken gelen istekler timeout ile 500 dönüyordu.
await connectToMongoDB();

server.listen(PORT, () => { //http serverı dinler. bu artık ana serverdır
    console.log(`Server is running on port ${PORT}`);
});

// Konteyner "docker stop" gönderdiğinde açık bağlantıları düzgün kapat
for (const signal of ["SIGTERM", "SIGINT"]) {
    process.on(signal, () => {
        console.log(`${signal} received, shutting down`);
        const force = setTimeout(() => process.exit(1), 10000);
        force.unref();
        io.close(async () => {
            await mongoose.disconnect();
            clearTimeout(force);
            process.exit(0);
        });
        server.closeIdleConnections();
    });
}
