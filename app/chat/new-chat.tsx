import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform, StatusBar } from 'react-native';
import { api } from "../lib/_api";

type Contact = { user_id: number; display_name: string; username: string; profile_image_url?: string };

export default function NewChatScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [groupName, setGroupName] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const json = await api('/contacts/my-contacts', { method: 'GET' });
                setContacts(json.contacts || []);
            } catch (err: any) {
                console.error('Failed load contacts:', err.message || 'Unknown error');
                Alert.alert('Error', 'Failed to load contacts');
            } finally {
                setInitialLoading(false);
            }
        })();
        // preselect a user if provided via query param ?select=123
        const select = params.select ? Number(params.select) : undefined;
        if (select) setSelected([select]);
    }, []);

    const toggle = (id: number) => {
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const startDM = (id?: number) => {
        const target = id ?? selected[0];
        if (!target) return Alert.alert('Select a contact');
        // Navigate to DM screen; user can send message there
        router.push((`/chat/dm/${target}`) as any);
    };

    const createGroup = async () => {
        if (!groupName.trim()) return Alert.alert('Group name required');
        if (selected.length === 0) return Alert.alert('Select at least one contact');
        setLoading(true);
        try {
            const payload = { name: groupName.trim(), description: '', group_type: 'custom', is_private: false };
            const res = await api('/groups/create', { method: 'POST', body: JSON.stringify(payload) });
            const groupId = res.group_id;
            // Optionally add selected members
            for (let uid of selected) {
                try {
                    await api(`/groups/${groupId}/members`, { method: 'POST', body: JSON.stringify({ user_id: uid }) });
                } catch (err) {
                    // ignore individual add failures
                    console.warn('Failed to add member', uid, err);
                }
            }
            Alert.alert('Group created');
            router.push((`/chat/group/${groupId}`) as any);
        } catch (err) {
            console.error('Create group failed', err);
            Alert.alert('Failed to create group');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4A90E2" />
                <Text style={styles.loadingText}>Loading contacts...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Trusted Contacts</Text>
                    {contacts.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>👥</Text>
                            <Text style={styles.emptyText}>No contacts yet</Text>
                            <Text style={styles.emptySubtext}>Add contacts to start chatting</Text>
                        </View>
                    ) : (
                        <View>
                            {contacts.map((item) => (
                                <TouchableOpacity 
                                    key={item.user_id}
                                    style={[styles.contactRow, selected.includes(item.user_id) && styles.contactSelected]} 
                                    onPress={() => toggle(item.user_id)}
                                >
                                    <View style={styles.contactInfo}>
                                        <Text style={styles.contactName}>{item.display_name}</Text>
                                        <Text style={styles.contactUsername}>@{item.username}</Text>
                                    </View>
                                    <TouchableOpacity 
                                        style={styles.messageButton}
                                        onPress={() => startDM(item.user_id)}
                                    >
                                        <Text style={styles.messageButtonText}>Message</Text>
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {contacts.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Create Group Chat</Text>
                        <Text style={styles.sectionSubtitle}>
                            Select contacts above, then enter a group name
                        </Text>
                        <TextInput 
                            placeholder="Enter group name" 
                            placeholderTextColor="#95a5a6"
                            value={groupName} 
                            onChangeText={setGroupName} 
                            style={styles.input}
                            editable={!loading}
                        />
                        <TouchableOpacity 
                            style={[styles.groupButton, (loading || selected.length === 0) && styles.groupButtonDisabled]} 
                            onPress={createGroup} 
                            disabled={loading || selected.length === 0}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="white" />
                            ) : (
                                <Text style={styles.groupButtonText}>
                                    Create Group ({selected.length} selected)
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f5f8fa' 
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f8fa'
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#657786'
    },
    scrollView: {
        flex: 1
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40
    },
    section: { 
        marginBottom: 24
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#14171a',
        marginBottom: 8
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#657786',
        marginBottom: 12
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        marginTop: 8
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#14171a',
        marginBottom: 4
    },
    emptySubtext: {
        fontSize: 14,
        color: '#657786',
        textAlign: 'center'
    },
    contactRow: { 
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    },
    contactSelected: { 
        borderWidth: 2,
        borderColor: '#4A90E2',
        backgroundColor: '#EBF5FB'
    },
    contactInfo: {
        flex: 1,
        marginRight: 12
    },
    contactName: { 
        fontSize: 16,
        fontWeight: '600',
        color: '#14171a',
        marginBottom: 2
    },
    contactUsername: {
        fontSize: 14,
        color: '#657786'
    },
    messageButton: {
        backgroundColor: '#4A90E2',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8
    },
    messageButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14
    },
    input: { 
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 10,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e1e8ed',
        marginBottom: 12
    },
    groupButton: { 
        backgroundColor: '#4A90E2',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48
    },
    groupButtonDisabled: {
        backgroundColor: '#95a5a6',
        opacity: 0.6
    },
    groupButtonText: { 
        color: 'white',
        fontWeight: '700',
        fontSize: 16
    },
});
