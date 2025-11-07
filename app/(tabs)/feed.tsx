import { FlatList } from "react-native";
import Post from "@/app/feed/Post";
import { masterPostList, PostType } from "@/app/masterPosts/masterPostList";

export default function FeedScreen() {
    return (
        <FlatList
            data={Object.values(masterPostList)} // ✅ Convert Record<string, PostType> → PostType[]
            keyExtractor={(item) => String(item.id)} // ✅ Must be a string
            renderItem={({ item }) => <Post {...item} />}
        />
    );
}
