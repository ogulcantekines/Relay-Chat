import Messages from "./Messages";
import MessageInput from "./MessageInput";
import { TiMessages } from "react-icons/ti";
import useConversation from "../../zustand/useConversation";
import useSocket from "../../zustand/useSocket";
import useListenTyping from "../../hooks/socket/useListenTyping";
import useListenMessagesRead from "../../hooks/socket/useListenMessagesRead";
import useClearConversation from "../../hooks/messages/useClearConversation";
import useListenEditedMessages from "../../hooks/socket/useListenEditedMessages";
import { useEffect } from "react";

const MessageContainer = () => {

    const { selectedConversation } = useConversation(); // seçilen conversation'ı alıyoruz conversations kısmında seçimi yapıyoruz burada gösteriyoruz
    const { onlineUsers, socket } = useSocket(); // Online kullanıcıları almak için useSocket kullanılıyor, socket.on("getOnlineUsers") ile aldığımız arrayi onlineUsers[] arrayine atamıştık ve burada onu çağırıyoruz.
    const { isTyping } = useListenTyping();// yazıyor durumu
    const { clearConversation, loading } = useClearConversation();// sohbeti temizleme fonksiyonu ve yükleniyor durumu

    useListenMessagesRead(); // Okundu bildirimlerini dinle
    useListenEditedMessages(); // Düzenlenen mesajları dinle

    // Chat açıldığında backend'e bildir, okundu bilgisi ile ilgili işlemler için
    //burada soldaki conversationslardan birine tıklayınca selectedConversation değişiyor ve useEffect tetikleniyor
    useEffect(() => {
        if (selectedConversation && socket) { // Eğer bir sohbet seçiliyse ve socket bağlantısı varsa
            socket.emit("chatOpened", { //frontendden backende chatOpened eventini emit ediyoruz
                otherUserId: selectedConversation._id
            });
        }
    }, [selectedConversation, socket]); //sohbet değişince veya socketle bağlantı kurulumu veya koptuğunda tekrar çalışır

    // Sohbeti temizle butonuna tıklanınca çalışır
    const handleClearChat = () => {
        if (selectedConversation) { //seçilen bir sohbet varsa
            clearConversation(selectedConversation._id);
        }
    };

    const noChatSelected = !selectedConversation;  // Eğer selectedConversation null ise yani hiçbir sohbet seçilmediyse true olur, eğer bir sohbet seçildiyse false olur
    const isOnline = selectedConversation && onlineUsers.includes(selectedConversation._id); // selectedConversation null değilse(falsy) ve onlineUsers arrayi içinde selectedConversation._id varsa true olur, yoksa false olur
    //eğer selected conversations yoksa isOnline sorgusuna gerek kalmıyor. çünkü chat içinde isOnline gösteriyoruz, chat yoksa isOnline da anlamsız.

    return (
        <div className="md:min-w-[450px] flex flex-col h-full">
            {noChatSelected ? <NoChatSelected /> : (<> {/* Eğer noChatSelected true ise yani hiçbir sohbet seçilmediyse NoChatSelected bileşenini göster, false ise yani bir sohbet seçildiyse asıl mesaj bileşenlerini göster */}

                <div className="bg-slate-500 px-4 py-2 mb-2 flex-shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="label-text">To:</span>
                        <span className="text-gray-900 font-bold">{selectedConversation.fullName}</span>

                        {/* Yazıyor durumu ve online/offline durumu, eğer yazıyorsa bu 3 mavi nokta typing göster */}
                        {isTyping && (
                            <div className="flex items-center gap-1">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                                <span className="text-blue-400 text-xs font-medium">typing...</span>
                            </div>
                        )}

                        {/* Online durumu */}
                        {!isTyping && isOnline && (
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-green-600 text-xs font-medium">Online</span>
                            </div>
                        )}

                        {/* Offline durumu */}
                        {!isTyping && !isOnline && (
                            <span className="text-red-500 text-sm">Offline</span>
                        )}
                    </div>

                    {/* Sohbeti temizle butonu */}
                    <button
                        onClick={handleClearChat}
                        disabled={loading}
                        className="btn btn-sm btn-error btn-outline"
                        title="Clear chat"
                    >
                        {loading ? "..." : "🗑️ Clear Chat"}
                    </button>

                </div>

                {/* Messages - Expandable */}
                <div className="flex-1 overflow-hidden">
                    <Messages />
                </div>

                {/* Input - Fixed at bottom */}
                <div className="flex-shrink-0"> {/* input kısmı hep altta sabit kalacak */}
                    <MessageInput />
                </div>
            </>)}
        </div>
    );
}
export default MessageContainer;

const NoChatSelected = () => { // Hiçbir sohbet seçilmediğinde gösterilecek bileşen
    return (
        <div className='flex items-center justify-center w-full h-full'>
            <div className='px-4 text-center sm:text-lg md:text-xl text-gray-200 font-semibold flex flex-col items-center gap-2'>
                <p>Welcome 👋 ❄</p>
                <p>Select a chat to start messaging</p>
                <TiMessages className='text-3xl md:text-6xl text-center' />
            </div>
        </div>
    );
};
export { NoChatSelected };