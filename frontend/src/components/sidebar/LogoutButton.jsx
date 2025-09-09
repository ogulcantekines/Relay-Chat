import {BiLogOut} from 'react-icons/bi';

const LogoutButton = () => {
    return (
        <button className="w-full p-2 text-left hover:bg-red-500">
            <BiLogOut className="inline mr-2" />
            Logout
        </button>
    );
}
export default LogoutButton;