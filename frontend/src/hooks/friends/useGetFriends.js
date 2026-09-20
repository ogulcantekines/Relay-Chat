import useFriendList from './useFriendList';
const useGetFriends = () => {
    const { data, loading } = useFriendList('/api/friends/list', 'friends', 'friends');
    return { friends: data, loading };
};
export default useGetFriends;
