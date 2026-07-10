import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId, //referans aldığı User nesnelerinin id lerini tutar
        ref: "User" // User modeline referans
    }],

    messages: [{
        type: mongoose.Schema.Types.ObjectId, // referans aldığı Message nesnelerinin id lerini tutar
        ref: "Message", // Message modeline referans
        default: []
    }],

    status: {
        type: String,
        enum: ["active", "pending"],
        default: "active"
    },
    //createdAt and updatedAt fields
}, { timestamps: true });

const Conversation = mongoose.model("Conversation", conversationSchema); //conversations collection
export default Conversation;


