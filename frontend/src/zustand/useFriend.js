import { create } from "zustand";

// Arkadaşlık Sistemi Global State Yönetimi (Zustand Store)
// Bu store, arkadaşlık sistemiyle ilgili tüm verileri merkezi olarak tutar.
// Tüm componentler ve hook'lar bu store'a erişerek veri okur/yazar.
// Zustand'ın avantajı: Redux'a göre çok daha az boilerplate kod, direkt fonksiyon çağrısı ile state güncelleme.

const useFriendStore = create((set) => ({
    // ═══════════ STATE ═══════════
    friends: [],                  // Mevcut arkadaş listesi (kabul edilmiş arkadaşlıklar)
    incomingFriendRequests: [],   // Sana gelen beklemedeki arkadaşlık istekleri
    sentFriendRequests: [],       // Senin gönderdiğin beklemedeki arkadaşlık istekleri
    messageRequests: [],          // Arkadaş olmayan birinden gelen mesaj istekleri (pending conversation'lar)

    // ═══════════ ARKADAŞ LİSTESİ ACTIONS ═══════════

    // Tüm arkadaş listesini ayarla (sayfa yüklendiğinde useGetFriends hook'u çağırır)
    setFriends: (friends) => set({ friends }), //set({friends:friends}) ile aynı

    // spread operator ile mevcut listeye yeni arkadaşı ekler: [...eskiListe, yeniArkadaş]
    addFriend: (friend) => set((state) => ({
        friends: [...state.friends, friend]
    })),

    // Arkadaşı listeden çıkar (useRemoveFriend hook'u çağırır)
    removeFriend: (friendId) => set((state) => ({
        friends: state.friends.filter(f => f._id !== friendId) //filter dizide yazılan özelliği karşılayanlar olan yeni dizi döner
    })),

    // ═══════════ GELEN İSTEKLER ACTIONS ═══════════

    // Tüm gelen istekleri ayarla (useGetFriendRequests hook'u çağırır)
    setIncomingFriendRequests: (requests) => set({ incomingFriendRequests: requests }),

    // Yeni gelen istek ekle (socket.io üzerinden gerçek zamanlı bildirim geldiğinde)
    addIncomingFriendRequest: (request) => set((state) => ({
        incomingFriendRequests: [...state.incomingFriendRequests, request]
    })),

    // Gelen isteği listeden kaldır (kabul veya red edildiğinde)
    removeIncomingFriendRequest: (requestId) => set((state) => ({
        incomingFriendRequests: state.incomingFriendRequests.filter(r => r._id !== requestId)
    })),

    // ═══════════ GÖNDERİLEN İSTEKLER ACTIONS ═══════════

    // Tüm gönderilen istekleri ayarla (useGetSentRequests hook'u çağırır)
    setSentFriendRequests: (requests) => set({ sentFriendRequests: requests }),

    // Yeni gönderilen istek ekle
    addSentFriendRequest: (request) => set((state) => ({
        sentFriendRequests: [...state.sentFriendRequests, request]
    })),

    // Gönderilen isteği kaldır (iptal edildiğinde, useCancelRequest hook'u çağırır)
    removeSentFriendRequest: (requestId) => set((state) => ({
        sentFriendRequests: state.sentFriendRequests.filter(r => r._id !== requestId)
    })),

    // ═══════════ MESAJ İSTEKLERİ ACTIONS ═══════════

    // Mesaj isteklerini ayarla (useGetMessageRequests hook'u çağırır)
    // Bunlar arkadaş olunmadan gönderilen mesajlar, pending conversation'dan gelir
    setMessageRequests: (requests) => set({ messageRequests: requests })
}));
export default useFriendStore;

/*
📌 STORE KULLANIM AKIŞI:
┌─────────────────────────────────────────────────────────────┐
│                    useFriendStore                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  useGetFriends()        → setFriends([...])                │
│  useGetFriendRequests() → setIncomingFriendRequests([...])  │
│  useGetSentRequests()   → setSentFriendRequests([...])      │
│  useGetMessageRequests()→ setMessageRequests([...])         │
│                                                             │
│  useRespondToFriendRequests() → addFriend() + removeIncoming│
│  useRemoveFriend()            → removeFriend()              │
│  useCancelRequest()           → removeSentFriendRequest()   │
│  Socket.IO bildirimi          → addIncomingFriendRequest()  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
*/