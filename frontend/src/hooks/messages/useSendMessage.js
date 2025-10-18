import { useState } from "react";
import toast from "react-hot-toast";
import useConversation from "../../zustand/useConversation";

const useSendMessage = () => {
    const [loading, setLoading] = useState(false);
    const {messages, setMessages, selectedConversation} = useConversation();

    const sendMessage = async (message) => {
        if(!selectedConversation) {
            toast.error("No conversation selected");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`/api/messages/send/${selectedConversation._id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: message })
            });

            if (res.ok) {
                const data = await res.json(); 
                console.log('Message sent:', data);
                toast.success("Message sent successfully");

                setMessages([...messages, data]);
            } else {
                throw new Error("Failed to send message");
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return { loading, sendMessage };
};

export default useSendMessage;


/* socket üzerinden anlık mesajlaşma yapılırsa

import { useState } from "react";
import toast from "react-hot-toast";
import useConversation from "../zustand/useConversation";
import useSocket from "../zustand/useSocket";
import useAuth from "../zustand/useAuth";

const useSendMessage = () => {
    const [loading, setLoading] = useState(false);
    const { messages, setMessages, selectedConversation } = useConversation();
    const { socket } = useSocket();
    const { authUser } = useAuth();

    const sendMessage = async (message) => {
        if (!selectedConversation) {
            toast.error("No conversation selected");
            return;
        }
        
        if (!socket) {
            toast.error("Socket not connected");
            return;
        }

        setLoading(true);
        
        try {
            // HTTP yerine Socket kullan
            socket.emit("sendMessage", {
                receiverId: selectedConversation._id,
                message: message,
                senderId: authUser?._id
            });
            
            toast.success("Message sent successfully");
            
            // Gönderilen mesajı hemen local state'e ekle (optimistic update) using real authUser._id
            const newMessage = {
                _id: Date.now(), // Geçici ID
                senderId: authUser?._id || "",
                receiverId: selectedConversation._id,
                message: message,
                timestamp: Date.now()
            };
            
            setMessages([...messages, newMessage]);
            
        } catch {
            toast.error("Failed to send message");
        } finally {
            setLoading(false);
        }
    };

    return { loading, sendMessage };
};

export default useSendMessage;
*/
