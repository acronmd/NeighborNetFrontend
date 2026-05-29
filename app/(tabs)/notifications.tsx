import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
    Alert
} from 'react-native';
import { api } from "../lib/_api";
import { getSocket, disconnectSocket } from "../lib/socket";
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {useSearchParams} from "expo-router/build/hooks";
import { notificationEmitter } from '@/app/emitter/notificationEmitter';

export type Notification = {
    notification_id: number;
    user_id: number;
    type: string;
    title: string;
    message: string;
    related_id?: number;
    is_read: boolean;
    created_at: string;
};

// Mock notifications for testing (remove when backend is ready)
const MOCK_NOTIFICATIONS: Notification[] = [
    {
        notification_id: 1,
        user_id: 1,
        type: 'post_like',
        title: 'New Like',
        message: 'John Doe liked your post about the community garden',
        related_id: 123,
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    },
    {
        notification_id: 2,
        user_id: 1,
        type: 'post_comment',
        title: 'New Comment',
        message: 'Jane Smith commented on your post',
        related_id: 123,
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    },
    {
        notification_id: 3,
        user_id: 1,
        type: 'event_rsvp',
        title: 'New RSVP',
        message: '5 people RSVPed to your Community Cleanup event',
        related_id: 456,
        is_read: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    },
    {
        notification_id: 4,
        user_id: 1,
        type: 'event_reminder',
        title: 'Event Reminder',
        message: 'Block Party starts in 1 hour',
        related_id: 789,
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    },
    {
        notification_id: 5,
        user_id: 1,
        type: 'badge_earned',
        title: 'Badge Earned!',
        message: 'You earned the "Community Helper" badge',
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
    },
    {
        notification_id: 6,
        user_id: 1,
        type: 'contact_request',
        title: 'New Contact Request',
        message: 'Alex Johnson wants to connect with you',
        is_read: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    },
];

export default function NotificationsScreen() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        checkAuthAndFetch();
    }, []);

    useEffect(() => {
        let active = true;

        getSocket().then((socket) => {
            if (!active) return;

            socket.on('new_notification', (notification: Notification) => {
                setNotifications(prev => [notification, ...prev]);
                notificationEmitter.emit();
            });

            socket.on('unread_count', ({ count }: { count: number }) => {
                notificationEmitter.emit();
            });
        }).catch(() => {
            // socket unavailable — polling via pull-to-refresh still works
        });

        return () => {
            active = false;
            disconnectSocket();
        };
    }, []);

    const checkAuthAndFetch = async () => {
        try {
            const token = await SecureStore.getItemAsync("authToken");
            const ip = await SecureStore.getItemAsync("serverIp");
            
            if (!token || !ip) {
                setLoading(false);
                return;
            }
            
            await fetchNotifications();
        } catch (err) {
            console.error('Auth check failed:', err);
            setLoading(false);
        }
    };

    const fetchNotifications = async () => {
        try {
            const data = await api('/api/notifications?limit=50');
            setNotifications(data.notifications || []);
        } catch (err: any) {
            console.error('Failed to fetch notifications:', err);
            
            // Check if it's a 404 or endpoint not found error
            const errorMsg = err.message?.toLowerCase() || '';
            const isEndpointMissing = errorMsg.includes('404') || 
                                     errorMsg.includes('not found') || 
                                     errorMsg.includes('route not found');
            
            if (isEndpointMissing) {
                // Use mock data when backend endpoint is not available
                console.log('Using mock notifications - backend endpoint not available yet');
                setNotifications(MOCK_NOTIFICATIONS);
            } else {
                // Show error for other issues
                Alert.alert(
                    'Connection Error',
                    `Failed to load notifications: ${err.message || 'Unknown error'}`
                );
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const markAsRead = async (notificationId: number) => {
        try {
            await api(`/api/notifications/${notificationId}/read`, {
                method: 'PATCH',
            });
            setNotifications(prev =>
                prev.map(n =>
                    n.notification_id === notificationId ? { ...n, is_read: true } : n
                )
            );
            notificationEmitter.emit();
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api('/api/notifications/read-all', {
                method: 'PATCH',
            });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            Alert.alert('Success', 'All notifications marked as read');
            notificationEmitter.emit();
        } catch (err) {
            Alert.alert('Error', 'Failed to mark all as read');
        }
    };

    const deleteNotification = async (notificationId: number) => {
        try {
            await api(`/api/notifications/${notificationId}`, {
                method: 'DELETE',
            });
            setNotifications(prev => prev.filter(n => n.notification_id !== notificationId));
            notificationEmitter.emit();
        } catch (err) {
            Alert.alert('Error', 'Failed to delete notification');
        }
    };

    const clearReadNotifications = async () => {
        Alert.alert(
            'Clear Read Notifications',
            'Are you sure you want to clear all read notifications?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api('/api/notifications/clear-read', {
                                method: 'DELETE',
                            });
                            setNotifications(prev => prev.filter(n => !n.is_read));
                            Alert.alert('Success', 'Read notifications cleared');
                        } catch (err) {
                            Alert.alert('Error', 'Failed to clear notifications');
                        }
                    },
                },
            ]
        );
        notificationEmitter.emit();
    };

    const handleNotificationPress = async (notification: Notification) => {
        // Mark as read
        if (!notification.is_read) {
            await markAsRead(notification.notification_id);
        }

        // Navigate based on type
        if (notification.type === 'post_like' || notification.type === 'post_comment') {
            router.push(`/feed/${notification.related_id}`);
        } else if (notification.type === 'event_rsvp' || notification.type === 'event_reminder') {
            router.push(`/event/${notification.related_id}`);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'post_like':
                return '❤️';
            case 'post_comment':
                return '💬';
            case 'event_rsvp':
            case 'event_reminder':
                return '🎉';
            case 'contact_request':
                return '👥';
            case 'badge_earned':
                return '🏆';
            default:
                return '🔔';
        }
    };

    const renderNotification = ({ item }: { item: Notification }) => (
        <TouchableOpacity
            style={[styles.notificationCard, !item.is_read && styles.unreadCard]}
            onPress={() => handleNotificationPress(item)}
        >
            <View style={styles.notificationHeader}>
                <Text style={styles.notificationIcon}>{getNotificationIcon(item.type)}</Text>
                <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>{item.title}</Text>
                    <Text style={styles.notificationMessage}>{item.message}</Text>
                    <Text style={styles.notificationTime}>
                        {new Date(item.created_at).toLocaleString()}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={(e) => {
                        e.stopPropagation();
                        deleteNotification(item.notification_id);
                    }}
                >
                    <Text style={styles.deleteButtonText}>✕</Text>
                </TouchableOpacity>
            </View>
            {!item.is_read && <View style={styles.unreadBadge} />}
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{unreadCount} Unread Notifications</Text>
            </View>

            {notifications.length > 0 && (
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={markAllAsRead}
                        disabled={unreadCount === 0}
                    >
                        <Text style={[styles.actionButtonText, unreadCount === 0 && styles.disabledText]}>
                            ✓ Mark All Read
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton} onPress={clearReadNotifications}>
                        <Text style={styles.actionButtonText}>🗑️ Clear Read</Text>
                    </TouchableOpacity>
                </View>
            )}

            {notifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🔔</Text>
                    <Text style={styles.emptyText}>
                        {loading ? 'Loading...' : 'No notifications yet'}
                    </Text>
                    <Text style={styles.emptySubtext}>
                        {loading 
                            ? 'Please wait...'
                            : 'You\'ll see notifications here when you get likes, comments, and more'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderNotification}
                    keyExtractor={(item) => item.notification_id.toString()}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                    }
                    contentContainerStyle={styles.listContainer}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f8fa',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e1e8ed',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#14171a',
    },
    unreadBadgeHeader: {
        backgroundColor: '#E74C3C',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    unreadBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    actionButtons: {
        flexDirection: 'row',
        padding: 12,
        gap: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e1e8ed',
    },
    actionButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#f5f8fa',
        borderRadius: 8,
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#4A90E2',
        fontWeight: '600',
        fontSize: 14,
    },
    disabledText: {
        color: '#95a5a6',
    },
    listContainer: {
        padding: 12,
    },
    notificationCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    unreadCard: {
        backgroundColor: '#EBF5FB',
        borderLeftWidth: 4,
        borderLeftColor: '#4A90E2',
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    notificationIcon: {
        fontSize: 28,
        marginRight: 12,
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#14171a',
        marginBottom: 4,
    },
    notificationMessage: {
        fontSize: 14,
        color: '#657786',
        marginBottom: 4,
    },
    notificationTime: {
        fontSize: 12,
        color: '#95a5a6',
    },
    deleteButton: {
        padding: 4,
    },
    deleteButtonText: {
        color: '#95a5a6',
        fontSize: 18,
        fontWeight: 'bold',
    },
    unreadBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4A90E2',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#14171a',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#657786',
        textAlign: 'center',
    },
});
