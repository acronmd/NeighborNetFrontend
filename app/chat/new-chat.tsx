import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from '../lib/api';

type Contact = { user_id: number; display_name: string; username: string; profile_image_url?: string };

export default function NewChatScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [selected, setSelected] = useState<number[]>([]);
    const [groupName, setGroupName] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const json = await api('/contacts/my-contacts', { method: 'GET' });
                setContacts(json.contacts || []);
            } catch (err) {
                console.error('Failed load contacts', err);
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

    return (
        <View style={styles.container}>
            <Text style={styles.title}>New Chat</Text>

            <Text style={styles.section}>Trusted Contacts</Text>
            <FlatList
                data={contacts}
                keyExtractor={(i) => i.user_id.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity style={[styles.contactRow, selected.includes(item.user_id) && styles.contactSelected]} onPress={() => toggle(item.user_id)}>
                        <Text style={styles.contactName}>{item.display_name} • @{item.username}</Text>
                        <TouchableOpacity onPress={() => startDM(item.user_id)}>
                            <Text style={styles.startLink}>Message</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                )}
            />

            <Text style={styles.section}>Create Group</Text>
            <TextInput placeholder="Group name" value={groupName} onChangeText={setGroupName} style={styles.input} />
            <TouchableOpacity style={styles.groupButton} onPress={createGroup} disabled={loading}>
                <Text style={styles.groupButtonText}>{loading ? 'Creating…' : 'Create Group with Selected'}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 12, backgroundColor: '#f5f8fa' },
    title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
    section: { marginTop: 12, marginBottom: 6, fontWeight: '700' },
    contactRow: { padding: 12, backgroundColor: 'white', borderRadius: 10, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    contactSelected: { borderWidth: 2, borderColor: '#4A90E2' },
    contactName: { fontSize: 16 },
    startLink: { color: '#4A90E2', fontWeight: '700' },
    input: { backgroundColor: 'white', padding: 10, borderRadius: 10 },
    groupButton: { marginTop: 8, backgroundColor: '#4A90E2', padding: 12, borderRadius: 10, alignItems: 'center' },
    groupButtonText: { color: 'white', fontWeight: '700' },
});
