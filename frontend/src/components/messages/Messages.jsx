import Message from "./Message";

const Messages = () => {
    return (
        <div className="md:min-w-[450px] flex flex-col overflow-auto sidebar-scrollbar">
            {/* Messages will be rendered here */}
            <Message />
            <Message />
            <Message /> 
            <Message />
            <Message />
            <Message />
        </div>
    );
}
export default Messages;
