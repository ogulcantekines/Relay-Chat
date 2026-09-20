import useFriendList from './useFriendList';
const useGetMessageRequests = () => {
    const { loading, refresh } = useFriendList('/api/conversations/status/pending', null, 'messageRequests');
    return { loading, refreshRequests: refresh };
};
export default useGetMessageRequests;
