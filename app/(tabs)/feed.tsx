import React from "react";
import { usePosts } from "../data/demoPostData";
import {FlatList, Pressable, View, Text} from "react-native";
import Post from "@/app/feed/Post";
import {useFocusEffect} from "expo-router";

export default function FeedScreen() {
    const { posts, refreshPosts, likePost } = usePosts();

    useFocusEffect(
        React.useCallback(() => {
            refreshPosts();
        }, [])
    );

    return (
        <FlatList
            data={posts}        // array of ApiPost
            keyExtractor={(item) => item.post_id.toString()}
            renderItem={({ item }) => <Post post={item} />}
            contentContainerStyle={{ paddingBottom: 60 }}
        />
    );
}
