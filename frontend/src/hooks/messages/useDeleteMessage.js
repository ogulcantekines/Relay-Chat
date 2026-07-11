import { useState } from 'react';
import toast from 'react-hot-toast';
import useConversation from '../../zustand/useConversation';

// Mesaj silme: backend kaydı silmez, içeriğini gizler (isDeleted).
// Bu sayede sohbet akışındaki sıra bozulmaz ve karşı taraf da silindiğini görür.
const useDeleteMessage = () => {
    const [loading, setLoading] = useState(false);
    const { messages, setMessages } = useConversation();

    const deleteMessage = async (messageId) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/messages/${messageId}`, {
                method: "DELETE",
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to delete message");
            }

            // Silinen mesajı listede yerinde bırakıp içeriğini güncelliyoruz
            setMessages(messages.map(msg =>
                msg._id === messageId
                    ? { ...msg, message: data.deletedMessage.message, isDeleted: true }
                    : msg
            ));
            toast.success("Message deleted");
            return true;
        } catch (error) {
            toast.error(error.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { deleteMessage, loading };
};

export default useDeleteMessage;
