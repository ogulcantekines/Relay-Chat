import { useEffect } from 'react';
import useUnread from '../../zustand/useUnread';
import useAuth from '../../zustand/useAuth';
import useSocket from '../../zustand/useSocket';
import apiFetch from '../../utils/apiFetch';

const useUnreadCounts = () => {
    const userId = useAuth(state => state.authUser?._id);
    const connectionVersion = useSocket(state => state.connectionVersion);
    useEffect(() => {
        if (!userId) return;
        const controller = new AbortController();
        (async () => {
            try {
                const response = await apiFetch('/api/messages/unread/counts', { signal: controller.signal });
                if (!response.ok) return;
                const counts = await response.json();
                if (!controller.signal.aborted) useUnread.getState().setCounts(counts);
            } catch { /* A reconnect refreshes unread counts again. */ }
        })();
        return () => controller.abort();
    }, [userId, connectionVersion]);
};
export default useUnreadCounts;
