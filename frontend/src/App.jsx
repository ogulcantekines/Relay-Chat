import Login from './pages/login/Login';
import SignUp from './pages/signup/SignUp';
import Home from './pages/home/Home';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuth from './zustand/useAuth';
import useSocket from './zustand/useSocket';
import { useEffect } from 'react';
import useListenMessages from './hooks/socket/useListenMessages';
import useListenFriendEvents from './hooks/socket/useListenFriendEvents';
import useUnreadCounts from './hooks/messages/useUnreadCounts';
import useDocumentTitle from './hooks/useDocumentTitle';
import useSession from './hooks/auth/useSession';

function App() {
    const userId = useAuth((state) => state.authUser?._id);
    const { connectSocket, disconnectSocket, socket } = useSocket();
    const { checking, error, retry } = useSession();

    useEffect(() => {
        if (userId && !checking) connectSocket();
        else disconnectSocket();
        return () => disconnectSocket();
    }, [userId, checking, connectSocket, disconnectSocket]);

    useEffect(() => {
        if (!socket) return;
        const onError = async (err) => {
            if (err.data?.code !== 'UNAUTHORIZED' && err.message !== 'Authentication required') return;
            try {
                const response = await fetch('/api/auth/me', { cache: 'no-store' });
                if (useSocket.getState().socket === socket && response.status === 401) useAuth.getState().logout();
            } catch { /* Keep the connection banner and retry control. */ }
        };
        const onDisconnect = async reason => {
            if (reason !== 'io server disconnect') return;
            // Password rotation replaces the cookie after disconnecting the old socket.
            await new Promise(resolve => setTimeout(resolve, 300));
            if (useSocket.getState().socket !== socket) return;
            try {
                const response = await fetch('/api/auth/me', { cache: 'no-store' });
                if (useSocket.getState().socket !== socket) return;
                if (response.status === 401) useAuth.getState().logout();
                else if (response.ok) socket.connect();
            } catch { /* The connection status stays visible. */ }
        };
        socket.on('disconnect', onDisconnect);
        socket.on('connect_error', onError);
        return () => { socket.off('connect_error', onError); socket.off('disconnect', onDisconnect); };
    }, [socket]);

    useListenMessages();
    useListenFriendEvents();
    useUnreadCounts();
    useDocumentTitle();

    return (
        <main className={`app-shell ${userId && !checking ? 'app-shell-chat' : 'app-shell-auth'}`}>
            {checking || error ? (
                <div className="surface-glass rounded-2xl p-8 max-w-sm text-center" role="status">
                    <div className="brand-badge w-12 h-12 rounded-2xl grid place-items-center mx-auto mb-4" aria-hidden="true">💬</div>
                    <h1 className="font-semibold mb-2">ChatApp</h1>
                    <p className="text-sm text-[color:var(--text-secondary)]">{error || 'Oturum kontrol ediliyor...'}</p>
                    {error && <button className="btn-primary-grad mt-5" onClick={retry}>Tekrar dene</button>}
                </div>
            ) : (
                <Routes>
                    <Route path="/" element={userId ? <Home key={userId} /> : <Navigate to="/login" replace />} />
                    <Route path="/login" element={userId ? <Navigate to="/" replace /> : <Login />} />
                    <Route path="/signup" element={userId ? <Navigate to="/" replace /> : <SignUp />} />
                    <Route path="*" element={<Navigate to={userId ? '/' : '/login'} replace />} />
                </Routes>
            )}
            <Toaster position="top-center" toastOptions={{ style: { background: 'var(--bg-elevated)', color: 'var(--text-primary)', border: '1px solid var(--border-strong)' } }} />
        </main>
    );
}
export default App;
