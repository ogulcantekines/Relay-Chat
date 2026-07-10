import "./config/env.js"; // .env'i diğer tüm importlardan önce yükler

import express from "express";
import cookieParser from "cookie-parser";
import connectToMongoDB from "./db/connectToMongoDB.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import userRoutes from "./routes/user.route.js";
import friendRoutes from "./routes/friend.route.js";
import conversationRoutes from "./routes/conversation.route.js";
import { app, server } from "./socket/socket.js";

const PORT = process.env.PORT || 5000;

app.use(express.json()); // JSON formatındaki istek gövdelerini işlemek için
app.use(express.urlencoded({ extended: true })); // URL-encoded verileri işlemek için
app.use(cookieParser()); // Cookie'leri işlemek için

// API route'ları
//app. ile kullanılan işlemler express serverına uygulanır bu api işlemleri backenddeki işlemlerdir. socket işlemleri io. veya socket. ile yapılır

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/conversations", conversationRoutes);

// Önce veritabanına bağlan, sonra dinlemeye başla.
// Aksi halde DB hazır değilken gelen istekler timeout ile 500 dönüyordu.
await connectToMongoDB();

server.listen(PORT, () => { //http serverı dinler. bu artık ana serverdır
    console.log(`Server is running on port ${PORT}`);
});
