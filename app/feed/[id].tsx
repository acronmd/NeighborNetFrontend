import {
    View,
    Text,
    Image,
    Pressable,
    TextInput,
    ActivityIndicator,
    StyleSheet,
    Alert,
    Modal
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect } from "react";
import { useApiPost } from "../hooks/_useApiPost";
import { useComments } from "../hooks/_useComments";
import * as SecureStore from "expo-secure-store";

export default function PostDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const postId = Number(id);

    const { post, loading, refreshPost } = useApiPost(postId);
    const { comments, loading: commentsLoading, createComment, deleteComment, updateComment } = useComments(postId);

    // Local UI state
    const [likes, setLikes] = useState(0);
    const [replyText, setReplyText] = useState("");
    const [loggedInUserId, setLoggedInUserId] = useState<number | null>(null);
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editCommentText, setEditCommentText] = useState("");

    // Sync likes once post is loaded
    useEffect(() => {
        if (post) {
            setLikes(post.likes_count);
        }
    }, [post]);

    // Load logged-in user ID
    useEffect(() => {
        const loadLoggedInUser = async () => {
            const token = await SecureStore.getItemAsync('authToken');
            const ip = await SecureStore.getItemAsync('serverIp');

            const res = await fetch(`http://${ip}/api/users/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();
            if (data.success) setLoggedInUserId(data.user.user_id);
        };
        loadLoggedInUser();
    }, []);

    if (loading || !post) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" style={{ marginTop: 50 }} />
            </View>
        );
    }

    const handleSend = async () => {
        if (!replyText.trim()) return;

        await createComment(replyText);
        setReplyText("");
        await refreshPost();
    };

    // LIKE / UNLIKE
    const handleLike = async () => {
        const token = await SecureStore.getItemAsync("authToken");
        const ip = await SecureStore.getItemAsync("serverIp");

        const likeRes = await fetch(`http://${ip}/api/posts/${post.post_id}/like`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (likeRes.ok) {
            setLikes(prev => prev + 1);
            return;
        }

        if (likeRes.status === 409) {
            const unlikeRes = await fetch(`http://${ip}/api/posts/${post.post_id}/like`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (unlikeRes.ok) {
                setLikes(prev => prev - 1);
            } else {
                Alert.alert("Failed to unlike post");
            }
            return;
        }

        Alert.alert("Failed to like post");
    };

    // --- DELETE COMMENT ---
    const handleDeleteComment = async (commentId: number) => {
        Alert.alert(
            "Delete Comment",
            "Are you sure you want to delete this comment?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteComment(commentId);
                            Alert.alert("Success", "Comment deleted");
                        } catch (err) {
                            Alert.alert("Error", "Failed to delete comment");
                        }
                    },
                },
            ]
        );
    };

    // --- EDIT COMMENT ---
    const handleEditComment = (commentId: number, currentText: string) => {
        setEditingCommentId(commentId);
        setEditCommentText(currentText);
    };

    const handleSaveEditComment = async () => {
        if (!editCommentText.trim()) {
            Alert.alert("Error", "Comment cannot be empty");
            return;
        }

        if (editingCommentId) {
            try {
                await updateComment(editingCommentId, editCommentText);
                setEditingCommentId(null);
                setEditCommentText("");
                Alert.alert("Success", "Comment updated");
            } catch (err) {
                Alert.alert("Error", "Failed to update comment");
            }
        }
    };

    return (
        <View style={styles.postCard}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.push(`/users/${post.user_id}`)}>
                    <Image
                        source={
                            post.author_image
                                ? { uri: post.author_image }
                                : require('@/assets/images/default-avatar.png')
                        }
                        style={styles.avatar}
                    />
                </Pressable>

                <View style={styles.authorInfo}>
                    <Text style={styles.displayName}>{post.author_name}</Text>
                    <Text style={styles.username}>@userID{post.username}</Text>
                </View>

                <Text style={styles.rightItem}>{post.location_lat} away</Text>
            </View>

            {/* Content */}
            <Text style={styles.content}>{post.content}</Text>

            {/* Post actions */}
            <View style={styles.actions}>
                <Pressable style={styles.actionButton} onPress={() => {}}>
                    <Text style={styles.actionText}>
                        💬 {post.comments_count} Comment{post.comments_count === 1 ? "" : "s"}
                    </Text>
                </Pressable>

                <Pressable style={styles.actionButton} onPress={handleLike}>
                    <Text style={styles.actionText}>
                        ❤ {likes} Like{likes === 1 ? "" : "s"}
                    </Text>
                </Pressable>
            </View>

            {/* Reply Input */}
            <View style={{ flexDirection: "row", marginTop: 8 }}>
                <TextInput
                    value={replyText}
                    onChangeText={setReplyText}
                    placeholder="Write a reply..."
                    style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: "#ccc",
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                    }}
                />
                <Pressable
                    style={{ marginLeft: 8, justifyContent: "center", paddingHorizontal: 8 }}
                    onPress={handleSend}
                >
                    <Text style={{ color: "#1DA1F2", fontWeight: "600" }}>Send</Text>
                </Pressable>
            </View>

            {/* Separator */}
            <View style={styles.separator} />

            {/* Comments */}
            <View style={styles.commentsContainer}>
                <Text style={styles.commentsTitle}>Comments</Text>

                {commentsLoading ? (
                    <ActivityIndicator />
                ) : comments.length > 0 ? (
                    comments.map((comment) => (
                        <View key={comment.comment_id} style={styles.comment}>
                            <Pressable onPress={() => router.push(`/profile/${comment.user_id}`)}>
                                <Image
                                    source={
                                        comment.author_image
                                            ? { uri: comment.author_image }
                                            : require('@/assets/images/default-avatar.png')
                                    }
                                    style={styles.commentAvatar}
                                />
                            </Pressable>

                            <View style={styles.commentBody}>
                                <Text style={styles.commentAuthor}>{comment.author_name}</Text>
                                <Text>{comment.content}</Text>
                                
                                {/* Edit/Delete buttons for comment owner */}
                                {loggedInUserId === comment.user_id && (
                                    <View style={styles.commentActions}>
                                        <Pressable
                                            style={styles.commentEditButton}
                                            onPress={() => handleEditComment(comment.comment_id, comment.content)}
                                        >
                                            <Text style={styles.commentEditText}>✏️ Edit</Text>
                                        </Pressable>
                                        <Pressable
                                            style={styles.commentDeleteButton}
                                            onPress={() => handleDeleteComment(comment.comment_id)}
                                        >
                                            <Text style={styles.commentDeleteText}>🗑️ Delete</Text>
                                        </Pressable>
                                    </View>
                                )}
                            </View>
                        </View>
                    ))
                ) : (
                    <Text style={styles.noComments}>No comments yet.</Text>
                )}
            </View>

            {/* Edit Comment Modal */}
            <Modal visible={editingCommentId !== null} animationType="slide" transparent={true}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Comment</Text>
                        <TextInput
                            style={styles.editInput}
                            value={editCommentText}
                            onChangeText={setEditCommentText}
                            multiline
                            placeholder="Edit your comment..."
                        />
                        <View style={styles.modalButtons}>
                            <Pressable
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setEditingCommentId(null);
                                    setEditCommentText("");
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.modalButton, styles.saveButton]}
                                onPress={handleSaveEditComment}
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
    container: { flex: 1, padding: 16, backgroundColor: "#f5f8fa" },
    postCard: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: "#fff",
        marginVertical: 8,
        marginHorizontal: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12, backgroundColor: "#ccc" },
    authorInfo: { flexDirection: "column", justifyContent: "center" },
    displayName: { fontWeight: "bold", fontSize: 16 },
    username: { color: "#657786", fontSize: 14 },
    rightItem: { marginLeft: "auto", color: "#657786", fontSize: 12 },
    content: { fontSize: 15, lineHeight: 22, marginBottom: 12 },
    separator: { height: 1, backgroundColor: "#e1e8ed", marginVertical: 12 },
    actions: { flexDirection: "row", marginBottom: 12 },
    actionButton: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: "#f1f1f1",
        marginRight: 12,
    },
    actionText: { color: "#1DA1F2", fontWeight: "600" },

    commentsContainer: { marginTop: 12 },
    commentsTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 8 },
    comment: {
        flexDirection: "row",
        marginBottom: 12,
        padding: 8,
        backgroundColor: "#f9f9f9",
        borderRadius: 8,
    },
    commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 8 },
    commentBody: { flex: 1 },
    commentAuthor: { fontWeight: "bold", fontSize: 14, marginBottom: 2 },
    noComments: { fontStyle: "italic", color: "#657786", marginVertical: 8 },
    commentActions: {
        flexDirection: "row",
        marginTop: 8,
        gap: 8,
    },
    commentEditButton: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: "#4A90E2",
        borderRadius: 4,
    },
    commentEditText: {
        color: "white",
        fontSize: 12,
        fontWeight: "600",
    },
    commentDeleteButton: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: "#E74C3C",
        borderRadius: 4,
    },
    commentDeleteText: {
        color: "white",
        fontSize: 12,
        fontWeight: "600",
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
        minHeight: 80,
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
