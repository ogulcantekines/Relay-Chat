import useAuth from '../zustand/useAuth';

// Reject late responses from a previous account before a hook can update a store.
const apiFetch = async (url, options = {}) => {
    const version = useAuth.getState().sessionVersion;
    const ensureCurrentSession = () => {
        if (useAuth.getState().sessionVersion !== version) {
            throw new DOMException('Oturum değişti', 'AbortError');
        }
    };
    const response = await fetch(url, { credentials: 'same-origin', ...options });
    ensureCurrentSession();
    if (response.status === 401 && useAuth.getState().authUser) {
        useAuth.getState().logout();
        throw new DOMException('Oturum sona erdi', 'AbortError');
    }
    const readJson = response.json.bind(response);
    response.json = async () => {
        const data = await readJson();
        ensureCurrentSession();
        return data;
    };
    return response;
};
export default apiFetch;
