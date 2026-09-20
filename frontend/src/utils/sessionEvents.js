export const notifySessionChange = () => {
    try { localStorage.setItem('chat-session-change', String(Date.now())); } catch { /* Optional cross-tab hint. */ }
};
