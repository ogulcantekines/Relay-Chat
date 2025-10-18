import { create } from 'zustand';

const useAuth = create((set) => ({
    // LocalStorage'dan kullanıcı bilgisini al veya null
    authUser: JSON.parse(localStorage.getItem('chat-user')) || null,
    
    // Kullanıcı bilgisini set et ve localStorage'a kaydet
    setAuthUser: (user) => {
        if (user) {
            localStorage.setItem('chat-user', JSON.stringify(user));//gelen nesne json formatına çevrilip localStorage'a kaydedilir
        } else {
            localStorage.removeItem('chat-user');
        }
        set({ authUser: user });
    },
    
    // Logout işlemi - kullanıcı bilgisini temizle
    logout: () => {
        localStorage.removeItem('chat-user');
        set({ authUser: null });
    },
    
    // Login durumunu kontrol et
    isAuthenticated: () => {
        const user = JSON.parse(localStorage.getItem('chat-user'));
        return !!user;
    }
}));

export default useAuth;
