


import { View, Text, Image, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { PostType } from "@/app/data/demoPostData";
import { UserType } from "@/app/data/demoUserData";
import { usePosts } from '@/app/data/demoPostData';

export default function Post({
                                 id,
                                 userData,
                                 content,
                                 contentType,
                                 mediaUrls,
                                 pollOptions,
                             }: PostType) {
    const router = useRouter();
    const { posts, addComment, likePost } = usePosts();
    const post = posts[id];

    const [replyText, setReplyText] = useState('');

    const handleReply = () => {
        if (!replyText.trim()) return;
        addComment(String(id), {
            id: post.comments?.length || 0,
            userData: {
                id: 0, // or your current user id
                authorDisplayName: 'You',
                authorUsername: 'you',
            } as UserType,
            text: replyText,
        });
        setReplyText('');
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.push(`/users/${userData.id}`)}>
                    <Image
                        source={userData.avatarUrl ? { uri: userData.avatarUrl } : require('@/assets/images/default-avatar.png')}
                        style={styles.avatar}
                    />
                </Pressable>

                <View style={styles.authorInfo}>
                    <Text style={styles.displayName}>{userData.authorDisplayName}</Text>
                    <Text style={styles.username}>@{userData.authorUsername}</Text>
                </View>

                <Text style={styles.rightItem}>{userData.location} away</Text>
            </View>

            {/* Post Content */}
            <Pressable onPress={() => router.push(`/feed/${id}`)}>
                <Text style={styles.content}>{content}</Text>
                <View style={styles.separator} />
            </Pressable>

            {/* Action Buttons */}
            <View style={styles.actions}>
                <Pressable style={styles.actionButton} onPress={handleReply}>
                    <Text style={styles.actionText}>💬 {post.comments?.length || 0} Comment{post.comments?.length === 1 ? '' : 's'}</Text>
                </Pressable>
                <Pressable style={styles.actionButton}  onPress={(): void => likePost(String(post.id))}>
                    <Text style={styles.actionText}>❤  {post.likes || 0} Like{post.likes === 1 ? '' : 's'} </Text>
                </Pressable>
            </View>

            {/*/!* Post Stats *!/*/}
            {/*<Text style={styles.postStats}>*/}
            {/*    {`${post.comments?.length || 0} Comment${post.comments?.length === 1 ? '' : 's'} • ${post.likes} Like${post.likes === 1 ? '' : 's'}`}*/}
            {/*</Text>*/}

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
                <Pressable onPress={handleReply} style={{ marginLeft: 8, justifyContent: 'center', paddingHorizontal: 8 }}>
                    <Text style={{ color: '#1DA1F2', fontWeight: '600' }}>Send</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        marginVertical: 8,
        marginHorizontal: 12,
        borderRadius: 12,            // rounded corners
        backgroundColor: '#fff',     // white card
        shadowColor: '#000',         // subtle shadow for iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,                // shadow for Android
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',        // vertical center with avatar
        marginBottom: 12,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
        backgroundColor: '#ccc',
    },
    authorInfo: {
        flexDirection: 'column',
        justifyContent: 'center',
    },
    displayName: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    username: {
        color: '#657786',
        fontSize: 14,
    },
    rightItem: {
        marginLeft: 'auto',
        color: '#657786',
        fontSize: 12,
    },
    content: {
        fontSize: 15,
        lineHeight: 20,
        marginBottom: 12,
    },
    separator: {
        height: 1,
        backgroundColor: '#e1e8ed',
        marginVertical: 8,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    actionButton: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        backgroundColor: '#f1f1f1', // subtle background for buttons
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
});

