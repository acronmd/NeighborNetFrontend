import { View, Text, Image, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export type PostType = {
    id: string;
    authorDisplayName: string;
    authorUsername: string;
    avatarUrl?: string; // optional profile picture
    content: string;
};

export default function Post({
                                 id,
                                 authorDisplayName,
                                 authorUsername,
                                 avatarUrl,
                                 content,
                             }: PostType) {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Image
                    source={
                        avatarUrl
                            ? { uri: avatarUrl }
                            : require('@/assets/images/default-avatar.png') // fallback avatar
                    }
                    style={styles.avatar}
                />
                <View style={styles.authorInfo}>
                    <Text style={styles.displayName}>{authorDisplayName}</Text>
                    <Text style={styles.username}>@{authorUsername}</Text>
                </View>
            </View>

            <Text style={styles.content}>{content}</Text>

            <Link
                href={{
                    pathname: '/feed/[id]' as const,
                    params: { id },
                }}
                style={styles.link}
            >
                View Details
            </Link>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 12,
        borderBottomWidth: 1,
        borderColor: '#e1e8ed',
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
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
    content: {
        fontSize: 15,
        lineHeight: 20,
        marginBottom: 8,
    },
    link: {
        color: '#1DA1F2', // Twitter blue
        fontWeight: '600',
    },
});
