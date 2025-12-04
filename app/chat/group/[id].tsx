import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from '../../lib/api';

type GroupMessage = {
    message_id: number;
    content: string;
    created_at: string;
    user_id: number;
    display_name?: string;
};

export default function GroupThread() {
    const params = useLocalSearchParams();
    const id = Number(params.id);
    const [messages, setMessages] = useState<GroupMessage[]>([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(true);
    const flatRef = useRef<any>(null);

    useEffect(() => {
        (async () => {
            try {
                const json = await api(`/groups/${id}/messages`, { method: 'GET' });
                setMessages(json.messages || []);
            } catch (err) {
                console.error('Failed to load group messages', err);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const send = async () => {
        if (!text.trim()) return;
        try {
            const res = await api(`/groups/${id}/messages`, { method: 'POST', body: JSON.stringify({ content: text.trim() }) });
            if (res.message) setMessages(prev => [...prev, res.message]);
            setText('');
            setTimeout(() => flatRef.current?.scrollToEnd?.(), 100);
        } catch (err) {
            console.error('Send group message failed', err);
        }
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.container}>
                <FlatList
                    ref={flatRef}
                    data={messages}
                    keyExtractor={(m) => m.message_id.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.messageRow}>
                            <Text style={styles.sender}>{item.display_name ?? 'Member'}</Text>
                            <Text style={styles.messageText}>{item.content}</Text>
                            <Text style={styles.time}>{new Date(item.created_at).toLocaleString()}</Text>
                        </View>
                    )}
                    contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
                />

                <View style={styles.composer}>
                    <TextInput value={text} onChangeText={setText} placeholder="Write a message to group" style={styles.input} />
                    <TouchableOpacity style={styles.sendButton} onPress={send}><Text style={{ color: 'white', fontWeight: '700' }}>Send</Text></TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f8fa' },
    messageRow: { backgroundColor: 'white', padding: 10, borderRadius: 10, marginBottom: 8 },
    sender: { fontWeight: '700', marginBottom: 4 },
    messageText: { color: '#14171a' },
    time: { fontSize: 11, color: '#95a5a6', marginTop: 6 },
    composer: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', padding: 8, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
    input: { flex: 1, backgroundColor: '#f0f4f8', padding: 10, borderRadius: 8, marginRight: 8 },
    sendButton: { backgroundColor: '#4A90E2', paddingHorizontal: 14, justifyContent: 'center', borderRadius: 8 },
});