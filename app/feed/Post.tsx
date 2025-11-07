import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import { PostType, User } from "@/app/masterPosts/masterPostList";


export default function Post({
                                 id,
                                 userData,
                                 content,
                                 contentType,
                                 mediaUrls,
                                 pollOptions
                             }: PostType) {
    const router = useRouter();

    return (
        <View style={styles.container}>
            {/* Post header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.push(`/users/${userData.id}`)}>
                    <Image
                        source={
                            userData.avatarUrl
                                ? { uri: userData.avatarUrl }
                                : require('@/assets/images/default-avatar.png')
                        }
                        style={styles.avatar}
                    />
                </Pressable>

                <View style={styles.authorInfo}>
                    <Text style={styles.displayName}>{userData.authorDisplayName}</Text>
                    <Text style={styles.username}>@{userData.authorUsername}</Text>
                </View>

                <Text style={styles.rightItem}>{userData.location} away</Text>
            </View>

            {/* Post content pressable for post details */}
            <Pressable onPress={() => router.push(`/feed/${id}`)}>
                <Text style={styles.content}>{content}</Text>
                <View style={styles.separator} />
            </Pressable>

            {/* Action buttons */}
            <View style={styles.actions}>
                <Pressable
                    style={styles.actionButton}
                    onPress={() => alert('Reply pressed')}
                >
                    <Text style={styles.actionText}>💬 Reply</Text>
                </Pressable>
                <Pressable
                    style={styles.actionButton}
                    onPress={() => alert('Like pressed')}
                >
                    <Text style={styles.actionText}>❤️</Text>
                </Pressable>
                <Pressable
                    style={styles.actionButton}
                    onPress={() => alert('Share pressed')}
                >
                    <Text style={styles.actionText}>⭐</Text>
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
});

