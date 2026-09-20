import useFriendList from './useFriendList';
const useGetSentRequests = () => {
    const { data, loading } = useFriendList('/api/friends/sentRequests', 'sentRequests', 'sentFriendRequests');
    return { sentFriendRequests: data, loading };
};
export default useGetSentRequests;
