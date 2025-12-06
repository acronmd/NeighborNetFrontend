import React, {useCallback, useEffect, useRef, useState} from "react";
import {View, FlatList, StyleSheet, Text, ActivityIndicator, TouchableOpacity, Animated} from "react-native";
import { usePosts } from "../data/_demoPostData";
import { useEvents } from "../data/_demoEventData";
import Post from "@/app/feed/Post";
import EventPost from "@/app/feed/EventPost";
import FeedSwitcher from "@/components/feed-switcher";
import { Colors } from "@/constants/theme";
import {router, useFocusEffect} from "expo-router";

export default function FeedScreen() {
    const { posts, refreshPosts } = usePosts();
    const { events, refreshEvents } = useEvents();
    const [mode, setMode] = useState<"posts" | "events">("posts");

    useEffect(() => {
        scrollOffset.current = 0; // reset scroll tracking
        Animated.timing(buttonAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [mode]);

    useFocusEffect(
        useCallback(() => {
            refreshPosts(); // or refreshEvents
        }, [])
    );

    // Floating button visibility
    const scrollOffset = useRef(0);
    const buttonAnim = useRef(new Animated.Value(1)).current; // 1 = visible, 0 = hidden

    const handleScroll = (event: any) => {
        const currentOffset = event.nativeEvent.contentOffset.y;
        const direction = currentOffset > scrollOffset.current ? "down" : "up";
        scrollOffset.current = currentOffset;

        if (direction === "down") {
            Animated.timing(buttonAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(buttonAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    };

    const translateY = buttonAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [100, 0], // slide down 100px when hidden
    });

    return (
        <View style={styles.container}>
            <FeedSwitcher mode={mode} setMode={setMode} />

            {/* Posts List */}
            <View style={mode === "posts" ? styles.activeList : styles.hiddenList}>
                {!posts ? (
                    <ActivityIndicator size="large" />
                ) : posts.filter(post => post.post_type !== "event").length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text>No posts yet.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={posts.filter(post => post.post_type !== "event")}
                        keyExtractor={(item) => item.post_id.toString()}
                        renderItem={({ item }) => <Post post={item} />}
                        contentContainerStyle={styles.listContent}
                        onRefresh={refreshPosts}
                        refreshing={false}
                        extraData={posts}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                    />
                )}
            </View>

            {/* Events List */}
            <View style={mode === "events" ? styles.activeList : styles.hiddenList}>
                {!events ? (
                    <ActivityIndicator size="large" />
                ) : events.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text>No events yet.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={events}
                        keyExtractor={(item) => item.event_id.toString()}
                        renderItem={({ item }) => <EventPost {...item} id={item.event_id} />}
                        contentContainerStyle={styles.listContent}
                        onRefresh={refreshEvents}
                        refreshing={false}
                        extraData={events}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                    />
                )}
            </View>

                <Animated.View
                    style={{
                        position: "absolute",
                        bottom: 24,
                        right: 24,
                        transform: [{ translateY }],
                        opacity: buttonAnim,
                    }}
                >
                    <TouchableOpacity
                        onPress={() => mode === "events" ? router.push("/event/newEvent") : router.push("/create-post")}
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: 28,
                            backgroundColor: Colors.light.primary,
                            justifyContent: "center",
                            alignItems: "center",
                            shadowColor: "#000",
                            shadowOpacity: 0.3,
                            shadowOffset: { width: 0, height: 3 },
                            shadowRadius: 4,
                        }}
                    >
                        <Text style={{ color: "white", fontSize: 28 }}>+</Text>
                    </TouchableOpacity>
                </Animated.View>

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
    emptyContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
    },
    activeList: {
        flex: 1,
    },
    hiddenList: {
        flex: 1,
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0,
        zIndex: -1,
    },
});
