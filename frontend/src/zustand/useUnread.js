import { create } from "zustand";

// Gönderen bazında okunmamış mesaj sayıları: { "<userId>": 3 }
// Kenar çubuğundaki rozetler ve sekme başlığındaki toplam bu store'dan okunur.
const useUnread = create((set) => ({
    counts: {},

    setCounts: (counts) => set({ counts }),

    // Yeni mesaj geldiğinde ilgili göndericinin sayacını artır
    increment: (senderId) => set((state) => ({
        counts: {
            ...state.counts,
            [senderId]: (state.counts[senderId] || 0) + 1
        }
    })),

    // Sohbet açıldığında o kişinin sayacını sıfırla
    clear: (senderId) => set((state) => {
        if (!state.counts[senderId]) return state; // gereksiz render'ı önle
        const next = { ...state.counts };
        delete next[senderId];
        return { counts: next };
    }),

    reset: () => set({ counts: {} })
}));

export default useUnread;
