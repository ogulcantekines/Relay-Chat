import apiFetch from '../../utils/apiFetch';
import {useState} from 'react';
import toast from 'react-hot-toast';
import useConversation from '../../zustand/useConversation';

const useEditMessage = () =>{
    const [loading , setLoading] = useState(false);
    const { setMessages } = useConversation();

    const editMessage = async (messageId, newMessage) => {
        setLoading(true);
        try{
            const res = await apiFetch(`/api/messages/edit/${messageId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({newMessage}),
            });

            const data = await res.json();
            if(!res.ok){
                throw new Error(data.error || "Mesaj düzenlenemedi");
            }

            //burada map ile mesajları dolaşıp düzenlenen mesajı bulup güncelliyoruz. güncelleme kısmında spreading var
            setMessages(messages => messages.map(msg =>
                msg._id === messageId ? {...msg, message: data.updatedMessage.message,
                     isEdited: data.updatedMessage.isEdited, 
                     editedAt: data.updatedMessage.editedAt} 
                     : msg
            ));
            toast.success("Mesaj düzenlendi");
            return true;  // ✅ Başarılı
        }catch (error){
            if (error.name !== 'AbortError') toast.error(error.message);
            return false;  // ✅ Hata
        }finally {
            setLoading(false);
        }
    }

    return {editMessage, loading};
}

export default useEditMessage;


/*mesaj düzenlemenin mantığını açıklayan notlar

msg = {
  _id: "def456",
  senderId: "user1",
  receiverId: "user2",
  message: "Nasılsın",
  isEdited: false,
  editedAt: null,
  createdAt: "2025-10-18T10:00:00"
}


data.updatedMessage = {
  message: "Nasılsın canım", // YENİ
  isEdited: true,            // YENİ
  editedAt: "2025-10-18T10:05:00" // YENİ
}


{
  _id: "def456",           // ← Eski (korundu)
  senderId: "user1",       // ← Eski (korundu)
  receiverId: "user2",     // ← Eski (korundu)
  message: "Nasılsın canım", // ← YENİ (üzerine yazıldı)
  isEdited: true,           // ← YENİ (üzerine yazıldı)
  editedAt: "2025-10-18T10:05:00", // ← YENİ (üzerine yazıldı)
  createdAt: "2025-10-18T10:00:00" // ← Eski (korundu)
}
*/