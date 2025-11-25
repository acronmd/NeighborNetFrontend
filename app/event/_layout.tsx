import { Stack } from 'expo-router';
import React from 'react';

export default function FeedStackLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: true,  // enable header for all feed screens
            }}
        >
            <Stack.Screen
                name="[id]"
                options={{ title: 'Event Details' }}
            />
        </Stack>
    );
}
