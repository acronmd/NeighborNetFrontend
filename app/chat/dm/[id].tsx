import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from '../../lib/api';

type DMMessage = {
	message_id: number;
	content: string;
	created_at: string;
	sender_id: number;
	receiver_id: number;
	sender_name?: string;
};

export default function DMThread() {
	const params = useLocalSearchParams();
	const otherId = Number(params.id);
	const [messages, setMessages] = useState<DMMessage[]>([]);
	const [text, setText] = useState('');
	const flatRef = useRef<any>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		(async () => {
			try {
				const json = await api(`/direct/${otherId}/messages`, { method: 'GET' });
				setMessages(json.messages || []);
				setTimeout(() => flatRef.current?.scrollToEnd?.(), 120);
			} catch (err) {
				console.error('Failed to load direct messages', err);
			} finally {
				setLoading(false);
			}
		})();
	}, [otherId]);

	const send = async () => {
		if (!text.trim()) return;
		try {
			const res = await api('/direct/send', {
				method: 'POST',
				body: JSON.stringify({ receiver_id: otherId, content: text.trim() }),
			});

			if (res.message) setMessages(prev => [...prev, res.message]);
			setText('');
			setTimeout(() => flatRef.current?.scrollToEnd?.(), 150);
		} catch (err) {
			console.error('Send direct message failed', err);
		}
	};

	return (
		<KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
			<View style={styles.container}>
				<FlatList
					ref={flatRef}
					data={messages}
					keyExtractor={(m) => m.message_id.toString()}
					renderItem={({ item }) => {
						const isSelf = item.sender_id !== otherId;
						return (
							<View style={[styles.messageRow, isSelf ? styles.messageRowSelf : undefined]}>
								<View style={[styles.bubble, isSelf ? styles.bubbleSelf : undefined]}>
									{item.sender_name ? <Text style={styles.sender}>{isSelf ? 'You' : item.sender_name}</Text> : null}
									<Text style={styles.messageText}>{item.content}</Text>
									<Text style={styles.time}>{new Date(item.created_at).toLocaleString()}</Text>
								</View>
							</View>
						);
					}}
					contentContainerStyle={{ padding: 12, paddingBottom: 140 }}
				/>

				<View style={styles.composer}>
					<TextInput value={text} onChangeText={setText} placeholder="Write a message" style={styles.input} />
					<TouchableOpacity style={styles.sendButton} onPress={send}>
						<Text style={{ color: 'white', fontWeight: '700' }}>Send</Text>
					</TouchableOpacity>
				</View>
			</View>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#f5f8fa' },
	messageRow: { alignItems: 'flex-start', marginBottom: 8 },
	messageRowSelf: { alignItems: 'flex-end' },
	bubble: { backgroundColor: 'white', padding: 10, borderRadius: 10, maxWidth: '85%' },
	bubbleSelf: { backgroundColor: '#E6F0FF' },
	sender: { fontWeight: '700', marginBottom: 4 },
	messageText: { color: '#14171a' },
	time: { fontSize: 11, color: '#95a5a6', marginTop: 6, alignSelf: 'flex-end' },
	composer: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', padding: 8, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
	input: { flex: 1, backgroundColor: '#f0f4f8', padding: 10, borderRadius: 8, marginRight: 8 },
	sendButton: { backgroundColor: '#4A90E2', paddingHorizontal: 14, justifyContent: 'center', borderRadius: 8 },
});

