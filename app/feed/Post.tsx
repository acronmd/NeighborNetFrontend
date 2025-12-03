import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState, useEffect } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View, TextInput, Modal } from "react-native";
import { ApiPost } from "../types/apiPost";
import { usePosts } from "../data/demoPostData";

export default function Post({ post }: { post: ApiPost }) {
    const router = useRouter();
    const { deletePost, updatePost } = usePosts();

    const [likes, setLikes] = useState(post.likes_count);
    const [commentsCount, setCommentsCount] = useState(post.comments_count);
    const [replyText, setReplyText] = useState("");
    const [isOwner, setIsOwner] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const [isLiked, setIsLiked] = useState(false);

    // Check if current user is post owner and like status
    useEffect(() => {
        const checkOwnership = async () => {
            const token = await SecureStore.getItemAsync("authToken");
            const ip = await SecureStore.getItemAsync("serverIp");

            const res = await fetch(`http://${ip}/api/users/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();
            if (data.success) {
                setIsOwner(data.user.user_id === post.user_id);
            }
        };
        checkOwnership();
        checkLikeStatus();
    }, [post.user_id]);

    // Check if user already liked this post
    const checkLikeStatus = async () => {
        try {
            const token = await SecureStore.getItemAsync("authToken");
            const ip = await SecureStore.getItemAsync("serverIp");

            const res = await fetch(`http://${ip}/api/posts/${post.post_id}/like/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();
            if (data.success) {
                setIsLiked(data.liked);
            }
        } catch (err) {
            console.error("Failed to check like status:", err);
        }
    };

    // --- LIKE POST ---
    const handleLike = async () => {
        const token = await SecureStore.getItemAsync("authToken");
        const ip = await SecureStore.getItemAsync("serverIp");

        // Try LIKE first
        const likeRes = await fetch(`http://${ip}/api/posts/${post.post_id}/like`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (likeRes.ok) {
            // Successfully liked
            setLikes((prev) => prev + 1);
            return;
        }

        // If already liked --> server returns 409
        if (likeRes.status === 409) {
            // Send UNLIKE instead
            const unlikeRes = await fetch(`http://${ip}/api/posts/${post.post_id}/like`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (unlikeRes.ok) {
                setLikes((prev) => prev - 1);
            } else {
                Alert.alert("Failed to unlike post");
            }

            return;
        }

        Alert.alert("Failed to like post");
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

    // --- DELETE POST ---
    const handleDelete = async () => {
        Alert.alert(
            "Delete Post",
            "Are you sure you want to delete this post?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deletePost(post.post_id);
                            Alert.alert("Success", "Post deleted");
                        } catch (err) {
                            Alert.alert("Error", "Failed to delete post");
                        }
                    },
                },
            ]
        );
    };

    // --- EDIT POST ---
    const handleEdit = () => {
        setEditContent(post.content);
        setIsEditing(true);
    };

    const handleSaveEdit = async () => {
        if (!editContent.trim()) {
            Alert.alert("Error", "Post content cannot be empty");
            return;
        }

        try {
            await updatePost(post.post_id, editContent);
            setIsEditing(false);
            Alert.alert("Success", "Post updated");
        } catch (err) {
            Alert.alert("Error", "Failed to update post");
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
                    <Text style={styles.username}>@{post.username}</Text>
                </View>
            </View>

            {/* Content */}
            <Pressable onPress={() => router.push(`/feed/${post.post_id}`)}>
                <Text style={styles.content}>{post.content}</Text>
                <View style={styles.separator} />
            </Pressable>

            {/* Edit/Delete buttons for post owner */}
            {isOwner && (
                <View style={styles.ownerActions}>
                    <Pressable style={styles.editButton} onPress={handleEdit}>
                        <Text style={styles.editButtonText}>✏️ Edit</Text>
                    </Pressable>
                    <Pressable style={styles.deleteButton} onPress={handleDelete}>
                        <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
                    </Pressable>
                </View>
            )}

            {/* Actions */}
            <View style={styles.actions}>
                <Pressable style={styles.actionButton} onPress={() => router.push(`/feed/${post.post_id}`)}>
                    <Text style={styles.actionText}>💬 {commentsCount} Comments</Text>
                </Pressable>

                <Pressable style={styles.actionButton} onPress={handleLike}>
                    <Text style={[styles.actionText, isLiked && styles.liked]}>
                        {isLiked ? "❤️" : "🤍"} {likes}
                    </Text>
                </Pressable>
            </View>

            {/* Reply box
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
             */}

            {/* Edit Modal */}
            <Modal visible={isEditing} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Post</Text>
                        <TextInput
                            style={styles.editInput}
                            value={editContent}
                            onChangeText={setEditContent}
                            multiline
                            placeholder="Edit your post..."
                        />
                        <View style={styles.modalButtons}>
                            <Pressable
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setIsEditing(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleSaveEdit}
                            >
                                <Text style={styles.saveButtonText}>Save</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
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
        marginVertical: 6,
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
    liked: {
        color: "#E74C3C",
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
        marginVertical: 4,
    },
    ownerActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 8,
        gap: 8,
    },
    editButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: "#4A90E2",
        borderRadius: 6,
    },
    editButtonText: {
        color: "white",
        fontWeight: "600",
        fontSize: 14,
    },
    deleteButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: "#E74C3C",
        borderRadius: 6,
    },
    deleteButtonText: {
        color: "white",
        fontWeight: "600",
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 20,
        width: "90%",
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 16,
    },
    editInput: {
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        padding: 12,
        minHeight: 100,
        textAlignVertical: "top",
        marginBottom: 16,
    },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 12,
    },
    modalButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    cancelButton: {
        backgroundColor: "#95a5a6",
    },
    cancelButtonText: {
        color: "white",
        fontWeight: "600",
    },
    saveButton: {
        backgroundColor: "#4A90E2",
    },
    saveButtonText: {
        color: "white",
        fontWeight: "600",
    },
});
