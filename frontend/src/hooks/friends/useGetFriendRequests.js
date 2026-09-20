import useFriendList from './useFriendList';
const useGetFriendRequests = () => {
    const { data, loading } = useFriendList('/api/friends/requests', 'friendRequests', 'incomingFriendRequests');
    return { incomingFriendRequests: data, loading };
};
export default useGetFriendRequests;
