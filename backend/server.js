import "./config/env.js"; // .env'i diğer tüm importlardan önce yükler

import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
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

// Reverse proxy (nginx, Docker, PaaS) arkasında doğru istemci IP'si için
app.set("trust proxy", 1);

app.use(express.json()); // JSON formatındaki istek gövdelerini işlemek için
app.use(express.urlencoded({ extended: true })); // URL-encoded verileri işlemek için
app.use(cookieParser()); // Cookie'leri işlemek için

// Kaba kuvvet denemelerini yavaşlatmak için giriş/kayıt uçlarına limit
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 20,                  // IP başına 20 deneme
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts, please try again later." }
});

// Konteyner/orkestrasyon sağlık kontrolü
app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// API route'ları
//app. ile kullanılan işlemler express serverına uygulanır bu api işlemleri backenddeki işlemlerdir. socket işlemleri io. veya socket. ile yapılır

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/conversations", conversationRoutes);

// Production'da derlenmiş frontend'i aynı sunucudan servis et.
// Frontend tüm istekleri /api ile göreli attığı için ek CORS ayarı gerekmez.
if (process.env.NODE_ENV === "production") {
    const clientDist = path.join(__dirname, "..", "frontend", "dist");
    app.use(express.static(clientDist));

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
