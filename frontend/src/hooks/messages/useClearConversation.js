import {useState} from "react";
import toast from "react-hot-toast";
import useConversation from "../../zustand/useConversation";

const useClearConversation = () => {
    const [loading, setLoading] = useState(false); //yükleniyor durumu
    const {setMessages} = useConversation();

    const clearConversation = async (userToChatId) => {
        if (loading) return; // eğer zaten loading ise fonksiyonu çalıştırma
        setLoading(true);

        try{
            const res = await fetch(`/api/messages/clear/${userToChatId}`, { //backenddeki route a istek atıyoruz
                method: 'DELETE', //crud işleminden silme işlemi
                headers: {
                    'Content-Type': 'application/json' 
                }
            });

            const data = await res.json(); //response dan json formatında data alıyoruz onu js objesine çeviriyoruz
            // artık data bir js objesi! ✅

            if(res.ok) {
                toast.success(`${data.deletedCount} messages deleted successfully`);
                setMessages([]); // mesajları temizle, boş array yap
            } else {
                throw new Error(data.error || "Failed to clear conversation");
            }

            //error handling
        } catch (error) {
            toast.error(error.message || "An error occurred");
        } finally {
            setLoading(false);
        }

    };
    return { clearConversation, loading };

};

export default useClearConversation;
