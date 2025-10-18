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
        required: true
    },
    isRead:{ //bunu okundu özelliği için ekledik. çağırmasak bile otomatik artık messages collectionına bir nesne eklersek isRead false olarak gelecek
        type: Boolean,
        default: false
    },

    isEdited:{ // mesaj düzenleme özelliği için eklendi
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

const Message = mongoose.model("Message", messageSchema);
export default Message;

