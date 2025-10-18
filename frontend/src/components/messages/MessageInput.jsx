import { useState, useRef } from "react";
import useSendMessage from "../../hooks/messages/useSendMessage";
import useSocket from "../../zustand/useSocket";
import useConversation from "../../zustand/useConversation";
import { IoSend } from "react-icons/io5";

const MessageInput = () => {

    const [message, setMessage] = useState("");
    const { loading, sendMessage } = useSendMessage();// useSendMessage hook'undan loading durumu ve sendMessage fonksiyonunu al
    const { socket } = useSocket();// Socket bağlantısını al (typing status göndermek için)
    const { selectedConversation } = useConversation();// Seçili conversation'ı al (kime mesaj gönderiyoruz?)

    //Ref kısmı. unutma anlık render gerektirmeyen kutu gibi düşünebiliriz
    const typingTimeoutRef = useRef(null); // Typing timeout referansı (kullanıcı yazmayı bıraktığında stopTyping emit etmek için)
    const inputRef = useRef(null);// Input elementine referans (mesaj gönderdikten sonra tekrar focus için). bunu boş kutu gibi düşünebiliriz, current özelliği anlık tuttuğu değere erişmemizi sağlar

    const handleSubmit = async (e) => {// Form submit olduğunda (Enter tuşu veya Send butonu)
        e.preventDefault();
        if (!message.trim() || loading) return;  // Boş mesaj veya loading durumunda hiçbir şey yapma

        // Mesaj göndermeden önce "typing" durumunu durdur
        if (selectedConversation && socket && socket.connected) {
            socket.emit("stopTyping", { receiverId: selectedConversation._id });
        }
        await sendMessage(message); // Mesajı backend'e gönder (await ile bekle)
        setMessage(""); // Input'u temizle

        // Mesaj gönderdikten sonra input'a tekrar focus yap (kullanıcı yazıya devam edebilsin)
        setTimeout(() => {
            inputRef.current?.focus();
        }, 0);
    };

    const handleTyping = (e) => { // Input'a her karakter yazıldığında çalışır
        setMessage(e.target.value);
        if (!selectedConversation || !socket || !socket.connected) return; // Eğer conversation seçili değilse veya socket bağlı değilse typing emit etme

        // Karşı tarafa "typing" sinyali gönder,Backend side socket.js de bu sinyali dinleyip ilgili kullanıcıya "userTyping" eventini emit ediyor
        socket.emit("typing", { receiverId: selectedConversation._id }); //{ receiverId: selectedConversation._id } nesne ve backenddeki socket.on("typing", (data) daki data parametresine karşılık gelir

        // Eğer daha önce bir timeout varsa iptal et (kullanıcı hala yazıyor demektir)
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        // 2 saniye boyunca yeni karakter gelmezse "stopTyping" emit et
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("stopTyping", { receiverId: selectedConversation._id });
        }, 2000);
    };
    // mesela t tuşuna basıldı ve typingtimeoutRef.current = setTimeout(...) çalıştı ona bu timeoutun
    // id si atandı. sonra e tuşuna basıldı ve handleTyping tekrar çalıştı.
    // şimdi typingTimeoutRef.current var yani if'e girdi ve clearTimeout(typingTimeoutRef.current) ile o id'li timeout iptal edildi.
    // sonra yeniden typingTimeoutRef.current = setTimeout(...) ile yeni bir timeout kuruldu.
    // bu şekilde her tuşa basıldığında eski timeout iptal edilip yenisi kuruluyor.
    // sonuçta kullanıcı yazmayı bıraktığında sadece 1 kez stopTyping emit edilecek (son tuştan 2 saniye sonra)
    // eğer clearTimeout kullanmasaydık her tuş için ayrı ayrı stopTyping emit edilecekti (spam gibi olurdu)

    return (
        <form className="px-4 my-3" onSubmit={handleSubmit}>
            <div className="w-full relative">
                {/* Mesaj input'u */}
                <input
                    ref={inputRef} // Referans ekle. bu içinde bulunduğu input elementine erişmemizi sağlar
                    // inputRef = { current: HTMLInputElement objesi } ← Real DOM objesi burada! bu input real dom a dönüşür ve inputRef e atanır.
                    //Ref de zaten kutu gibi düşün yani değer tutar. o anlık değerine erişmek için inputRef.current deriz. ve bu artık real dom objesi olur
                    // inputRef.current.focus() → Bu şekilde DOM elementinin focus() metodunu çağırabiliriz.
                    // Mesaj gönderildikten sonra input'a tekrar focus yapmak için kullanacağız.
                    type="text"
                    placeholder="Type a message..."
                    className="border text-sm rounded-lg block w-full p-2.5 pr-12 bg-gray-700 border-gray-600 text-white"
                    value={message} // State'ten değer al
                    onChange={handleTyping} // Her karakterde typing sinyali gönder
                    disabled={loading} // Mesaj gönderilirken input'u devre dışı bırak
                />

                {/* Send butonu (input'un sağ tarafında, absolute position) */}
                <button
                    type="submit"
                    className="absolute inset-y-0 end-0 flex items-center pe-3"
                    disabled={loading} // Mesaj gönderilirken butonu devre dışı bırak
                >
                    {/* Loading durumundaysa spinner, değilse send ikonu göster */}
                    {loading ? (
                        <span className="loading loading-spinner"></span>
                    ) : (
                        <IoSend className="text-2xl text-gray-400 hover:text-gray-200" />
                    )}
                </button>
            </div>
        </form>
    );
};

export default MessageInput;

/* 

🔑 REF vs STATE:
   ├─ useState → UI'da görünecek değerler için (message, loading)
   │             Değişince render tetikler, ekran güncellenir
   │
   └─ useRef → UI'da görünmeyen değerler için (timeout ID, DOM referansı)
               Değişince render tetiklemez, arka planda saklanır
               
💡 NEDEN REF KULLANIYORUZ?
   ├─ typingTimeoutRef → setTimeout ID'sini saklamak için
   │                      Her tuşta eski timeout'u iptal edip yenisini kuruyoruz
   │                      State olsaydı gereksiz render tetiklenirdi
   │
   └─ inputRef → DOM <input> elementine erişmek için
                 Mesaj gönderdikten sonra programatik focus yapmak için
                 
⏰ TIMEOUT MANTĞI (Typing Debounce):
   1. Kullanıcı "M" yazdı → typing gönder + 2s zamanlayıcı kur (ID: 12345)
   2. Kullanıcı "e" yazdı → ESKİ zamanlayıcıyı iptal et (clearTimeout(12345))
                            typing gönder + YENİ 2s zamanlayıcı (ID: 67890)
   3. 2s boyunca yeni tuş gelmezse → stopTyping gönder
   
   ✅ Sonuç: stopTyping sadece 1 kez gönderilir (son tuştan 2s sonra)
   ❌ İptal etmezsek: Her tuş için stopTyping gönderilir (spam!)
   
🎯 FOCUS MANTĞI:
   ├─ setMessage("") → Input temizlendi (React render ediyor...)
   │
   └─ setTimeout(() => inputRef.current?.focus(), 0)
      └─ Neden setTimeout? → React'in render'ı tamamlamasını beklemek için
         Render bitmeden focus çağırırsak DOM henüz hazır olmayabilir
         
📝 ÖZET:
   • message state → Ekranda gösteriliyor (UI)
   • typingTimeoutRef → Timeout ID saklanıyor (arka plan)
   • inputRef → DOM elementine erişim (focus için)
   • clearTimeout → Eski alarmı iptal et, yenisini kur (debounce)
   • setTimeout(..., 0) → Render tamamlanınca çalışsın (focus için)

═══════════════════════════════════════════════════════════════════
════
*/
