import { View, Text, BackHandler } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';

export default function PostDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    useEffect(() => {
        const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
            router.replace('/feed'); // go back to feed instead of root
            return true; // prevent default
        });

        return () => subscription.remove(); // cleanup correctly
    }, [router]);

    return (
        <View style={{ padding: 16 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18 }}>Post ID: {id}</Text>
            <Text>Details about this post would go here.</Text>
        </View>
    );
}
