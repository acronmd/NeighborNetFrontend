import { View, Text, Image, Pressable, TextInput, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useApiPost } from "@/app/hooks/useApiPost";
import React from "react";

export default function PostDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const postId = Number(id);
    const { post, loading } = useApiPost(postId);
    const [replyText, setReplyText] = useState("");

    if (loading) return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;

    if (!post) {
        return (
            <View style={styles.container}>
                <Text>Post not found.</Text>
            </View>
        );
    }

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
                    <Text style={styles.username}>@userID{post.user_id}</Text>
                </View>

                <Text style={styles.rightItem}>{post.location_lat} away</Text>
            </View>

            {/* Content */}
            <Text style={styles.content}>{post.content}</Text>

            {/* Post actions */}
            <View style={styles.actions}>
                <Pressable style={styles.actionButton}>
                    <Text style={styles.actionText}>💬 {post.comments_count || 0} Comment{post.comments_count === 1 ? '' : 's'}</Text>
                </Pressable>
                <Pressable style={styles.actionButton}>
                    <Text style={styles.actionText}>❤  {post.likes_count || 0} Like{post.likes_count === 1 ? '' : 's'} </Text>
                </Pressable>
            </View>
            {/* Reply Input */}
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
                <TextInput
                    value={replyText}
                    onChangeText={setReplyText}
                    placeholder="Write a reply..."
                    style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: '#ccc',
                        borderRadius: 8,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                    }}
                />
                <Pressable style={{ marginLeft: 8, justifyContent: 'center', paddingHorizontal: 8 }}>
                    <Text style={{ color: '#1DA1F2', fontWeight: '600' }}>Send</Text>
                </Pressable>
            </View>

            {/* Separator */}
            <View style={styles.separator} />

            {/* Comments
             {post.comments && post.comments.length > 0 ? (
                post.comments.map((comment) => (
                    <View key={comment.id} style={styles.comment}>
                        <Pressable onPress={() => router.push(`/users/${comment.userData.id}`)}>
                            <Image
                                source={
                                    comment.userData.avatarUrl
                                        ? { uri: comment.userData.avatarUrl }
                                        : require('@/assets/images/favicon.png')
                                }
                                style={styles.commentAvatar}
                            />
                        </Pressable>
                        <View style={styles.commentBody}>
                            <Text style={styles.commentAuthor}>{comment.userData.authorDisplayName}</Text>
                            <Text>{comment.text}</Text>
                        </View>
                    </View>
                ))
            ) : (
                <Text style={{ marginVertical: 8, color: '#657786' }}>No comments</Text>
            )}
             */}

        </View>
    );

}

/*
const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: "#f5f8fa" },
    postCard: { padding: 16, borderRadius: 12, backgroundColor: "#fff", marginVertical: 8, marginHorizontal: 12 },
    header: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12, backgroundColor: "#ccc" },
    authorInfo: { flexDirection: "column", justifyContent: "center" },
    displayName: { fontWeight: "bold", fontSize: 16 },
    username: { color: "#657786", fontSize: 14 },
    content: { fontSize: 15, lineHeight: 20 },
});
 */

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: '#f5f8fa' },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12, backgroundColor: '#ccc' },
    authorInfo: { flexDirection: 'column', justifyContent: 'center' },
    displayName: { fontWeight: 'bold', fontSize: 16 },
    username: { color: '#657786', fontSize: 14 },
    rightItem: { marginLeft: 'auto', color: '#657786', fontSize: 12 },
    content: { fontSize: 15, lineHeight: 20 },
    separator: { height: 1, backgroundColor: '#e1e8ed', marginVertical: 12 },
    commentsContainer: { flex: 1 },
    commentsTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 8 },
    comment: { flexDirection: 'row', marginBottom: 18 },
    commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 8, backgroundColor: '#ccc' },
    commentContent: { flex: 1 },
    commentAuthor: { fontWeight: 'bold', fontSize: 14 },
    noComments: { fontStyle: 'italic', color: '#657786' },

    postCard: {
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#fff',
        marginVertical: 8,
        marginHorizontal: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    actions: {
        flexDirection: 'row',
        marginTop: 8,
    },
    actionButton: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: '#f1f1f1',
        marginRight: 12,
    },
    actionText: {
        color: '#1DA1F2',
        fontWeight: '600',
    },
    postStats: {
        marginTop: 6,
        color: '#657786',
        fontSize: 12,
    },
    commentBody: {
        flex: 1,
    },

});
