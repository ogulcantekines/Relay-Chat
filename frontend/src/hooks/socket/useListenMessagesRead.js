import { useEffect } from "react";
import useSocket from "../../zustand/useSocket";
import useConversation from "../../zustand/useConversation";
import useAuth from "../../zustand/useAuth";

const useListenMessagesRead = () => {
    const { socket } = useSocket(); //frontend side socket bağlantısı
    const { setMessages } = useConversation(); //zustanddan gerekli state ve fonksiyonları al
    //authUser ı alırken direkt objeyi alıyoruz çünkü burada sadece id'ye ihtiyacımız var
    //eğer useAuth((state) => state.authUser) yaparsak her authUser değiştiğinde bu hook yeniden çalışır ama yinede çalışır
    const { authUser } = useAuth();

    useEffect(() => {
        if (!socket || !authUser) return;

        socket.on("messagesRead", (data) => { //backendden gelen "messagesRead" eventini dinle, mesajları okuyan kişinin ID'si data içinde gelir
            const { readByUserId } = data;
            
            // Karşı taraf mesajlarımı okudu - kendi gönderdiğim mesajları güncelle
            setMessages(messages => messages.map(msg => {
            // Koşullar: Hangi mesajları güncelleyeceğiz?
            
                if (String(msg.senderId) === String(authUser._id) &&     // Ben gönderdim mi?
                    String(msg.receiverId) === String(readByUserId) &&   // Ona gönderildi mi?
                    !msg.isRead) {                                // Okunmamış mı? (false VEYA undefined)
                    return { ...msg, isRead: true }; // ✅ Bu mesajı okundu yap
                }   
                return msg; // ❌ Bu mesaja dokunma
            }));
        });

        return () => socket.off("messagesRead");

    }, [socket, setMessages, authUser]);
};

export default useListenMessagesRead;


/*1️⃣ MESAJ GÖNDERİMİ
   ↓
   Ali: socket.emit("sendMessage", { message: "Selam" })
   ↓
   Backend: sendMessage() çalışır
   ↓
   MongoDB: Yeni mesaj kaydedilir
   {
       senderId: "Ali",
       receiverId: "Sen",
       message: "Selam",
       isRead: false  ⬅️ Başta false (DB'ye kaydedildi!)
   }
   ↓
   Socket: Sana anlık gönderilir (online isen)

2️⃣ SEN CHATI AÇIYORSUN
   ↓
   Frontend: socket.emit("chatOpened", { otherUserId: "Ali" })
   ↓
   Backend: "chatOpened" eventi alınır
   ↓
   MongoDB: Message.updateMany() çalışır ⬅️ DB'de güncelleniyor!
   {
       senderId: "Ali",
       receiverId: "Sen",
       isRead: false  →  isRead: true ✅
   }
   ↓
   Socket: Ali'ye "messagesRead" eventi gönderilir
   ↓
   Ali'nin ekranında tikler güncellenir

3️⃣ SAYFA YENİLENİNCE
   ↓
   Frontend: getMessage API'sini çağırır
   ↓
   Backend: MongoDB'den mesajları getirir
   ↓
   Response: 
   [
       {
           message: "Selam",
           isRead: true  ⬅️ DB'den geliyor, kaybolmuyor!
       }
   ]
   ↓
   Frontend: Mesajları render eder
   ↓
   Ekranda zaten mavi tik (✓✓) görünür


   şunuda unutma socket io ile anlık olaylar yaparken listen adında bir hook oluşturup orada tüm socket.on olaylarını dinlemek en mantıklısı
   çünkü useEffect içinde dinlersen o component her render olduğunda useEffect tetiklenir ve socket.on tekrar tekrar eklenir
   bu da performans sorunlarına ve beklenmedik davranışlara yol açabilir
   o yüzden tüm socket.on olaylarını tek bir hookta toplayıp orada dinlemek en iyisi
   böylece componentler sadece gerekli olduğunda render olur ve socket olayları tek bir yerde yönetilir
   bu da kodun okunabilirliğini ve bakımını kolaylaştırır




*/ 
