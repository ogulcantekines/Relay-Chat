import mongoose from "mongoose";

// Arkadaşlık İsteği Modeli (FriendRequest)
// Bu model, kullanıcılar arasındaki arkadaşlık isteklerini veritabanında tutar.
// Bir kullanıcı başka bir kullanıcıya arkadaşlık isteği gönderdiğinde bu koleksiyona yeni bir belge eklenir.
// İstek kabul/red edildiğinde status alanı güncellenir.

const friendRequestSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId, // MongoDB ObjectId referansı - isteği gönderen kullanıcının ID'si
        ref: "User", // User modeline referans, populate ile kullanıcı bilgilerini çekebiliriz
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId, // isteği alan kullanıcının ID'si
        ref: "User",
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"], // sadece bu 3 değerden biri olabilir, enum ile kısıtlıyoruz
        default: "pending" // yeni oluşturulduğunda otomatik olarak "pending" (beklemede) olur
    }
}, { timestamps: true }) // timestamps:true ile createdAt ve updatedAt alanları otomatik eklenir

// Gelen/giden istek listeleri status ile filtreleniyor.
// Bilinçli olarak unique index kullanılmıyor: mevcut veritabanlarında aynı
// çift için birden fazla kayıt bulunabilir ve unique index sessizce
// oluşmayıp sorguları indexsiz bırakırdı. Mükerrerlik controller'da
// deleteMany/findOne ile zaten engelleniyor.
friendRequestSchema.index({ receiverId: 1, status: 1 });
friendRequestSchema.index({ senderId: 1, status: 1 });

const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);
// mongoose.model("FriendRequest", ...) → MongoDB'de "friendrequests" koleksiyonu oluşturur (otomatik küçük harf + çoğul)
export default FriendRequest;
