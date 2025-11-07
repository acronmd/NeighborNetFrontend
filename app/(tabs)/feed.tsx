import { FlatList } from "react-native";
import { usePosts } from "@/app/data/demoPostData";
import Post from "@/app/feed/Post";

export default function FeedScreen() {
    const { posts } = usePosts(); // 🔥 get data from context

    // Map posts to clone userData to prevent shared mutation
    const postsWithClonedUsers = Object.values(posts).map(post => ({
        ...post,
        userData: { ...post.userData },
    }));

    return (
        <FlatList
            data={postsWithClonedUsers} // ✅ isolated userData per post
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => <Post {...item} />}
        />
    );
}

