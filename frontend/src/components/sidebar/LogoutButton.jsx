import { BiLogOut } from 'react-icons/bi';
import useLogout from '../../hooks/auth/useLogout';

const LogoutButton = () => {
    const { loading, handleLogout } = useLogout();

    return (
        // Ortalanmış logout butonu - hover'da yumuşak kırmızı geçiş efekti
        <button
            className="w-full flex items-center justify-center gap-2 p-3 text-white rounded-lg hover:bg-red-500 transition-colors duration-200 disabled:opacity-50"
            onClick={handleLogout}
            disabled={loading}
        >
            <BiLogOut className="text-lg" />
            {/* Loading durumunda spinner, normal durumda logout metni */}
            {loading ? <span className="loading loading-spinner loading-sm"></span> : "Logout"}
        </button>
    );
}
export default LogoutButton;