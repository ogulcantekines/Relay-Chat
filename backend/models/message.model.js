import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({

    senderId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiverId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    message:{
        type: String,
        required: true,
        maxlength: 2000 // sınırsız gövde ile veritabanını şişirmeyi engeller
    },
    isRead:{ //bunu okundu özelliği için ekledik. çağırmasak bile otomatik artık messages collectionına bir nesne eklersek isRead false olarak gelecek
        type: Boolean,
        default: false
    },

    isEdited:{ // mesaj düzenleme özelliği için eklendi
        type: Boolean,
        default: false
    },

    isDeleted:{ // mesaj silme: kayıt korunur, içeriği gizlenir
        type: Boolean,
        default: false
    },
    editedAt:{ // mesaj düzenleme özelliği için eklendi
        type: Date,
        default: null
    }, 
    
    timestamp:{
        type: Date,
        default: Date.now
    }
});

// Sorgu desenlerine göre index'ler:
// - okunmamış mesajları işaretleme/sayma: { senderId, receiverId, isRead }
// - sohbeti tarihe göre sıralama: { timestamp }
messageSchema.index({ senderId: 1, receiverId: 1, isRead: 1 });
messageSchema.index({ timestamp: -1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;

