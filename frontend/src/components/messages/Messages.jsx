import Message from "./Message";
import useGetMessages from "../../hooks/messages/useGetMessages";
import MessageSkeleton from "../skeletons/MessageSkeleton";
import { useEffect, useRef } from "react";

// Tarih ayırıcı komponenti - mesajlar arasında "Today", "Yesterday" veya tam tarih gösterir

const DateSeparator = ({ date }) => {
    // Timestamp'i okunabilir formata çeviren fonksiyon
    const formatDate = (timestamp) => {
        const today = new Date(); // Bugünün tarihi
        const messageDate = new Date(timestamp); // Mesajın tarihi

        // Eğer mesaj bugün atıldıysa "Today" yazdır
        if (messageDate.toDateString() === today.toDateString()) {
            return "Today";
        }

        // Eğer mesaj dün atıldıysa "Yesterday" yazdır
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1); // Bugünden 1 gün geriye git
        if (messageDate.toDateString() === yesterday.toDateString()) {
            return "Yesterday";
        }

        // Daha eski mesajlar için tam tarih göster (örn: "5 October 2025")
        return messageDate.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="flex justify-center my-3">
            {/* Gri arka planlı, yuvarlatılmış tarih etiketi */}
            <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                {formatDate(date)}
            </span>
        </div>
    );
};

const Messages = () => {
    // useGetMessages hook'undan mesajları ve loading durumunu al
    const { loading, messages } = useGetMessages();
    const lastMessageRef = useRef(); // Son mesaja referans oluştur (otomatik scroll için). son mesajın dom parçasına erişmek için kullanılır.

    useEffect(() => {

        setTimeout(() => {// 100ms bekle (DOM'un render olması için) sonra scroll yap
            lastMessageRef.current?.scrollIntoView({ behavior: "smooth" }); // Yumuşak scroll animasyonu
        }, 100);
    }, [messages]); // messages değiştiğinde bu effect tekrar çalışır

    // İki mesaj arası-nda tarih ayırıcısı gösterilmeli mi kontrol et
    const shouldShowDate = (currentMsg, prevMsg) => {
        if (!prevMsg) return true; // İlk mesaj ise kesinlikle tarih göster

        // Her iki mesajın tarihlerini al
        const current = new Date(currentMsg.createdAt || currentMsg.timestamp);
        const previous = new Date(prevMsg.createdAt || prevMsg.timestamp);

        // Günler farklıysa tarih ayırıcısı göster (toDateString sadece gün/ay/yıl karşılaştırır, saat yok)
        return current.toDateString() !== previous.toDateString();
    };

    return (
        <div
            className="md:min-w-[450px] flex flex-col overflow-y-scroll overflow-x-hidden px-4 flex-1"
            style={{ scrollbarWidth: 'thin', maxHeight: '445px' }}
        >
            {/* DURUM 1: Mesajlar yüklendi ve liste doluysa */}
            {!loading && messages.length > 0 && messages.map((message, index) => (
                <div
                    key={message._id}
                    ref={index === messages.length - 1 ? lastMessageRef : null} // Son mesaja ref ekle
                >
                    {/* Önceki mesajla farklı günse tarih ayırıcısı göster */}
                    {shouldShowDate(message, messages[index - 1]) && (
                        <DateSeparator date={message.createdAt || message.timestamp} />
                    )}
                    {/* Mesajı render et */}
                    <Message message={message} />
                </div>
            ))}
            {/* Bu durumda tüm mesajlar map ile döner ve render edilir fakat ref ve onun
            koşul durumu var ve index === messages.length - 1 sağladığı zaman ref lastMessageRef'e atanır
            lastMessageRef değeri render içinde bulunduğu dom parçasını temsil eder ve sonunda
            lastMessageRef.current?.scrollIntoView({ behavior: "smooth" }); null olmaktan çıkıp o mesajın olduğu 
            dom parçasını temsil eder ve scrollIntoView() metodu o mesaja scroll yapar. o mesajın divi artık ref
            e atanmış olur ve ekranda gözükmesi için scroll yapılır.
             */}

            {/* DURUM 2: Mesajlar yükleniyorsa skeleton (iskelet) göster */}
            {loading && Array.from({ length: 3 }).map((_, idx) => <MessageSkeleton key={idx} />)}

            {/* DURUM 3: Mesajlar yüklendi ama liste boşsa placeholder göster */}
            {!loading && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <p>No messages yet. Start the conversation!</p>
                </div>
            )}
        </div>
    );
}
export default Messages;

/* zaman ayracı olmadanki orijinal kod bugün,dün ayracı yok

import Message from "./Message";
import useGetMessages from "../../hooks/useGetMessages";
import MessageSkeleton from "../skeletons/MessageSkeleton";
import useListenMessages from "../../hooks/useListenMessages";
import { useEffect, useRef } from "react";

const Messages = () => {
    const { loading, messages } = useGetMessages();
    const lastMessageRef = useRef();
    useListenMessages(); // Real-time mesaj dinleme

    useEffect(() => {
        setTimeout(() => {
            lastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    }, [messages]);

    return (
        <div className="md:min-w-[450px] flex flex-col overflow-y-scroll overflow-x-hidden px-4 flex-1" style={{scrollbarWidth: 'thin', maxHeight: '445px'}}>
            {// Messages will be rendered here }
            {!loading && messages.length > 0 && messages.map((message) => (
                <div key={message._id} ref={lastMessageRef}>
                    <Message message={message} />
                </div>
            ))}

            {loading && Array.from({ length: 3 }).map((_, idx) => <MessageSkeleton key={idx} />)}

            {!loading && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <p>No messages yet. Start the conversation!</p>
                </div>
            )}
        </div>
    );
}
export default Messages;
*/

