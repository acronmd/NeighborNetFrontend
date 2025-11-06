import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function PostDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();

    return (
        <View style={{ padding: 16 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18 }}>Post ID: {id}</Text>
            <Text>Details about this post would go here.</Text>
        </View>
    );
}
