import mongoose from "mongoose";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import User from "../models/user.model.js";

// mesaj gönderme fonksiyonu
export const sendMessage = async (req, res) => {
    try {
        const { id: receiverId } = req.params; // url deki :id yi alıp receiverId ye ata
        const { message } = req.body; // request body den mesajı al
        const senderId = req.userId; // protectRoute middleware den gelen userId (giriş yapan kullanıcı)

        if (!message || message.trim() === "") {
            return res.status(400).json({ error: "Message content cannot be empty" });
        }
        if (message.length > 2000) {
            return res.status(400).json({ error: "Message cannot exceed 2000 characters" });
        }

        const sender = await User.findById(senderId); //senderId ile user collectionından kullanıcı bul
        const isFriend = sender.friends.includes(receiverId); //senderId ve receiverId yi içeren bir arkadaş mı kontrol et

        let conversation = await Conversation.findOne( //conversations collectionında senderId ve receiverId yi içeren konuşmayı bul
            { participants: { $all: [senderId, receiverId] } } //$all operatörü ile her iki kullanıcıyı da içeren belgeyi bul,sırası önemli değil
        );

        if (!conversation) { // konuşma yoksa yeni konuşma oluştur
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
                messages: [],
                status: isFriend ? "active" : "pending" //arakdaslık ile eklendi arkadaslarsa aktif değilse bekleyen konusma olur
            });
        }

        //eğer conversation varsa ve status pending ise
        else if (conversation.status === "pending") {
            // Eğer arkadaştalarsa otomatik aktif yap
            if (isFriend) {
                conversation.status = "active";
            } else {
                // Sadece karşı taraf (mesaj isteği atılan kişi) cevap verirse aktife dönsün
                const lastMessageId = conversation.messages[conversation.messages.length - 1];

                if (lastMessageId) {
                    const lastMessage = await Message.findById(lastMessageId);
                    // Eğer şu anki gönderen (senderId), son mesajı atan kişi değilse (yani alıcı cevap veriyorsa)
                    if (lastMessage && lastMessage.senderId.toString() !== senderId.toString()) {
                        conversation.status = "active";
                    }
                }
            }
        }

        const newMessage = new Message({ // message modeline uygun messages collectionına yeni mesaj
            senderId: senderId,
            receiverId: receiverId,
            message: message,
        });

        if (newMessage) {
            conversation.messages.push(newMessage._id);  // konuşmanın messages arrayine yeni mesajın id sini ekle. Get message da populate etmek için hayati
        }
        // Mesaj ve konuşmayı paralel olarak kaydet - performans için
        await Promise.all([conversation.save(), newMessage.save()]);

        // SOCKET.IO - Real-time mesaj gönderimi - alıcı online ise anında ilet bu dbye kaydedildikten sonra anlık olarak websocket ile gönder
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            // Gönderenin bilgisi de iletiliyor: alıcıda henüz o sohbet açılmamışsa
            // arayüz kutucuğu kendiliğinden oluşturabilsin diye.
            io.to(receiverSocketId).emit("newMessage", {
                ...newMessage.toObject(),
                sender: {
                    _id: sender._id,
                    fullName: sender.fullName,
                    username: sender.username,
                    profilePic: sender.profilePic
                },
                conversationStatus: conversation.status
            });
        }

        // Return the saved message as JSON
        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).send("Internal Server Error");
    }

};

// belirli bir kullanıcıyla olan mesajları al
export const getMessage = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const senderId = req.userId; // protectRoute middleware den gelen userId (giriş yapan kullanıcı)

        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, userToChatId] }
        }).populate({
            path: "messages",
            // Bu kullanıcı sohbeti temizlediyse, temizlemeden önceki mesajlar
            // ona gösterilmez. Kayıtlar durduğu için karşı tarafın geçmişi
            // etkilenmez.
            match: { clearedBy: { $ne: senderId } }
        });

        if (!conversation) {
            return res.status(200).json([]);
        }

        // populate match'i eşleşmeyenleri ayıklar; kalanlar bu kullanıcının görebildikleri
        const messages = conversation.messages;
        res.status(200).json(messages);

    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// sohbeti temizleme fonksiyonu
export const clearConversation = async (req, res) => {
    try {
        const { id: userToChatId } = req.params; // url deki :id yi alıp userToChatId ye ata
        const senderId = req.userId; // protectRoute middleware den gelen userId (giriş yapan kullanıcı)

        const conversation = await Conversation.findOne({ // her iki kullanıcıyı da içeren konuşmayı bul
            participants: { $all: [senderId, userToChatId] }
        });

        if (!conversation) { //conversation yoksa temizlenecek bir şey yok
            return res.status(404).json({ error: "Conversation not found" });
        }

        // Bekleyen istek reddediliyor demektir: henüz kabul edilmemiş bir
        // sohbetin kalıcı olmasının anlamı yok, iki taraftan da kaldırılır.
        if (conversation.status === "pending") {
            const deletedCount = conversation.messages.length;
            await Message.deleteMany({ _id: { $in: conversation.messages } });
            await Conversation.findByIdAndDelete(conversation._id);
            return res.status(200).json({
                message: "Pending request deleted completely",
                deletedCount
            });
        }

        // ═══ YALNIZCA BU KULLANICI İÇİN TEMİZLE ═══
        // Mesajlar silinmiyor, yalnızca clearedBy listesine bu kullanıcı ekleniyor.
        // $addToSet aynı kullanıcının iki kez eklenmesini engeller.
        const result = await Message.updateMany(
            {
                _id: { $in: conversation.messages },
                clearedBy: { $ne: senderId }
            },
            { $addToSet: { clearedBy: senderId } }
        );

        // Her iki taraf da temizlediyse mesajlar artık kimseye görünmüyor;
        // veritabanında tutmanın anlamı kalmadığı için kalıcı olarak silinir.
        const orphaned = await Message.find({
            _id: { $in: conversation.messages },
            clearedBy: { $all: conversation.participants }
        }).select("_id");

        if (orphaned.length > 0) {
            const ids = orphaned.map(m => m._id);
            await Message.deleteMany({ _id: { $in: ids } });
            conversation.messages = conversation.messages.filter(
                id => !ids.some(o => o.equals(id))
            );
            await conversation.save();
        }

        res.status(200).json({
            message: "Conversation cleared",
            deletedCount: result.modifiedCount
        });
    }
    catch (error) {
        console.error("Error clearing conversation:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// mesaj düzenleme fonksiyonu
export const editMessage = async (req, res) => {
    try {
        const { id: messageId } = req.params; //adress çubuğundaki :id yi alıp messageId ye ata
        const { newMessage } = req.body; // request body den yeni mesajı al, frontendden düzenlenen mesaj
        const userId = req.userId; //protectRoute middleware den gelen userId

        const message = await Message.findById(messageId); //messages collectionından messageId ile mesajı bul,hangi mesaj düzenlenecekse

        if (!message) { // gelen id ile ilgili mesaj bulunamazsa 
            return res.status(404).json({ error: "Message not found" });
        }

        if (message.senderId.toString() !== userId) { //giriş yapan kullanıcı mesajın sahibi değilse
            return res.status(403).json({ error: "Forbidden. You can only edit your own messages." });
        }

        if (message.isDeleted) { // silinmiş mesaj düzenlenip geri getirilemez
            return res.status(400).json({ error: "A deleted message cannot be edited" });
        }

        if (!newMessage || newMessage.trim() === "") { //yeni mesaj boşsa
            return res.status(400).json({ error: "Message content cannot be empty" });
        }
        if (newMessage.length > 2000) {
            return res.status(400).json({ error: "Message cannot exceed 2000 characters" });
        }

        message.message = newMessage.trim(); //mesajı yeni mesajla güncelle
        message.isEdited = true;
        message.editedAt = Date.now();

        await message.save();//db ye kaydet

        // SOCKET.IO - Real-time mesaj düzenleme bildirimi - alıcı online ise anında ilet bu dbye kaydedildikten sonra anlık olarak websocket ile gönder
        const receiversocketId = getReceiverSocketId(message.receiverId);
        if (receiversocketId) {
            io.to(receiversocketId).emit("messageEdited", { // messageEdited eventini alıcıya emit et, bu nesneyi yolla
                messageId: message._id,
                newMessage: message.message,
                isEdited: message.isEdited,
                editedAt: message.editedAt
            });
        }

        res.status(200).json({//düzenlenen mesajı dön
            message: "Message edited successfully",
            updatedMessage: message
        });


    } catch (error) {
        console.error("Error editing message:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};







// ═══════════════════════════════════════════════════════════════
// MESAJ SİLME
// Route: DELETE /api/messages/:id
// Mesaj kaydı korunur, içeriği gizlenir (WhatsApp/Discord davranışı):
// böylece sohbet akışındaki sırası bozulmaz ve karşı taraf silindiğini görür.
// ═══════════════════════════════════════════════════════════════
export const deleteMessage = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const userId = req.userId;

        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(400).json({ error: "Invalid message id" });
        }

        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }
        // Sadece mesajı gönderen silebilir
        if (message.senderId.toString() !== userId) {
            return res.status(403).json({ error: "Forbidden. You can only delete your own messages." });
        }
        if (message.isDeleted) {
            return res.status(400).json({ error: "Message is already deleted" });
        }

        message.isDeleted = true;
        message.message = "This message was deleted";
        await message.save();

        // Karşı taraf açık sohbetteyse anında güncellensin
        const receiverSocketId = getReceiverSocketId(message.receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageDeleted", { messageId: message._id });
        }

        res.status(200).json({
            message: "Message deleted successfully",
            deletedMessage: message
        });

    } catch (error) {
        console.error("Error deleting message:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ═══════════════════════════════════════════════════════════════
// OKUNMAMIŞ MESAJ SAYILARI
// Route: GET /api/messages/unread/counts
// Her gönderen için kaç okunmamış mesaj olduğunu döner:
//   { "<userId>": 3, "<userId2>": 1 }
// Kenar çubuğundaki rozetler bu veriyle çiziliyor.
// ═══════════════════════════════════════════════════════════════
export const getUnreadCounts = async (req, res) => {
    try {
        const userId = req.userId;

        const counts = await Message.aggregate([
            {
                $match: {
                    receiverId: new mongoose.Types.ObjectId(userId),
                    isRead: false,
                    // Kullanıcının temizlediği mesajlar okunmamış sayılmaz
                    clearedBy: { $ne: new mongoose.Types.ObjectId(userId) }
                }
            },
            {
                $group: {
                    _id: "$senderId",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Diziyi arayüzün doğrudan kullanabileceği nesneye çevir
        const result = {};
        for (const row of counts) {
            result[row._id.toString()] = row.count;
        }

        res.status(200).json(result);
    } catch (error) {
        console.error("Error fetching unread counts:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ═══════════════════════════════════════════════════════════════
// MESAJA EMOJİ TEPKİSİ
// Route: POST /api/messages/react/:id   body: { emoji }
// Aynı emoji tekrar gönderilirse tepki kaldırılır (toggle davranışı).
// Her kullanıcının bir mesajda yalnızca bir tepkisi olur.
// ═══════════════════════════════════════════════════════════════
const ALLOWED_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export const reactToMessage = async (req, res) => {
    try {
        const { id: messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.userId;

        if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(400).json({ error: "Invalid message id" });
        }
        if (!ALLOWED_REACTIONS.includes(emoji)) {
            return res.status(400).json({ error: "Unsupported reaction" });
        }

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }
        if (message.isDeleted) {
            return res.status(400).json({ error: "Cannot react to a deleted message" });
        }

        // Tepki yalnızca sohbetin taraflarından gelebilir
        const isParticipant =
            message.senderId.toString() === userId ||
            message.receiverId.toString() === userId;
        if (!isParticipant) {
            return res.status(403).json({ error: "Forbidden. You are not part of this conversation." });
        }

        const existing = message.reactions.find(r => r.userId.toString() === userId);

        if (existing && existing.emoji === emoji) {
            // Aynı emojiye tekrar basıldı -> tepkiyi kaldır
            message.reactions = message.reactions.filter(r => r.userId.toString() !== userId);
        } else if (existing) {
            existing.emoji = emoji; // farklı emoji -> değiştir
        } else {
            message.reactions.push({ userId, emoji });
        }

        await message.save();

        // Karşı tarafa anlık bildir
        const otherUserId =
            message.senderId.toString() === userId ? message.receiverId : message.senderId;
        const otherSocketId = getReceiverSocketId(otherUserId);
        if (otherSocketId) {
            io.to(otherSocketId).emit("messageReaction", {
                messageId: message._id,
                reactions: message.reactions
            });
        }

        res.status(200).json({
            message: "Reaction updated",
            reactions: message.reactions
        });
    } catch (error) {
        console.error("Error reacting to message:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
