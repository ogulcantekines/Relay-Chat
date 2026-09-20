import { create } from 'zustand';

const useConversation = create((set) => ({
    selectedConversation: null,
    setSelectedConversation: (conversation) => set((state) => ({
        selectedConversation: conversation,
        ...(state.selectedConversation?._id !== conversation?._id ? { messages: [] } : {}),
    })),
    messages: [],
    setMessages: (messages) => set((state) => ({
        messages: typeof messages === 'function' ? messages(state.messages) : messages,
    })),
    conversations: [],
    setConversations: (conversations) => set((state) => ({
        conversations: typeof conversations === 'function' ? conversations(state.conversations) : conversations,
    })),
    isConversationsLoaded: false,
    setIsConversationsLoaded: (value) => set({ isConversationsLoaded: value }),
    reset: () => set({ selectedConversation: null, messages: [], conversations: [], isConversationsLoaded: false }),
}));
export default useConversation;
