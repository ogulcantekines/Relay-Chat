import { useEffect, useState } from 'react';
import apiFetch from '../../utils/apiFetch';

const useSearchUsers = searchQuery => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        const query = searchQuery.trim();
        const controller = new AbortController();
        setUsers([]);
        setError('');
        if (query.length < 2) { setLoading(false); return; }
        setLoading(true);
        const timeout = setTimeout(async () => {
            try {
                const response = await apiFetch(`/api/friends/search?query=${encodeURIComponent(query)}`, { signal: controller.signal });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || data.error || 'Arama yapılamadı.');
                if (!controller.signal.aborted) setUsers(data);
            } catch (err) {
                if (err.name !== 'AbortError') setError(err.message);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }, 350);
        return () => { clearTimeout(timeout); controller.abort(); };
    }, [searchQuery]);
    return { users, loading, error };
};
export default useSearchUsers;
