// Basit ses çalıcı
const playSound = (isChatOpen) => {
    try {
        const soundFile = isChatOpen ? '/message.mp3' : '/notification.mp3';
        const audio = new Audio(soundFile);
        audio.volume = 0.4;
        audio.play().catch(error => {
            console.log('Could not play sound:', error);
        });
    } catch (error) {
        console.log('Audio not supported:', error);
    }
};

export default playSound;