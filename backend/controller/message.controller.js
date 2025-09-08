import mongoose from "mongoose";
import Conversation from "../models/conservation.model.js";
import Message from "../models/message.model.js";

export const sendMessage = async (req, res) => {
    try{
        const { id:receiverId } = req.params;
        const { message } = req.body;
        const senderId = req.userId;

        let conversation = await Conversation.findOne(
            { participants: { $all: [senderId, receiverId] } }
        );

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
                messages: []
            });
        }

        const newMessage = new Message({
            senderId: senderId,
            receiverId: receiverId,
            message: message,
        });

        if (newMessage) {
            conversation.messages.push(newMessage._id); 
        }
        // Save both the message and update the conversation
        //conversation.save(); works early
         await Promise.all([conversation.save(), newMessage.save()]);
       
        // Here you would typically handle the message sending logic
        res.send(`Message sent to conversation ${receiverId}: ${message}`);
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).send("Internal Server Error");
    }

};

export const getMessage = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const senderId = req.userId;

        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, userToChatId] }
        }).populate("messages");

        if (!conversation) {
            return res.status(200).json([]);
        }

        const messages = conversation.messages;
        res.status(200).json(messages);

    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

