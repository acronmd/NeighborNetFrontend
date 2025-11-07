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
            <Pressable
                onPress={() => router.push(`/feed/${id}`)}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Image
                        source={
                            userData.avatarUrl
                                ? { uri: userData.avatarUrl }
                                : require('@/assets/images/default-avatar.png')
                        }
                        style={styles.avatar}
                    />
                    <View style={styles.authorInfo}>
                        <Text style={styles.displayName}>{userData.authorDisplayName}</Text>
                        <Text style={styles.username}>@{userData.authorUsername}</Text>
                    </View>
                    <Text style={styles.rightItem}>{userData.location} away</Text>
                </View>

                {/* Post content */}
                <Text style={styles.content}>{content}</Text>

                {/* Separator line */}
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
        borderBottomWidth: 1,
        borderColor: '#e1e8ed',
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginRight: 12,
        backgroundColor: '#ccc',
    },
    authorInfo: {
        flexDirection: 'column',
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
        marginBottom: 8,
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
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    actionText: {
        color: '#1DA1F2',
        fontWeight: '600',
    },
});
