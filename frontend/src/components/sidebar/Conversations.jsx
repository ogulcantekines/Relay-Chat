import Conversation from "./Conversation";

const Conversations = () => {
    return (
        <div className="py-2 flex flex-col h-full overflow-auto sidebar-scrollbar">
            <Conversation />
            <Conversation />
            <Conversation />
            <Conversation />
            <Conversation />
            <Conversation />
        </div>
    );
}
export default Conversations;
