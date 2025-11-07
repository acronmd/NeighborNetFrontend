import { View, Text, BackHandler } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { usePosts } from '@/app/data/demoPostData';

export default function PostDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { posts } = usePosts(); // pull from context

    // find the post in context by numeric ID
    const postId = Number(id);
    const post = Object.values(posts).find(p => p.id === postId);

    // Handle Android hardware back button
    useEffect(() => {
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
            router.back(); // mimic the header back button
            return true;   // prevent default behavior
        });

        return () => subscription.remove();
    }, [router]);

    if (!post) {
        return (
            <View style={{ padding: 16 }}>
                <Text>Post not found.</Text>
            </View>
        );
    }

    return (
        <View style={{ padding: 16 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18}}>Post ID: {post.id}</Text>
            <Text>{post.content}</Text>
        </View>
    );
}