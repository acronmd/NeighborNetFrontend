import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router, Tabs } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

export default function RootLayout() {
    const colorScheme = useColorScheme();

    const Colors = {
        light: { tint: '#32a852', inactive: '#888', background: '#fff' },
        dark: { tint: '#32a852', inactive: '#888', background: '#000' },
    };


    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                tabBarButton: HapticTab,
                tabBarActiveTintColor: Colors[colorScheme ?? 'dark'].tint,
                tabBarInactiveTintColor: Colors[colorScheme ?? 'dark'].inactive, // add this
                tabBarStyle: {
                    backgroundColor: Colors[colorScheme ?? 'dark'].background, // force background
                },
            }}
        >
            {/*<Tabs.Screen*/}
            {/*        name="index"*/}
            {/*        options={{*/}
            {/*            title: 'Home',*/}
            {/*            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,*/}
            {/*        }}*/}
            {/*/>*/}
            {/*<Tabs.Screen*/}
            {/*    name="explore"*/}
            {/*    options={{*/}
            {/*        title: 'Explore',*/}
            {/*        tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,*/}
            {/*    }}*/}
            {/*/>*/}
            <Tabs.Screen
                name="feed"
                options={{
                    title: 'Feed',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
                }}
            />
            <Tabs.Screen
                name="notifications"
                options={{
                    title: "Notifications",
                    tabBarIcon: ({ color }) => <IconSymbol name="bell.fill" color={color} />,
                }}
            />
            <Tabs.Screen
                name="create-post"
                options={{
                    title: 'Post',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.circle.fill" color={color} />,
                }}
            />
            <Tabs.Screen
                name="event-feed"
                options={{
                    title: 'Events',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
                    headerRight: () => (
                        <TouchableOpacity
                            onPress={() => router.push('/event/newEvent')}
                            style={{ marginRight: 12 }}
                        >
                            <Text style={{ fontSize: 28, fontWeight: 'bold' }}>+</Text>
                        </TouchableOpacity>
                    ),
                }}
            />
            <Tabs.Screen
                name="badges"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="user-profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
                }}
            />
            <Tabs.Screen
                name="chat-messages"
                options={{
                    title: 'Chat',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="message.fill" color={color} />,
                }}
            />
        </Tabs>
    );
}
