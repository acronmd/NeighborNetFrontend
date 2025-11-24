import { FlatList } from "react-native";
// eslint-disable-next-line import/namespace
import { useEvents } from "@/app/data/demoEventData";
import Post from "@/app/feed/Post";
import EventPost from "@/app/feed/EventPost";

export default function PostFeedScreen() {
    const { events } = useEvents(); // 🔥 get data from context

    // Map posts to clone userData to prevent shared mutation
    const postsWithClonedUsers = Object.values(events).map(eventPost => ({
        ...eventPost,
        userData: { ...eventPost.userData },
    }));

    return (
        <FlatList
            data={postsWithClonedUsers} // ✅ isolated userData per post
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <EventPost {...item} />}
        />
    );
}

