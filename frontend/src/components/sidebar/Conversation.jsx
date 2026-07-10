import useConversation from "../../zustand/useConversation";
import useSocket from "../../zustand/useSocket";
import { FaClock } from "react-icons/fa";
import useGlobalTyping from "../../hooks/socket/useGlobalTyping"; // Tüm konuşmalar için global yazıyor hook'u


const Conversation = (props) => {

  const { selectedConversation, setSelectedConversation } = useConversation();// seçilen conversation'ı almak ve ayarlamak için zustand store'dan fonksiyonlar
  const { onlineUsers } = useSocket();
  const { isUserTyping } = useGlobalTyping(); // Tüm konuşmalardaki yazıyor durumunu kontrol et

  const isSelected = selectedConversation?._id === props.conversation._id; // Bu conversation'ın seçili olup olmadığını kontrol et. ? optional chaining ile güvenli erişim. eğer undefined ise hata vermez.
  const isOnline = onlineUsers.includes(props.conversation._id);
  const isThisUserTyping = isUserTyping(props.conversation._id); // Bu kullanıcının yazıyor olup olmadığını kontrol et
  const isPending = props.conversation.status === 'pending';

  return (

    <>
      <div className={`flex gap-2 items-center hover:bg-sky-500 rounded p-2 py-4 cursor-pointer 
          ${isSelected ? 'bg-sky-500' : ''}`}
        onClick={() => setSelectedConversation(props.conversation)}>

        {/* Avatar - online/offline göstergesi ile */}
        <div className={`avatar ${isOnline ? 'online' : 'offline'}`}>
          <div className="w-12 rounded-full">
            <img src={props.conversation.profilePic} />
          </div>
        </div>

        <div className="flex flex-col flex-1">
          <div className="flex items-center justify-between">

            {/* Kullanıcı adı */}
            <div className="font-semibold text-white">{props.conversation.fullName}</div>

            {/* EĞER BEKLEYEN İSTEKSE SAAT İKONUNU GÖSTER */}
            {isPending && (
              <FaClock className="text-amber-500 text-xs" title="Waiting for reply" />
            )}

            {/* Global yazıyor göstergesi - aktif sohbette olmasa bile göster. eğer yazma durumu true ise yani yazıyorsa göster */}
            {isThisUserTyping && (
              <div className="flex items-center gap-1">
                <div className="flex gap-1">
                  {/* Gecikmeyle sıralı animasyon yapan yuvarlak noktalar */}
                  <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-1 h-1 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}

          </div>

          <div className="text-sm text-white">
            {/* eğer doğruysa ilk durum olan yazıyor metnini göster yanlışsa ikinci durum olan last message yazısını göster*/}
            {isThisUserTyping ? (
              <span className="text-white italic">typing...</span>
            ) : isPending ? (
              <span className="text-amber-500 italic">Waiting for reply</span>
            ) : (
              "last message..."
            )}
          </div>
        </div>

      </div>

      {!props.isLast && <div className="divider my-0 py-0 h-1"></div>}
      {/*bu && operatörü doğru olması için ikiside doğru olmalı ya yani yanlış olursa diğer koşula bakılmıyor bile doğruysa sadece işleme geçiyor*/}
    </>
  );
}
export default Conversation;