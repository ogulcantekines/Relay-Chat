import { BiLogOut } from 'react-icons/bi';
import useLogout from '../../hooks/auth/useLogout';

const LogoutButton = () => {
    const { loading, handleLogout } = useLogout();

    return (
        // Ortalanmış logout butonu - hover'da yumuşak kırmızı geçiş efekti
        <button
            className="w-full flex items-center justify-center gap-2 p-3 text-sm rounded-lg transition-colors duration-200 disabled:opacity-50 hover:bg-red-500/15"
            style={{ color: 'var(--text-secondary)' }}
            onClick={handleLogout}
            disabled={loading}
        >
            <BiLogOut className="text-lg" />
            {/* Loading durumunda spinner, normal durumda logout metni */}
            {loading ? "Çıkılıyor..." : "Çıkış yap"}
        </button>
    );
}
export default LogoutButton;