import { Server } from "socket.io";
import http from "node:http";
import express from "express";
import cookieParser from "cookie-parser";
import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import { verifySession } from "../utils/session.js";
import { validId } from "../utils/validation.js";
import { isAllowedOrigin } from "../middleware/origin.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 16 * 1024,
    cors: { origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true },
    allowRequest: (request, done) => done(null, isAllowedOrigin(request.headers.origin, request))
});
const parseCookies = cookieParser();
const userSockets = new Map();
const userRoom = (id) => `user:${id}`;
// A room includes every tab/device; disconnecting one tab does not hide the others.
export const getReceiverSocketId = (id) => userSockets.has(String(id)) ? userRoom(id) : undefined;
export const disconnectSession = (id) => io.in(`session:${id}`).disconnectSockets(true);
export const disconnectUser = (id) => io.in(userRoom(id)).disconnectSockets(true);

io.use(async (socket, next) => {
    try {
        if (!isAllowedOrigin(socket.handshake.headers.origin, socket.request)) throw new Error();
        parseCookies(socket.request, {}, () => {});
        const session = await verifySession(socket.request.cookies?.token);
        if ((userSockets.get(session.id)?.size || 0) >= 10) throw new Error();
        socket.data.session = session;
        socket.data.token = socket.request.cookies.token;
        next();
    } catch { next(new Error("Authentication required")); }
});

io.on("connection", (socket) => {
    const { id: userId, jti, exp } = socket.data.session;
    const tabs = userSockets.get(userId) || new Set();
    tabs.add(socket.id);
    userSockets.set(userId, tabs);
    socket.join(userRoom(userId));
    socket.join(`session:${jti}`);
    io.emit("getOnlineUsers", [...userSockets.keys()]);
    const expires = setTimeout(() => socket.disconnect(true), Math.max(0, exp * 1000 - Date.now()));
    expires.unref();
    let windowStart = Date.now();
    let eventCount = 0;
    socket.use(async (packet, next) => {
        if (Date.now() - windowStart > 60000) { windowStart = Date.now(); eventCount = 0; }
        if (++eventCount > 120) { socket.disconnect(true); return; }
        try { await verifySession(socket.data.token); next(); }
        catch { socket.disconnect(true); }
    });
    const withPeer = (event, key, callback) => socket.on(event, async (data) => {
        try {
            const peerId = data?.[key];
            if (!validId(peerId) || peerId === userId) return;
            if (!await Conversation.exists({ participants: { $all: [userId, peerId] } })) return;
            await callback(peerId);
        } catch { /* Malformed events and transient database errors never crash the server. */ }
    });
    withPeer("typing", "receiverId", (peerId) => io.to(userRoom(peerId)).emit("userTyping", { senderId: userId }));
    withPeer("stopTyping", "receiverId", (peerId) => io.to(userRoom(peerId)).emit("userStoppedTyping", { senderId: userId }));
    withPeer("chatOpened", "otherUserId", async (peerId) => {
        await Message.updateMany({ senderId: peerId, receiverId: userId, isRead: { $ne: true }, clearedBy: { $ne: userId } }, { $set: { isRead: true } });
        io.to(userRoom(peerId)).emit("messagesRead", { readByUserId: userId });
    });
    socket.on("disconnect", () => {
        clearTimeout(expires);
        tabs.delete(socket.id);
        if (!tabs.size) userSockets.delete(userId);
        io.emit("getOnlineUsers", [...userSockets.keys()]);
    });
});
export { io, server, app };

// Historical learning notes below explain Socket.IO's client/server event model.
// The former query.userId examples are not authentication; the implementation
// above uses only the verified HttpOnly session cookie.
//io.emit veya io.to(...).emit(...) kullanımı backendden clienta event göndermek için kullanılır
//socket.on(...) kullanımı ise clienttan backend e event dinlemek için kullanılır
//tam tersinde ise
//frontendde socket.emit(...) kullanımı clienttan backend e event göndermek için kullanılır
//frontendde socket.on(...) kullanımı ise backendden clienta event dinlemek için kullanılır

/* idler aynı
┌─────────────────┐                    ┌─────────────────┐
│   FRONTEND      │                    │   BACKEND       │
│   (Browser)     │                    │   (Node.js)     │
├─────────────────┤                    ├─────────────────┤
│                 │                    │                 │
│  socket.id:     │◄──────────────────►│  socket.id:     │
│  "BxYz123ABC"   │   AYNI BAĞLANTI!  │  "BxYz123ABC"    │
│                 │                    │                 │
│  socket.emit()  │───────────────────►│  socket.on()    │
│                 │                    │                 │
│  socket.on()    │◄───────────────────│  io.emit()      │
│                 │                    │                 │
└─────────────────┘                    └─────────────────┘

🎯 İki Farklı Socket Objesi Var
1️⃣ Frontend Socket (Client Side)
Özellikleri:

const socket = io("http://localhost:5000", {
    query: {
        userId: authUser._id  // "675abc..."
    }
});

console.log(socket.id);  // Örnek: "BxYz123ABC"

🔵 Frontend'de yaşıyor (browser'da)
🔵 socket.io-client kütüphanesi
🔵 socket.emit() ile mesaj gönderir
🔵 socket.on() ile mesaj dinler

2️⃣ Backend Socket (Server Side)
Özellikleri:

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);  // "BxYz123ABC" (aynı!)
    
    const userId = socket.handshake.query.userId;
    userSocketMap[userId] = socket.id;
});

🟢 Backend'de yaşıyor (Node.js'de)
🟢 socket.io server kütüphanesi
🟢 socket.on() ile mesaj dinler
🟢 io.to(socket.id).emit() ile mesaj gönderir
*/

/*DB ye kaydedilmeden direkt socket üzerinden anlık mesajlaşma yapılırsa 

    socket.on("sendMessage", (data) => {
        const { receiverId, message } = data;
        const receiverSocketId = getReceiverSocketId(receiverId);
        const messageData = {
            senderId: userId,
            receiverId: receiverId,
            message: message,
            timestamp: Date.now()
        };
        if (receiverSocketId) {
            // Belirli kullanıcıya mesaj gönder
            io.to(receiverSocketId).emit("newMessage", messageData);
        }
    });
    */