import { Tabs } from 'expo-router';
import React from 'react';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

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
                name="feed" // now a proper tab child
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet" color={color} />,
                }}
            />
            <Tabs.Screen
                name="create-post" // now a proper tab child
                options={{
                    title: 'Post',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.circle.fill" color={color} />,
                }}
            />
            <Tabs.Screen
                name="user-profile" // now a proper tab child
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.fill" color={color} />,
                }}
            />
        </Tabs>
    );
}
