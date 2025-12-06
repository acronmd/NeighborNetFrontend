import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { router, Tabs } from 'expo-router';
import React, {useEffect, useState} from 'react';
import {Text, TouchableOpacity, View} from 'react-native';
import { api } from '@/app/lib/_api';
import { notificationEmitter } from "@/app/emitter/notificationEmitter";

type NotificationType = {
    notification_id: number;
    user_id: number;
    type: string;
    title: string;
    message: string;
    related_id?: number;
    is_read: boolean;
    created_at: string;
};

export default function RootLayout() {
    const colorScheme = useColorScheme();

    const Colors = {
        light: { tint: '#32a852', inactive: '#888', background: '#fff' },
        dark: { tint: '#32a852', inactive: '#888', background: '#000' },
    };

    const [notifications, setNotifications] = useState<NotificationType[]>([]);

    const fetchNotifications = async () => {
        try {
            const data = await api('/api/notifications?limit=50');
            setNotifications(data.notifications || []);
        } catch (err) {
            console.log('Failed to fetch notifications', err);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const unsubscribe = notificationEmitter.subscribe(() => {
            fetchNotifications(); // ✅ Refresh unread count
            setUnreadCount(notifications.filter(n => !n.is_read).length);
        });

        return unsubscribe;
    }, []);

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
                    headerRight: () => {
                        const unreadCount = notifications.filter(n => !n.is_read).length;

                        return (
                            <TouchableOpacity
                                onPress={() => router.push('/notifications')}
                                style={{ marginRight: 16 }}
                            >
                                <IconSymbol size={24} name="house.fill" color={Colors[colorScheme ?? 'dark'].tint} />
                                {unreadCount > 0 && (
                                    <View
                                        style={{
                                            position: 'absolute',
                                            top: -4,
                                            right: -4,
                                            backgroundColor: '#E74C3C',
                                            borderRadius: 8,
                                            minWidth: 16,
                                            height: 16,
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            paddingHorizontal: 4,
                                        }}
                                    >
                                        <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                                            {unreadCount}
                                        </Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        );
                    },
                }}
            />
            <Tabs.Screen
                name="notifications"
                options={{
                    title: "Notifications",
                    href: null,
                    tabBarIcon: ({ color }) => <IconSymbol name="bell.fill" color={color} />,
                }}
            />
            <Tabs.Screen
                name="create-post"
                options={{
                    title: 'Post',
                    href: null,
                    tabBarIcon: ({ color }) => <IconSymbol size={28} name="plus.circle.fill" color={color} />,
                }}
            />
            <Tabs.Screen
                name="old-feed"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="event-feed"
                options={{
                    href: null,
                }}
                // options={{
                //     title: 'Events',
                //     tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
                //     headerRight: () => (
                //         <TouchableOpacity
                //             onPress={() => router.push('/event/newEvent')}
                //             style={{ marginRight: 12 }}
                //         >
                //             <Text style={{ fontSize: 28, fontWeight: 'bold' }}>+</Text>
                //         </TouchableOpacity>
                //     ),
                // }}
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
