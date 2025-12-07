import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState, useEffect, useCallback } from "react";
import { Alert, Image, Pressable, StyleSheet, Text, View, TextInput, Modal } from "react-native";
import { ApiPost } from "../types/_apiPost";
import { usePosts } from "../data/_demoPostData";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import {BASE_URL} from "@/app/lib/config";

export default function Post({ post }: { post: ApiPost }) {
    const router = useRouter();
    const { deletePost, updatePost, refreshPosts } = usePosts();

    const [likes, setLikes] = useState(post.likes_count);
    const commentsCount = post.comments_count;
    const [replyText, setReplyText] = useState("");
    const [isOwner, setIsOwner] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);
    const [isLiked, setIsLiked] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
    const [imageLoadError, setImageLoadError] = useState(false);

    function timeAgo(dateString: string) {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return `${seconds} seconds ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} minutes ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hours ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days} days ago`;
        const weeks = Math.floor(days / 7);
        if (weeks < 4) return `${weeks} weeks ago`;
        const months = Math.floor(days / 30);
        if (months < 12) return `${months} months ago`;
        const years = Math.floor(days / 365);
        return `${years} years ago`;
    }


    // Fix image URLs to use actual server IP instead of localhost
    useEffect(() => {
        const fixImageUrls = async () => {
            const ip = await SecureStore.getItemAsync("serverIp");
            
            // Fix post image URL
            if (post.post_image) {
                if (ip && post.post_image.includes('localhost')) {
                    const fixedUrl = post.post_image.replace('localhost:5050', ip).replace('localhost', ip);
                    setImageUrl(fixedUrl);
                } else {
                    setImageUrl(post.post_image);
                }
            }
            
            // Fix profile image URL
            if (post.profile_image) {
                if (ip && post.profile_image.includes('localhost')) {
                    const fixedUrl = post.profile_image.replace('localhost:5050', ip).replace('localhost', ip);
                    setProfileImageUrl(fixedUrl);
                } else {
                    setProfileImageUrl(post.profile_image);
                }
            }
        };
        fixImageUrls();
    }, [post.post_image, post.profile_image]);

    // Check if user already liked this post
    const checkLikeStatus = useCallback(async () => {
        try {
            const token = await SecureStore.getItemAsync("authToken");
            const ip = await SecureStore.getItemAsync("serverIp");

            const res = await fetch(`https://${BASE_URL}/api/posts/${post.post_id}/like/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();
            if (data.success) {
                setIsLiked(data.liked);
            }
        } catch (err) {
            console.error("Failed to check like status:", err);
        }
    }, [post.post_id]);

    // Check if current user is post owner and like status
    useEffect(() => {
        const checkOwnership = async () => {
            const token = await SecureStore.getItemAsync("authToken");
            const ip = await SecureStore.getItemAsync("serverIp");

            const res = await fetch(`https://${BASE_URL}/api/users/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();
            if (data.success) {
                setIsOwner(data.user.user_id === post.user_id);
            }
        };
        checkOwnership();
        checkLikeStatus();
    }, [post.user_id, checkLikeStatus]);

    // --- LIKE POST ---
    const handleLike = async () => {
        const token = await SecureStore.getItemAsync("authToken");
        const ip = await SecureStore.getItemAsync("serverIp");

        // Try LIKE first
        const likeRes = await fetch(`https://${BASE_URL}/api/posts/${post.post_id}/like`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (likeRes.ok) {
            // Successfully liked
            setLikes((prev) => prev + 1);
            setIsLiked(true);

            // Refresh the feed to update like counts
            await refreshPosts();
            return;
        }

        // If already liked --> server returns 409
        if (likeRes.status === 409) {
            // Send UNLIKE instead
            const unlikeRes = await fetch(`https://${BASE_URL}/api/posts/${post.post_id}/like`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });

            if (unlikeRes.ok) {
                setLikes((prev) => prev - 1);
                setIsLiked(false);

                // Refresh the feed to update like counts
                await refreshPosts();
            } else {
                Alert.alert("Failed to unlike post");
            }

            return;
        }

        Alert.alert("Failed to like post");
    };

    // --- COMMENT ---
    // `const handleComment = async () => {
    //     if (!replyText.trim()) return;
    //
    //     const token = await SecureStore.getItemAsync("authToken");
    //     const ip = await SecureStore.getItemAsync("serverIp");
    //
    //     const res = await fetch(`https://${BASE_URL}/api/posts/${post.post_id}/comments`, {
    //         method: "POST",
    //         headers: {
    //             "Content-Type": "application/json",
    //             Authorization: `Bearer ${token}`,
    //         },
    //         body: JSON.stringify({ content: replyText }),
    //     });
    //
    //     if (res.ok) {
    //         setReplyText("");
    //         setCommentsCount((prev) => prev + 1);
    //
    //         // Refresh the feed to update comment counts
    //         await refreshPosts();
    //     } else {
    //         Alert.alert("Failed to comment");
    //     }
    // };`

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
                <Pressable 
                    onPress={() => router.push(`/profile/${post.user_id}` as any)}
                    style={styles.avatarPressable}
                >
                    <View style={styles.avatarContainer}>
                        {profileImageUrl ? (
                            <Image
                                source={{ uri: profileImageUrl }}
                                style={styles.avatar}
                                onError={() => {
                                    console.log('Profile image failed to load, using default');
                                    setProfileImageUrl(null);
                                }}
                            />
                        ) : (
                            <View style={[styles.avatar, styles.defaultAvatar]}>
                                <Text style={styles.avatarLetter}>
                                    {post.author_name?.[0]?.toUpperCase() || '?'}
                                </Text>
                            </View>
                        )}
                        <View style={styles.avatarRing} />
                    </View>
                </Pressable>

                <Pressable 
                    style={styles.userInfo}
                    onPress={() => router.push(`/profile/${post.user_id}` as any)}
                >
                    <Text style={styles.displayName}>{post.display_name}</Text>
                    <Text style={styles.username}>@{post.username}</Text>
                </Pressable>

                <Text style={{ color: "#999", fontSize: 12 }}>{timeAgo(post.created_at)}</Text>

                {!isOwner && (
                    <Pressable 
                        style={styles.viewProfileButton}
                        onPress={() => router.push(`/profile/${post.user_id}` as any)}
                    >
                        <Text style={styles.viewProfileText}>View Profile</Text>
                    </Pressable>
                )}
            </View>

            {/* Content */}
            <Pressable onPress={() => router.push(`/feed/${post.post_id}`)}>
                <Text style={styles.content}>{post.content}</Text>
                
                {imageUrl && !imageLoadError && (
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ uri: imageUrl }}
                            style={styles.postImage}
                            resizeMode="contain"
                            onError={(e) => {
                                console.error('Post image load error:', e.nativeEvent.error);
                                console.log('Failed post image URL:', imageUrl);
                                setImageLoadError(true);
                            }}
                            onLoad={() => console.log('Post image loaded:', imageUrl)}
                        />
                    </View>
                )}
                
                {post.tags && post.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                        {post.tags.map((tag, index) => (
                            <View key={index} style={styles.tag}>
                                <Text style={styles.tagText}>#{tag}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </Pressable>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Actions */}
            <View style={styles.actions}>
                <Pressable 
                    style={styles.actionButton} 
                    onPress={() => router.push(`/feed/${post.post_id}`)}
                >
                    <View style={styles.actionIconContainer}>
                        <Text style={styles.actionIcon}>💬</Text>
                    </View>
                    <Text style={styles.actionText}>{commentsCount}</Text>
                </Pressable>

                <Pressable 
                    style={[styles.actionButton, isLiked && styles.likedButton]} 
                    onPress={handleLike}
                >
                    <View style={styles.actionIconContainer}>
                        <Text style={styles.actionIcon}>{isLiked ? "❤️" : "🤍"}</Text>
                    </View>
                    <Text style={[styles.actionText, isLiked && styles.likedText]}>
                        {likes}
                    </Text>
                </Pressable>
            </View>

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
                            placeholderTextColor={Colors.light.textMuted}
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
    avatarPressable: {
        marginRight: Spacing.md,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    defaultAvatar: {
        backgroundColor: Colors.light.borderLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarLetter: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.light.primary,
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
    userInfo: {
        flex: 1,
    },
    viewProfileButton: {
        backgroundColor: Colors.light.primary,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
    },
    viewProfileText: {
        color: Colors.light.backgroundCard,
        fontSize: 13,
        fontWeight: "600",
    },
    content: {
        fontSize: 15,
        lineHeight: 22,
        color: Colors.light.text,
        marginBottom: Spacing.md,
    },
    imageContainer: {
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        marginBottom: Spacing.md,
        ...Shadows.sm,
    },
    postImage: {
        width: '100%',
        height: undefined,
        aspectRatio: 1,
        maxHeight: 500,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    tag: {
        backgroundColor: Colors.light.borderLight,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.light.border,
    },
    tagText: {
        color: Colors.light.primary,
        fontSize: 13,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.light.border,
        marginVertical: Spacing.md,
    },
    actions: {
        flexDirection: "row",
        gap: Spacing.md,
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
    likedButton: {
        backgroundColor: '#FEE2E2',
    },
    actionIconContainer: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionIcon: {
        fontSize: 18,
    },
    actionText: {
        color: Colors.light.textSecondary,
        fontWeight: "600",
        fontSize: 14,
    },
    likedText: {
        color: Colors.light.error,
    },
    ownerActions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: Spacing.md,
        gap: Spacing.sm,
    },
    editButton: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        backgroundColor: Colors.light.primary,
        borderRadius: BorderRadius.md,
    },
    editButtonText: {
        color: Colors.light.backgroundCard,
        fontWeight: "600",
        fontSize: 14,
    },
    deleteButton: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        backgroundColor: Colors.light.error,
        borderRadius: BorderRadius.md,
    },
    deleteButtonText: {
        color: Colors.light.backgroundCard,
        fontWeight: "600",
        fontSize: 14,
    },
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
});
