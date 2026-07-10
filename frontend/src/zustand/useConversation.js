import { create } from 'zustand';

const useConversation = create((set) => ({
    selectedConversation: null,
    setSelectedConversation: (conversation) => set({ selectedConversation: conversation }),
    
    messages: [],
    setMessages: (messages) => set({ messages: messages }), //set({ messages }) da olur
    
    conversations: [],
    setConversations: (conversations) => set({ conversations }),
    // 🔥 Cache Flag: Conversations yüklendi mi? (Boş olsa bile true olur)
    isConversationsLoaded: false,
    setIsConversationsLoaded: (value) => set({ isConversationsLoaded: value }),
}));

export default useConversation;