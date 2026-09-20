import { validId, publicUserFields } from "../utils/validation.js";
import User from "../models/user.model.js";
import FriendRequest from "../models/friendRequest.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import Conversation from "../models/conversation.model.js";

// 📌 Controller Yapısı:
// Her fonksiyon async (req, res) => { ... } formatındadır
// req → İstemciden gelen istek (params, query, body, userId)
// res → İstemciye gönderilecek yanıt (status, json)
// req.userId → protectRoute middleware'i tarafından eklenir (JWT'den çözülen kullanıcı ID)

// ═══════════════════════════════════════════════════════════════
// 1. KULLANICI ARAMA
// Route: GET /api/friends/search?query=abc
// Amaç: Kullanıcı adı veya friend code ile kullanıcı arar
// ═══════════════════════════════════════════════════════════════
export const searchUsers = async (req, res) => {
    try {
        const { query } = req.query; //arama kısmına ?dan sonra gelen veri, req nesnesinin query özelliğinin içinde saklanır
        //yani ?query=ogi aslında req{query:{query:"ogi"}} şeklinde nesne olarak kaydedilir
        const userId = req.userId;
        if (typeof query !== "string" || query.length > 20 || !/^[a-zA-Z0-9_]{1,20}$/.test(query)) return res.status(400).json({ message: "Search must contain 1-20 letters, numbers or underscores" });

        // Username veya friend code ile arama
        //mongodb de özellik ler ve onları değiştiren operatörler nesne içine alınır örneğin
        //$regex derken {$regex} olarak kullanılır ve ayrıca regexin kullanılma amacı partial search yani kısmi arama yapmaktır yani mesela 
        // query=ogi olacak şekilde arama yaparsak ogi ile başlayan kullanıcıları bulur  

        const users = await User.find({ //buradaki mongodb ve {} yapısına hakim ol
            $or: [
                { username: { $regex: query, $options: "i" } },  // Kullanıcı adında ara
                { friendCode: { $regex: query.toUpperCase() } }  // Friend code'da ara (büyük harfe çevir)
            ],
            _id: { $ne: userId }  // Kendini sonuçlardan çıkar
        }).select(publicUserFields).limit(20);
        // Arama sonucunda sadece arayüzün ihtiyaç duyduğu alanlar döner.
        // "-password" yeterli değildi: friends dizisi gibi alanlar da dışarı sızıyordu.

        res.status(200).json(users); // Bulunan kullanıcıları JSON olarak döndür

    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// ═══════════════════════════════════════════════════════════════
// 2. ARKADAŞLIK İSTEĞİ GÖNDERME
// Route: POST /api/friends/send/:receiverId
// Amaç: Belirtilen kullanıcıya arkadaşlık isteği gönderir
// Akış: Kontroller → FriendRequest oluştur → Socket.IO bildirimi
// ═══════════════════════════════════════════════════════════════
export const sendFriendRequest = async (req, res) => {
    try {
        const { receiverId } = req.params; // URL'den alıcı ID'si → /send/675abc123 → receiverId = "675abc123"
        const senderId = req.userId;       // protectRoute'dan → isteği yapan kullanıcı

        if (receiverId === senderId) return res.status(400).json({ message: "Cannot add yourself" });
        // Her iki kullanıcıyı da DB'den çek
        const sender = await User.findById(senderId);
        const receiver = await User.findById(receiverId);

        // ═══ GÜVENLİK KONTROLLERİ ═══

        // 1. Alıcı var mı?
        if (!receiver) {
            return res.status(404).json({ message: "Receiver not found" });
        }

        // 2. Zaten arkadaş mı? → User modelindeki friends dizisinde kontrol
        if (sender.friends.some(id => id.equals(receiver._id))) {
            return res.status(400).json({ message: "You are already friends with this user" });
        }

        // 3. Eski tamamlanmış istekleri temizle (accepted/rejected olanları sil)
        // $or → her iki yönü kontrol et (A→B veya B→A)
        // $in → status "accepted" VEYA "rejected" ise eşleş
        await FriendRequest.deleteMany({
            $or: [
                { senderId: sender._id, receiverId: receiver._id },
                { senderId: receiver._id, receiverId: sender._id }
            ],
            status: { $in: ["accepted", "rejected"] }
        });

        // 4. Zaten bekleyen (pending) istek var mı kontrol et
        // $or ile her iki yönü kontrol et → hem sen ona hem o sana göndermiş olabilir
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { senderId: sender._id, receiverId: receiver._id },
                { senderId: receiver._id, receiverId: sender._id }
            ],
            status: "pending"
        });

        if (existingRequest) {
            // Karşı taraf sana istek göndermişse → "Pending'lerine bak" mesajı ver
            if (existingRequest.senderId.toString() === receiverId) { //toString() kullanmamızın sebebi mongodb de ref olarak oldugundan object id olarak tutuluyor onu stringe çeviriyoruz
                return res.status(400).json({
                    message: "This user has already sent you a friend request. Check your pendings"
                });
            }
            // Sen zaten istek göndermişsen
            return res.status(400).json({ message: "Friend request already sent" });
        }

        // ═══ İSTEK OLUŞTURMA ═══
        // Tüm kontrollerden geçtiyse yeni FriendRequest belgesi oluştur
        const friendRequest = new FriendRequest({
            senderId: sender._id,
            receiverId: receiver._id,
            status: "pending"
        });
        await friendRequest.save(); // MongoDB'ye kaydet

        // ═══ SOCKET.IO BİLDİRİMİ ═══
        // Alıcı online ise anlık bildirim gönder
        // Neden Socket.IO? → Gönderen Zustand'dan state güncelleyebilir ama
        // alıcı sayfayı yenilemeden yeni isteği göremez. Socket.IO ile anlık bildirim!
        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            const senderData = await User.findById(senderId).select(publicUserFields);
            io.to(receiverSocketId).emit("newFriendRequest", {
                sender: senderData,           // Gönderenin bilgileri (avatar, isim vb.)
                friendRequest: friendRequest,   // İstek bilgileri (ID, status vb.)
            });
        }
        const outgoing = await FriendRequest.findById(friendRequest._id).populate("receiverId", publicUserFields);
        res.status(200).json({ message: "Friend request sent successfully", friendRequest: outgoing });

    } catch (error) {
        console.error("Error sending friend request:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// ═══════════════════════════════════════════════════════════════
// 3. GELEN ARKADAŞLIK İSTEKLERİNİ GETİRME
// Route: GET /api/friends/requests
// Amaç: Kullanıcıya gelen pending durumundaki istekleri döner
// ═══════════════════════════════════════════════════════════════
export const getFriendRequests = async (req, res) => {
    try {
        const userId = req.userId;

        // receiverId === userId → sana gönderilen istekleri bul
        // status: "pending" → sadece bekleyenleri getir
        // .populate("senderId", publicUserFields) → senderId'yi tam kullanıcı objesine çevir
        // populate olmadan: { senderId: "675abc123" }
        // populate ile:     { senderId: { _id: "675abc123", fullName: "Ali", profilePic: "..." } }
        const requests = await FriendRequest.find({
            receiverId: userId,
            status: "pending"
        }).populate("senderId", publicUserFields);

        if (!requests) {
            return res.status(404).json({ message: "No friend requests found" });
        }

        res.status(200).json({
            friendRequests: requests
        });

    } catch (error) {

        console.error("Error getting friend requests:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// ═══════════════════════════════════════════════════════════════
// 4. ARKADAŞLIK İSTEĞİNE YANITLAMA (Kabul / Red)
// Route: POST /api/friends/respond
// Body: { requestId, response: "accept" | "reject" }
// Amaç: Gelen isteği kabul veya reddeder
// Kabul: Her iki kullanıcının friends dizisine birbirini ekler
//        + Varsa pending conversation'ları active yapar
// Red: Sadece FriendRequest status'unu "rejected" yapar
// ═══════════════════════════════════════════════════════════════
export const respondToFriendRequest = async (req, res) => {
    try {
        const { requestId, response } = req.body; // Frontend'den gelen veri
        const userId = req.userId;

        if (!validId(requestId)) return res.status(400).json({ message: "Invalid request id" });
        const friendRequest = await FriendRequest.findById(requestId);

        // ═══ GÜVENLİK KONTROLLERİ ═══
        if (!friendRequest) {
            return res.status(404).json({ message: "Friend request not found" });
        }
        if (friendRequest.status !== "pending") {
            return res.status(400).json({ message: "Friend request is not pending" });
        }
        // Sadece ALICI yanıtlayabilir (gönderen kendi isteğini kabul edemez)
        if (friendRequest.receiverId.toString() !== userId) {
            return res.status(403).json({ message: "You are not the receiver of this friend request" });
        }

        // Geçersiz bir response değeri sessizce "reject" gibi davranmamalı.
        if (response !== "accept" && response !== "reject") {
            return res.status(400).json({ message: "Response must be either 'accept' or 'reject'" });
        }

        let friendUser = null; // Kabul edilirse arkadaş bilgisi döndürülecek

        if (response === "accept") {
            // ═══ KABUL İŞLEMİ ═══

            // 1. Her iki kullanıcının friends dizisine birbirini ekle
            // $push → MongoDB array operatörü, diziye yeni eleman ekler
            await User.findByIdAndUpdate(userId, {
                $addToSet: { friends: friendRequest.senderId }
            });
            await User.findByIdAndUpdate(friendRequest.senderId, {
                $addToSet: { friends: userId }
            });

            // 2. Varsa pending conversation'ları active yap
            // $all → participants dizisinde HER İKİ ID de varsa eşleş
            // [userId, senderId] ve [senderId, userId] sırası farketmez, $all her ikisini de yakalar
            await Conversation.updateMany({
                participants: { $all: [userId, friendRequest.senderId] },
                status: "pending"
            }, { $set: { status: "active" } });

            // 3. FriendRequest status'unu güncelle
            friendRequest.status = "accepted";

            // 4. Kabul eden kullanıcının bilgilerini al (frontend'e döndürmek için)
            friendUser = await User.findById(friendRequest.senderId).select(publicUserFields);

            // 5. Socket.IO ile gönderene anlık bildirim → "İsteğin kabul edildi!"
            const senderSocketId = getReceiverSocketId(friendRequest.senderId);
            if (senderSocketId) {
                const acceptedByUser = await User.findById(userId).select(publicUserFields);
                io.to(senderSocketId).emit("friendRequestResponse", {
                    friendRequest: friendRequest,
                    friendUser: friendUser,
                    acceptedByUser: acceptedByUser
                });
            }
        }
        else {
            // ═══ RED İŞLEMİ ═══
            friendRequest.status = "rejected";

            // Socket.IO ile gönderene bildirim → "İsteğin reddedildi"
            const senderSocketId = getReceiverSocketId(friendRequest.senderId);
            if (senderSocketId) {
                const rejectedByUser = await User.findById(userId).select(publicUserFields);
                io.to(senderSocketId).emit("friendRequestRejected", {
                    friendRequest: friendRequest,
                    rejectedByUser: rejectedByUser
                });
            }
        }

        await friendRequest.save(); // Güncellenmiş FriendRequest'i DB'ye kaydet

        res.status(200).json({
            message: "Friend request response sent successfully",
            friend: friendUser, // Kabul edildiyse arkadaş bilgisi, reddedildiyse null
        });

    } catch (error) {
        console.error("Error responding to friend request:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }

}

// ═══════════════════════════════════════════════════════════════
// 5. ARKADAŞ LİSTESİ GETİRME
// Route: GET /api/friends/list
// Amaç: Kullanıcının arkadaş listesini döner
// ═══════════════════════════════════════════════════════════════
export const getFriends = async (req, res) => {
    try {
        const userId = req.userId;
        // .populate("friends", publicUserFields)
        // User modelinde friends: [ObjectId] → populate ile tam kullanıcı objesine çevir
        // Populate öncesi: friends: ["675abc", "675def"]
        // Populate sonrası: friends: [{_id: "675abc", fullName: "Ali", ...}, {_id: "675def", ...}]
        const user = await User.findById(userId).populate("friends", publicUserFields);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            friends: user.friends
        });

    } catch (error) {
        console.error("Error getting friends:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// ═══════════════════════════════════════════════════════════════
// 6. ARKADAŞTAN ÇIKARMA
// Route: DELETE /api/friends/remove/:friendId
// Amaç: Her iki kullanıcının friends dizisinden birbirini çıkarır
// ⚠️ Conversation'a dokunmaz! Active kalır (Instagram modeli)
// ═══════════════════════════════════════════════════════════════
export const removeFriend = async (req, res) => {
    try {
        const { friendId } = req.params;
        const userId = req.userId;

        // $pull → MongoDB array operatörü, diziden belirtilen elemanı çıkarır
        // Her iki kullanıcıdan birbirinin ID'sini çıkar
        await User.findByIdAndUpdate(userId, {
            $pull: { friends: friendId }
        });
        await User.findByIdAndUpdate(friendId, {
            $pull: { friends: userId }
        });

        // Instagram tarzı: Conversation kalır (active olarak), mesajlaşma devam eder
        // Bir kere active olan conversation her zaman active kalır
        // UI'da "Arkadaş Ekle" butonu gösterilir
        res.status(200).json({
            message: "Friend removed successfully"
        });

    } catch (error) {
        console.error("Error removing friend:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// ═══════════════════════════════════════════════════════════════
// 7. GÖNDERİLEN ARKADAŞLIK İSTEKLERİNİ GETİRME
// Route: GET /api/friends/sentRequests
// Amaç: Kullanıcının gönderdiği pending istekleri döner
// ═══════════════════════════════════════════════════════════════
export const getSentFriendRequests = async (req, res) => {

    try {
        const userId = req.userId;

        // senderId === userId → kendin gönderdiğin istekleri bul
        // .populate("receiverId", publicUserFields) → alıcının tam bilgilerini getir
        const sentRequests = await FriendRequest.find({
            senderId: userId,
            status: "pending"
        }).populate("receiverId", publicUserFields);

        res.status(200).json({
            sentRequests: sentRequests
        });

    } catch (error) {
        console.error("Error getting sent friend requests:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}


// ═══════════════════════════════════════════════════════════════
// 8. GÖNDERİLEN ARKADAŞLIK İSTEĞİNİ İPTAL ETME
// Route: DELETE /api/friends/cancel/:requestId
// Amaç: Gönderdiğin bekleyen isteği geri çeker (siler)
// ═══════════════════════════════════════════════════════════════
export const cancelFriendRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const userId = req.userId;

        const friendRequest = await FriendRequest.findById(requestId);

        // ═══ GÜVENLİK KONTROLLERİ ═══
        if (!friendRequest) {
            return res.status(404).json({ message: "Friend request not found" });
        }
        // Sadece GÖNDERİCİ iptal edebilir → .toString() ile ObjectId'yi string'e çevir
        if (friendRequest.senderId.toString() !== userId) {
            return res.status(403).json({ message: "You are not authorized to cancel this request" });
        }
        // Sadece pending istekler iptal edilebilir (accepted/rejected olanlar iptal edilemez)
        if (friendRequest.status !== "pending") {
            return res.status(400).json({ message: "Only pending requests can be cancelled" });
        }

        // findByIdAndDelete → bulur ve siler (tek sorguda)
        await FriendRequest.findByIdAndDelete(requestId);

        res.status(200).json({
            message: "Friend request cancelled successfully"
        });

    } catch (error) {
        console.error("Error cancelling friend request:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
