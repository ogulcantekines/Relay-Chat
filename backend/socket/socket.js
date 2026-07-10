import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/message.model.js";

const app = express(); //express serverı oluşturma
const server = http.createServer(app); //ana kapsayıcı http serverı oluşturma ve expressi onu subserverın olarak kullanma

const io = new Server(server, {  //ana kapsayıcı http serverını kullanarak socket.io subserverı oluşturma
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
    }
});

const userSocketMap = {}; //burada object atamanın farklı bir gösterimini kullanıyoruz
//örneğin userSocketMap = { "userId1": "socketId1", "userId2": "socketId2" } gibi olması için
//userSocketMap[userId] = socketId; şeklinde atama yapıyoruz
// userSocketMap {
//   userId1: socketId1,
//   userId2: socketId2,
//   ...
// } şeklinde bir yapı oluşur. js obje konusu direkt

//fonksiyon kullanımı
export const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId]; // userSocketMap{receiverId: socketId}
};
//kullanıcı login olduğu vakit frontendden backende socket bağlantısı kurarken userId yi de gönderiyoruz ve bu otomatik olarak io connection eventinde yakalanıyor
io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Kullanıcı ID'sini handshake'ten al ve socket ID ile eşle bu handshake query kısmı frontendden socket bağlantısı kurarken gönderilen userId yi içerir
    const userId = socket.handshake.query.userId;
    if (userId !== "undefined") userSocketMap[userId] = socket.id;

    io.emit("getOnlineUsers", Object.keys(userSocketMap));// Tüm bağlı kullanıcılara online kullanıcı listesini gönder
    // object keys ile userSocketMap in keylerini alıyoruz yani userId1 : socketıd1 ise object keys ile sadece userId1 i alıyoruz
    //backend forntend veri gönderimlerinde otomatik olarak json a çevirir
    //örneğin userSocketMap = { userId1: "socketId1", userId2: "socketId2" } ise Object.keys(userSocketMap) = ["userId1", "userId2"] olur


    // Yazıyor göstergesi - kullanıcı yazmaya başladığında
    socket.on("typing", (data) => {
        const { receiverId } = data; //destructor ile data nesnesinden receiverId yi alıyoruz
        const receiverSocketId = getReceiverSocketId(receiverId); // receiverId ye karşılık gelen socketId yi alıyoruz

        if (receiverSocketId) {
            // Alıcıya yazıyor bilgisi gönder
            io.to(receiverSocketId).emit("userTyping", {
                senderId: userId
            }); // nesne olarak yayınlıyoruz ki receiver tarafında data.senderId ile erişilebilsin
        }
    });

    // Yazıyor göstergesini durdur - kullanıcı yazmayı bıraktığında
    socket.on("stopTyping", (data) => {
        const { receiverId } = data;
        const receiverSocketId = getReceiverSocketId(receiverId);

        if (receiverSocketId) {
            // Alıcıya yazmanın durduğu bilgisini gönder
            io.to(receiverSocketId).emit("userStoppedTyping", {
                senderId: userId
            });
        }
    });

    // Chat açılması frontendde kolay kontrol ediliyor ama backendde bu event dinlenip işlem yapılıyor
    socket.on("chatOpened", async (data) => { //bu event chatin açık olup olamadığını backend e bildiriyor

        // data nesnesi içinde otherUserId var
        const { otherUserId } = data;

        try {
            // Bu kullanıcıya gönderilen okunmamış mesajları bul ve güncelle, burası database de messages koleksiyonunda isRead alanını true yapıyor
            // otherUserId, chat açılan kişinin userId'si yani karşı tarafın id'si userId ise kendi id'miz

            // ✅ FIX: Hem isRead: false olan HEM DE isRead field'ı olmayan (eski) mesajları güncelle
            await Message.updateMany(
                {
                    senderId: otherUserId,  // Bu kısım ilk parametre ve filtreleme için kullanılıyor
                    receiverId: userId,      //örneğin senderıd si emitlenen değer olup receiver idsi kendi idmiz olup bir de mesaj henüz okunmamış ise
                    $or: [
                        { isRead: false },                    // isRead: false olanlar
                        { isRead: { $exists: false } }        // isRead field'ı yoksa eşleş
                    ] //or ve exist $ operatörleri ile birlikte kullanılıyor çünkü isim çakışması olabilir bunların isim olmadığını belirtiyoruz operatörler
                },
                {
                    isRead: true // Bu kısım ikinci parametre ve güncelleme için kullanılıyor
                }
            );
            // Karşı tarafa "mesajlarını okudum" bilgisi gönder
            const otherUserSocketId = getReceiverSocketId(otherUserId); //otherUserId den karşı tarafın socket id sini al
            if (otherUserSocketId) {
                io.to(otherUserSocketId).emit("messagesRead", {  //karşının frontend socketine emit et bu nesneyi yolla
                    readByUserId: userId
                });
            }

            console.log(`Messages marked as read for user ${userId} from ${otherUserId}`);
        } catch (error) {
            console.error("Error marking messages as read:", error);
        }
    });

    // Kullanıcı bağlantısı kesildiğinde temizlik yap. frontendde logouta basılınca uselogout tetiklenir ve socket bağlantısı kesilir.
    socket.on("disconnect", () => {
        console.log("A user disconnected:", socket.id);
        delete userSocketMap[userId]; // Kullanıcıyı haritadan çıkar
        io.emit("getOnlineUsers", Object.keys(userSocketMap)); // Güncel online listesi gönder
    });
});

export { io, server, app };


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