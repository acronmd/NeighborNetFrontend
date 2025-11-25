import React, { useState } from "react";
import { View, Text, Image, StyleSheet, Pressable, TextInput, Alert } from "react-native";
import * as SecureStore from "expo-secure-store";
import { ApiPost } from "../types/apiPost";
import { useRouter } from "expo-router";

export default function Post({ post }: { post: ApiPost }) {
    const router = useRouter();

    const [likes, setLikes] = useState(post.likes_count);
    const [commentsCount, setCommentsCount] = useState(post.comments_count);
    const [replyText, setReplyText] = useState("");

    // --- LIKE POST ---
    const handleLike = async () => {
        const token = await SecureStore.getItemAsync("authToken");
        const ip = await SecureStore.getItemAsync("serverIp");

        const res = await fetch(`http://${ip}/api/posts/${post.post_id}/like`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
            setLikes((prev) => prev + 1);
        } else {
            Alert.alert("Failed to like post");
        }
    };

    // --- COMMENT ---
    const handleComment = async () => {
        if (!replyText.trim()) return;

        const token = await SecureStore.getItemAsync("authToken");
        const ip = await SecureStore.getItemAsync("serverIp");

        const res = await fetch(`http://${ip}/api/posts/${post.post_id}/comment`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ text: replyText }),
        });

        if (res.ok) {
            setReplyText("");
            setCommentsCount((prev) => prev + 1);
        } else {
            Alert.alert("Failed to comment");
        }
    };

    return (
        <View style={styles.container}>

            {/* Header */}
            <View style={styles.header}>
                <Pressable>

                    {/* TEMP USER INFO — until backend returns joined user data */}
                    <Image
                        source={require("@/assets/images/default-avatar.png")}
                        style={styles.avatar}
                    />
                </Pressable>

                <View>
                    <Text style={styles.displayName}>{post.author_name}</Text>
                    <Text style={styles.username}>@userID{post.user_id}</Text>
                </View>
            </View>

            {/* Content */}
            <Pressable onPress={() => router.push(`/feed/${post.post_id}`)}>
                <Text style={styles.content}>{post.content}</Text>
                <View style={styles.separator} />
            </Pressable>

            {/* Actions */}
            <View style={styles.actions}>
                <Pressable style={styles.actionButton} onPress={handleComment}>
                    <Text style={styles.actionText}>💬 {commentsCount} Comments</Text>
                </Pressable>

                <Pressable style={styles.actionButton} onPress={handleLike}>
                    <Text style={styles.actionText}>❤️ {likes} Likes</Text>
                </Pressable>
            </View>

            {/* Reply box */}
            <View style={styles.replyContainer}>
                <TextInput
                    placeholder="Write a reply..."
                    style={styles.replyInput}
                    value={replyText}
                    onChangeText={setReplyText}
                />
                <Pressable onPress={handleComment}>
                    <Text style={styles.sendButton}>Send</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: "#fff",
        marginVertical: 10,
        marginHorizontal: 12,
        borderRadius: 12,
        elevation: 3,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    displayName: {
        fontWeight: "bold",
        fontSize: 16,
    },
    username: {
        color: "#888",
        fontSize: 14,
    },
    content: {
        fontSize: 16,
        marginBottom: 12,
    },
    actions: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginVertical: 12,
    },
    actionButton: {
        padding: 8,
        backgroundColor: "#f2f2f2",
        borderRadius: 6,
    },
    actionText: {
        color: "#1DA1F2",
        fontWeight: "600",
    },
    replyContainer: {
        flexDirection: "row",
        gap: 8,
    },
    replyInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 6,
        padding: 8,
    },
    sendButton: {
        color: "#1DA1F2",
        fontWeight: "600",
        alignSelf: "center",
    },
    separator: {
        height: 1,
        backgroundColor: '#e1e8ed',
        marginVertical: 8,
    },
});
