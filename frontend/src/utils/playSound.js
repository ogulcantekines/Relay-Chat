// Basit ses çalıcı
const playSound = (isChatOpen) => {
    try {
        const soundFile = isChatOpen ? '/message.mp3' : '/notification.mp3';
        const audio = new Audio(soundFile);
        audio.volume = 0.4;
        audio.play().catch(() => {
            // Tarayıcı otomatik oynatmayı engelleyebilir; bu bir hata değil
        });
    } catch {
        // Ses desteklenmiyorsa sessizce devam et
    }
};

export default playSound;