import Conversation from "./Conversation";
import useGetConversations from "../../hooks/conversation/useGetConversations";

const Conversations = () => {
    // useGetConversations custom hook'u, conversations ve loading state'lerini döndürüyor
    const { loading, conversations } = useGetConversations();

    return (
        <div className="py-1 sm:py-2 flex flex-col overflow-y-auto scrollbar-thin">

            {/* conversations array'ini map ile dönüyoruz ve her bir conversation için Conversation bileşenini render ediyoruz
            map fonksiyonu, her bir conversation'ı alır ve Conversation bileşenine geçirir. Hepsini sırayla döner */}

            {conversations.map((conversation, idx) => (
                <Conversation
                    key={conversation._id}
                    conversation={conversation}
                    isLast={idx === conversations.length - 1}
                />
            ))}

            {loading && <div className="flex justify-center py-4"><span className="loading loading-spinner loading-sm"></span></div>}
        </div>
    );
}

export default Conversations;


