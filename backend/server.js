import "./config/env.js"; // .env'i diğer tüm importlardan önce yükler

import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cookieParser from "cookie-parser";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import compression from "compression";
import connectToMongoDB from "./db/connectToMongoDB.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import userRoutes from "./routes/user.route.js";
import friendRoutes from "./routes/friend.route.js";
import conversationRoutes from "./routes/conversation.route.js";
import { app, server } from "./socket/socket.js";

const PORT = process.env.PORT || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Uygulama JWT_SECRET olmadan çalışmamalı: eksikse token'lar imzalanamaz.
if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not defined. Check your .env file.");
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
app.set("trust proxy", 1);

// Yanıtları gzip ile sıkıştır: derlenmiş JS paketi 351 KB'tan ~108 KB'a iner.
app.use(compression());

app.use(express.json()); // JSON formatındaki istek gövdelerini işlemek için
app.use(express.urlencoded({ extended: true })); // URL-encoded verileri işlemek için
app.use(cookieParser()); // Cookie'leri işlemek için

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

// Production'da derlenmiş frontend'i aynı sunucudan servis et.
// Frontend tüm istekleri /api ile göreli attığı için ek CORS ayarı gerekmez.
if (process.env.NODE_ENV === "production") {
    const clientDist = path.join(__dirname, "..", "frontend", "dist");

    // Derlenmiş dosya adları içerik hash'i taşıdığı için (index-C-zoC6mx.js)
    // uzun süre önbelleğe alınabilir; index.html ise her zaman tazelenmeli.
    app.use(express.static(clientDist, {
        maxAge: "1y",
        setHeaders: (res, filePath) => {
            if (filePath.endsWith("index.html")) {
                res.setHeader("Cache-Control", "no-cache");
            }
        }
    }));

    // API dışındaki tüm yollar SPA'ya düşer (client-side routing)
    app.get(/^\/(?!api\/).*/, (req, res) => {
        res.sendFile(path.join(clientDist, "index.html"));
    });
}

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
        server.close(() => process.exit(0));
    });
}
