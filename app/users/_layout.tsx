import { Stack } from 'expo-router';

export default function FeedStackLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: true,  // enable header for all feed screens
            }}
        >
            <Stack.Screen
                name="[id]"
                options={{ title: 'User Details' }}
            />
        </Stack>
    );
}
