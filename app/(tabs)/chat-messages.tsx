import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { api } from "../lib/_api";

type DMConv = {
    user: { user_id: number; display_name: string; profile_image_url?: string } | null;
    last_message_time: string;
    unread_count: number;
};

type GroupConv = {
    group_id: number;
    name: string;
    member_count: number;
    unread_count: number;
    created_at: string;
};

export default function ChatMessagesScreen() {
    const router = useRouter();
    const [dms, setDms] = useState<DMConv[]>([]);
    const [groups, setGroups] = useState<GroupConv[]>([]);
    const [invites, setInvites] = useState<any[]>([]);
    const [mutuals, setMutuals] = useState<any[]>([]);
    const [userId, setUserId] = useState<number | null>(null);
    const [following, setFollowing] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredFollowing, setFilteredFollowing] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchConversations = useCallback(async () => {
        setLoading(true);
        // fetch current user id for following list
        try {
            const me = await api('/users/profile', { method: 'GET' });
            if (me && me.user) setUserId(me.user.user_id);
        } catch (err) {
            console.warn('Failed to fetch profile for follows', err);
        }
        
        // Fetch DMs with better error handling
        try {
            const dmJson = await api('/direct/conversations', { method: 'GET' });
            setDms(dmJson.conversations || []);
        } catch (err: any) {
            console.warn('Failed to load DMs:', err.message || 'Unknown error');
            setDms([]);
        }

        // Fetch invites with better error handling
        try {
            const invitesJson = await api('/groups/invites', { method: 'GET' });
            setInvites(invitesJson.invites || []);
        } catch (err: any) {
            console.warn('Failed to load invites:', err.message || 'Unknown error');
            setInvites([]);
        }

        // Fetch groups with better error handling
        try {
            const groupsJson = await api('/groups/my-groups', { method: 'GET' });
            setGroups(groupsJson.groups || []);
        } catch (err: any) {
            console.warn('Failed to load groups:', err.message || 'Unknown error');
            setGroups([]);
        }
        
        setLoading(false);
        setRefreshing(false);
    }, []);

    useEffect(() => {
        fetchConversations();
        // fetch trusted contacts (mutuals)
        (async () => {
            try {
                const contactsJson = await api('/contacts/my-contacts', { method: 'GET' });
                setMutuals(contactsJson.contacts || []);
            } catch (err: any) {
                console.warn('Failed to load mutuals:', err.message || 'Unknown error');
                setMutuals([]);
            }
        })();
    }, [fetchConversations]);

    // when we have userId, load following list
    useEffect(() => {
        if (!userId) return;
        (async () => {
            try {
                const f = await api(`/follows/following/${userId}?limit=200`, { method: 'GET' });
                setFollowing(f.following || []);
                setFilteredFollowing(f.following || []);
            } catch (err: any) {
                console.warn('Failed to load following list:', err.message || 'Unknown error');
                setFollowing([]);
                setFilteredFollowing([]);
            }
        })();
    }, [userId]);

    useEffect(() => {
        if (!searchQuery) return setFilteredFollowing(following);
        const q = searchQuery.toLowerCase();
        setFilteredFollowing(following.filter((u: any) => (u.display_name || '').toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q)));
    }, [searchQuery, following]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchConversations();
    };

    const acceptInvite = async (groupId: number, inviteId: string) => {
        try {
            await api(`/groups/${groupId}/invites/${inviteId}/accept`, { method: 'POST' });
            // refresh lists and navigate to group
            await fetchConversations();
            router.push((`/chat/group/${groupId}`) as any);
        } catch (err) {
            console.error('Accept invite failed', err);
            Alert.alert('Error', 'Failed to accept invite');
        }
    };

    const rejectInvite = async (groupId: number, inviteId: string) => {
        try {
            await api(`/groups/${groupId}/invites/${inviteId}/reject`, { method: 'POST' });
            await fetchConversations();
        } catch (err) {
            console.error('Reject invite failed', err);
            Alert.alert('Error', 'Failed to reject invite');
        }
    };

    const renderDM = ({ item }: { item: DMConv }) => {
        if (!item.user) return null;
        const u = item.user;
        return (
            <TouchableOpacity style={styles.card} onPress={() => router.push((`/chat/dm/${u.user_id}`) as any)}>
                <View style={styles.row}>
                    {u.profile_image_url ? (
                        <Image source={{ uri: u.profile_image_url }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}><Text style={styles.avatarInitial}>{u.display_name?.[0] ?? '?'}</Text></View>
                    )}
                    <View style={styles.content}>
                        <View style={styles.titleRow}>
                            <Text style={styles.name}>{u.display_name}</Text>
                            <Text style={styles.time}>{new Date(item.last_message_time).toLocaleString()}</Text>
                        </View>
                        <Text style={styles.message}>{item.unread_count ? `${item.unread_count} unread` : 'No new messages'}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderGroup = ({ item }: { item: GroupConv }) => (
        <TouchableOpacity style={styles.card} onPress={() => router.push((`/chat/group/${item.group_id}`) as any)}>
            <View style={styles.row}>
                <View style={styles.avatarPlaceholder}><Text style={styles.avatarInitial}>{item.name?.[0] ?? 'G'}</Text></View>
                <View style={styles.content}>
                    <View style={styles.titleRow}>
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.time}>{new Date(item.created_at).toLocaleDateString()}</Text>
                    </View>
                    <Text style={styles.message}>{item.member_count} members • {item.unread_count ? `${item.unread_count} unread` : 'No new messages'}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.headerTitle}>Messages</Text>
                <TouchableOpacity style={styles.newButton} onPress={() => router.push(('/chat/new-chat') as any)}>
                    <Text style={styles.newButtonText}>New</Text>
                </TouchableOpacity>
            </View>

            {/* Mutuals section */}
            {mutuals.length > 0 && (
                <View style={{ padding: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Mutuals</Text>
                    <FlatList
                        data={mutuals}
                        horizontal
                        keyExtractor={(i) => i.user_id.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity style={styles.mutualCard} onPress={() => router.push((`/chat/dm/${item.user_id}`) as any)}>
                                {item.profile_image_url ? <Image source={{ uri: item.profile_image_url }} style={styles.mutualAvatar} /> : <View style={styles.avatarPlaceholder}><Text style={styles.avatarInitial}>{item.display_name?.[0] ?? '?'}</Text></View>}
                                <Text style={styles.mutualName}>{item.display_name}</Text>
                            </TouchableOpacity>
                        )}
                    />
                </View>
            )}

            {/* Following search */}
            <View style={{ padding: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Search Following</Text>
                <TextInput value={searchQuery} onChangeText={setSearchQuery} placeholder="Search people you follow" style={styles.searchInput} />
                {filteredFollowing.length > 0 && (
                    <FlatList
                        data={filteredFollowing}
                        keyExtractor={(i) => i.user_id.toString()}
                        renderItem={({ item }) => (
                            <View style={[styles.card, { marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }] }>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    {item.profile_image_url ? <Image source={{ uri: item.profile_image_url }} style={styles.avatar} /> : <View style={styles.avatarPlaceholder}><Text style={styles.avatarInitial}>{item.display_name?.[0] ?? '?'}</Text></View>}
                                    <View style={{ marginLeft: 12 }}>
                                        <Text style={styles.name}>{item.display_name}</Text>
                                        <Text style={styles.message}>@{item.username}</Text>
                                    </View>
                                </View>
                                <View style={{ flexDirection: 'row' }}>
                                    <TouchableOpacity style={[styles.acceptBtn, { marginRight: 8 }]} onPress={() => router.push((`/chat/dm/${item.user_id}`) as any)}>
                                        <Text style={{ color: 'white', fontWeight: '700' }}>Message</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.declineBtn} onPress={() => router.push((`/chat/new-chat?select=${item.user_id}`) as any)}>
                                        <Text style={{ color: '#4A90E2', fontWeight: '700' }}>Invite</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    />
                )}
            </View>

            {invites.length > 0 && (
                <View style={{ padding: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Invites</Text>
                    {invites.map((inv) => (
                        <View key={inv.invite_id} style={styles.inviteCard}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.name}>{inv.group_name}</Text>
                                <Text style={styles.message}>Invited by {inv.invited_by_name || 'someone'}</Text>
                            </View>
                            <View style={styles.inviteActions}>
                                <TouchableOpacity style={styles.acceptBtn} onPress={() => acceptInvite(inv.group_id, inv.invite_id)}>
                                    <Text style={{ color: 'white', fontWeight: '700' }}>Accept</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.declineBtn} onPress={() => rejectInvite(inv.group_id, inv.invite_id)}>
                                    <Text style={{ color: '#4A90E2', fontWeight: '700' }}>Decline</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            <FlatList
                data={dms}
                keyExtractor={(item, idx) => `dm-${idx}`}
                renderItem={renderDM}
                ListHeaderComponent={() => (
                    <View style={{ paddingHorizontal: 12 }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Direct Messages</Text>
                    </View>
                )}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListFooterComponent={() => (
                    <View style={{ marginTop: 12 }}>
                        <View style={{ paddingHorizontal: 12 }}>
                            <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>Groups</Text>
                        </View>
                        <FlatList
                            data={groups}
                            keyExtractor={(g) => `g-${g.group_id}`}
                            renderItem={renderGroup}
                            contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 40 }}
                        />
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f8fa' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#e1e8ed' },
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#14171a' },
    newButton: { backgroundColor: '#4A90E2', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
    newButtonText: { color: 'white', fontWeight: '700' },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 1,
    },
    row: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 56, height: 56, borderRadius: 28, marginRight: 12, backgroundColor: '#ddd' },
    avatarPlaceholder: { width: 56, height: 56, borderRadius: 28, marginRight: 12, backgroundColor: '#dfe7ef', justifyContent: 'center', alignItems: 'center' },
    avatarInitial: { fontSize: 20, fontWeight: '700', color: '#2d6cdf' },
    content: { flex: 1 },
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    name: { fontSize: 16, fontWeight: '700', color: '#14171a' },
    time: { fontSize: 12, color: '#95a5a6' },
    message: { color: '#657786', marginTop: 4 },
    unreadBadge: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#4A90E2', marginLeft: 8 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 18, color: '#657786' },
    inviteCard: { backgroundColor: 'white', padding: 12, borderRadius: 10, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    inviteActions: { flexDirection: 'row', gap: 8 },
    acceptBtn: { backgroundColor: '#4A90E2', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, marginRight: 8 },
    declineBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#4A90E2', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
    mutualCard: { alignItems: 'center', marginRight: 12, width: 84 },
    mutualAvatar: { width: 56, height: 56, borderRadius: 28, marginBottom: 6 },
    mutualName: { fontSize: 12, textAlign: 'center' },
    searchInput: { backgroundColor: 'white', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e6eef8' },
});
