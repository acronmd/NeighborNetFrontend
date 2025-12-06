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
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";

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
        <View style={styles.container}>
            <View style={styles.postCard}>

                {/* ---------- HEADER ---------- */}
                <View style={styles.header}>
                    <Pressable onPress={() => router.push(`/profile/${post.user_id}`)}>
                        <View style={styles.avatarContainer}>
                            <Image
                                source={
                                    post.author_image
                                        ? { uri: post.author_image }
                                        : require('@/assets/images/default-avatar.png')
                                }
                                style={styles.avatar}
                            />
                            <View style={styles.avatarRing} />
                        </View>
                    </Pressable>

                    <View style={styles.authorInfo}>
                        <Text style={styles.displayName}>{post.author_name}</Text>
                        <Text style={styles.username}>@{post.username}</Text>
                    </View>
                </View>

                {/* ---------- CONTENT ---------- */}
                <Text style={styles.content}>{post.content}</Text>

                {/*{!!post.post_image && (*/}
                {/*    <View style={styles.imageContainer}>*/}
                {/*        <Image*/}
                {/*            source={{ uri: post.post_image }}*/}
                {/*            style={styles.postImage}*/}
                {/*            resizeMode="contain"*/}
                {/*        />*/}
                {/*    </View>*/}
                {/*)}*/}

                {/* ---------- DIVIDER ---------- */}
                <View style={styles.separator} />

                {/* ---------- ACTIONS ---------- */}
                <View style={styles.actions}>
                    <Pressable style={styles.actionButton}>
                        <Text style={styles.actionIcon}>💬</Text>
                        <Text style={styles.actionText}>{comments.length}</Text>
                    </Pressable>

                    <Pressable style={styles.actionButton} onPress={handleLike}>
                        <Text style={styles.actionIcon}>❤️</Text>
                        <Text style={styles.actionText}>{likes}</Text>
                    </Pressable>
                </View>

                {/* ---------- REPLY INPUT ---------- */}
                <View style={styles.replyRow}>
                    <TextInput
                        value={replyText}
                        onChangeText={setReplyText}
                        placeholder="Write a reply..."
                        style={styles.replyInput}
                    />
                    <Pressable style={styles.sendButton} onPress={handleSend}>
                        <Text style={styles.sendText}>Send</Text>
                    </Pressable>
                </View>

                {/* ---------- COMMENTS ---------- */}
                <View style={styles.commentsContainer}>
                    <Text style={styles.commentsTitle}>Comments</Text>

                    {commentsLoading ? (
                        <ActivityIndicator />
                    ) : comments.length === 0 ? (
                        <Text style={styles.noComments}>No comments yet.</Text>
                    ) : (
                        comments.map((comment) => (
                            <View key={comment.comment_id} style={styles.comment}>
                                <Image
                                    source={
                                        comment.author_image
                                            ? { uri: comment.author_image }
                                            : require('@/assets/images/default-avatar.png')
                                    }
                                    style={styles.commentAvatar}
                                />

                                <View style={styles.commentBody}>
                                    <Text style={styles.commentAuthor}>
                                        {comment.author_name}
                                    </Text>
                                    <Text>{comment.content}</Text>

                                    {loggedInUserId === comment.user_id && (
                                        <View style={styles.commentActions}>
                                            <Pressable
                                                style={styles.commentEditButton}
                                                onPress={() =>
                                                    handleEditComment(
                                                        comment.comment_id,
                                                        comment.content
                                                    )
                                                }>
                                                <Text style={styles.commentEditText}>
                                                    ✏️ Edit
                                                </Text>
                                            </Pressable>

                                            <Pressable
                                                style={styles.commentDeleteButton}
                                                onPress={() =>
                                                    handleDeleteComment(comment.comment_id)
                                                }>
                                                <Text style={styles.commentDeleteText}>
                                                    🗑️ Delete
                                                </Text>
                                            </Pressable>
                                        </View>
                                    )}
                                </View>
                            </View>
                        ))
                    )}
                </View>

            </View>

            {/* ---------- EDIT COMMENT MODAL ---------- */}
            <Modal visible={editingCommentId !== null} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Comment</Text>

                        <TextInput
                            value={editCommentText}
                            onChangeText={setEditCommentText}
                            style={styles.editInput}
                            multiline
                        />

                        <View style={styles.modalButtons}>
                            <Pressable
                                style={styles.cancelButton}
                                onPress={() => setEditingCommentId(null)}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </Pressable>

                            <Pressable
                                style={styles.saveButton}
                                onPress={handleSaveEditComment}>
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
        flex: 1,
        backgroundColor: Colors.light.background,
        paddingVertical: Spacing.md,
    },

    postCard: {
        backgroundColor: Colors.light.backgroundCard,
        marginHorizontal: Spacing.lg,
        marginVertical: Spacing.sm,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        ...Shadows.md,
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: Spacing.md,
    },

    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: Spacing.md,
        backgroundColor: Colors.light.borderLight,
    },

    authorInfo: {
        flex: 1,
    },

    displayName: {
        fontWeight: "700",
        fontSize: 16,
        color: Colors.light.text,
        marginBottom: 2,
    },

    username: {
        color: Colors.light.textSecondary,
        fontSize: 14,
    },

    rightItem: {
        color: Colors.light.textSecondary,
        fontSize: 12,
    },

    content: {
        fontSize: 15,
        lineHeight: 22,
        color: Colors.light.text,
        marginBottom: Spacing.md,
    },

    separator: {
        height: 1,
        backgroundColor: Colors.light.border,
        marginVertical: Spacing.md,
    },

    actions: {
        flexDirection: "row",
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },

    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        backgroundColor: Colors.light.borderLight,
        borderRadius: BorderRadius.full,
        gap: Spacing.xs,
    },

    actionText: {
        color: Colors.light.textSecondary,
        fontWeight: "600",
        fontSize: 14,
    },

    /* ========================= */
    /* COMMENTS */
    /* ========================= */

    commentsContainer: {
        marginTop: Spacing.md,
    },

    commentsTitle: {
        fontWeight: "700",
        fontSize: 16,
        color: Colors.light.text,
        marginBottom: Spacing.sm,
    },

    comment: {
        flexDirection: "row",
        marginBottom: Spacing.sm,
        padding: Spacing.md,
        backgroundColor: Colors.light.borderLight,
        borderRadius: BorderRadius.md,
    },

    commentAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: Spacing.sm,
        backgroundColor: Colors.light.border,
    },

    commentBody: {
        flex: 1,
    },

    commentAuthor: {
        fontWeight: "600",
        fontSize: 14,
        marginBottom: 2,
        color: Colors.light.text,
    },

    noComments: {
        fontStyle: "italic",
        color: Colors.light.textSecondary,
        marginVertical: Spacing.sm,
    },

    commentActions: {
        flexDirection: "row",
        marginTop: Spacing.sm,
        gap: Spacing.sm,
    },

    commentEditButton: {
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.md,
        backgroundColor: Colors.light.primary,
        borderRadius: BorderRadius.md,
    },

    commentEditText: {
        color: Colors.light.backgroundCard,
        fontSize: 12,
        fontWeight: "600",
    },

    commentDeleteButton: {
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.md,
        backgroundColor: Colors.light.error,
        borderRadius: BorderRadius.md,
    },

    commentDeleteText: {
        color: Colors.light.backgroundCard,
        fontSize: 12,
        fontWeight: "600",
    },

    /* ========================= */
    /* MODAL
    /* ========================= */

    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
    },

    modalContent: {
        backgroundColor: Colors.light.backgroundCard,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xxl,
        width: "90%",
        maxWidth: 400,
        ...Shadows.lg,
    },

    modalTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: Colors.light.text,
        marginBottom: Spacing.lg,
    },

    editInput: {
        borderWidth: 1,
        borderColor: Colors.light.border,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        minHeight: 120,
        textAlignVertical: "top",
        marginBottom: Spacing.lg,
        fontSize: 15,
        color: Colors.light.text,
        backgroundColor: Colors.light.background,
    },

    modalButtons: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: Spacing.md,
    },

    modalButton: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        borderRadius: BorderRadius.md,
        minWidth: 90,
        alignItems: 'center',
    },

    cancelButton: {
        backgroundColor: Colors.light.textMuted,
    },

    cancelButtonText: {
        color: Colors.light.backgroundCard,
        fontWeight: "600",
        fontSize: 15,
    },

    saveButton: {
        backgroundColor: Colors.light.primary,
    },

    saveButtonText: {
        color: Colors.light.backgroundCard,
        fontWeight: "600",
        fontSize: 15,
    },

    avatarRing: {
        position: 'absolute',
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 2,
        borderColor: Colors.light.primary,
        top: -2,
        left: -2,
        opacity: 0.3,
    },

    replyRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: Spacing.md,
        gap: Spacing.sm,
    },

    replyInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: Colors.light.border,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        fontSize: 14,
        backgroundColor: Colors.light.backgroundCard,
        color: Colors.light.text,
    },

    sendButton: {
        backgroundColor: Colors.light.primary,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        justifyContent: "center",
        alignItems: "center",
    },

    sendText: {
        color: Colors.light.backgroundCard,
        fontWeight: "600",
        fontSize: 14,
    },

    actionIcon: {
        fontSize: 18,
    },
});
