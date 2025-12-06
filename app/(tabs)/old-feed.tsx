import React from "react";
import { usePosts } from "../data/_demoPostData";
import { FlatList, StyleSheet, View } from "react-native";
import Post from "@/app/feed/Post";
import { useFocusEffect } from "expo-router";
import { Colors } from "@/constants/theme";
import FeedSwitcher from "@/components/feed-switcher";

export default function FeedScreen() {
    const { posts, refreshPosts, likePost } = usePosts();

    useFocusEffect(
        React.useCallback(() => {
            refreshPosts();
        }, [])
    );

    // Filter out event posts since they have their own tab
    const regularPosts = posts.filter(post => post.post_type !== 'event');

    return (
        <View style={styles.container}>
            <FeedSwitcher />

            <FlatList
                data={regularPosts}
                keyExtractor={(item) => item.post_id.toString()}
                renderItem={({ item }) => <Post post={item} />}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                extraData={posts}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    listContent: {
        paddingVertical: 8,
        paddingBottom: 80,
    },
});
