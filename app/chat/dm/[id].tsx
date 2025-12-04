import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from "../../lib/_api";

type DMMessage = {
	message_id: number;
	content: string;
	created_at: string;
	sender_id: number;
	receiver_id: number;
	sender_name?: string;
};

export default function DMThread() {
	const router = useRouter();
	const params = useLocalSearchParams();
	const otherId = Number(params.id);
	const [messages, setMessages] = useState<DMMessage[]>([]);
	const [text, setText] = useState('');
	const [otherUserName, setOtherUserName] = useState('');
	const [currentUserId, setCurrentUserId] = useState<number | null>(null);
	const flatRef = useRef<any>(null);
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);

	useEffect(() => {
		// Get current user ID
		(async () => {
			try {
				const me = await api('/users/profile', { method: 'GET' });
				if (me && me.user) setCurrentUserId(me.user.user_id);
			} catch (err) {
				console.warn('Failed to fetch current user', err);
			}
		})();

		// Load messages
		(async () => {
			try {
				const json = await api(`/direct/${otherId}/messages`, { method: 'GET' });
				setMessages(json.messages || []);
				
				// Get other user's name from first message
				if (json.messages && json.messages.length > 0) {
					const firstMsg = json.messages[0];
					const name = firstMsg.sender_id === otherId ? firstMsg.sender_name : 'User';
					setOtherUserName(name || 'User');
				}
				
				setTimeout(() => flatRef.current?.scrollToEnd?.({ animated: false }), 100);
			} catch (err: any) {
				console.error('Failed to load direct messages:', err.message || 'Unknown error');
			} finally {
				setLoading(false);
			}
		})();
	}, [otherId]);

	const send = async () => {
		if (!text.trim() || sending) return;
		
		setSending(true);
		const messageContent = text.trim();
		setText(''); // Clear immediately for better UX
		
		try {
			const res = await api('/direct/send', {
				method: 'POST',
				body: JSON.stringify({ receiver_id: otherId, content: messageContent }),
			});

			if (res.message) {
				setMessages(prev => [...prev, res.message]);
				setTimeout(() => flatRef.current?.scrollToEnd?.({ animated: true }), 100);
			}
		} catch (err: any) {
			console.error('Send direct message failed:', err.message || 'Unknown error');
			setText(messageContent); // Restore text on error
		} finally {
			setSending(false);
		}
	};

	if (loading) {
		return (
			<View style={styles.centerContainer}>
				<ActivityIndicator size="large" color="#4A90E2" />
				<Text style={styles.loadingText}>Loading messages...</Text>
			</View>
		);
	}

	return (
		<KeyboardAvoidingView 
			style={{ flex: 1 }} 
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
		>
			<View style={styles.container}>
				{messages.length === 0 ? (
					<View style={styles.emptyContainer}>
						<Text style={styles.emptyIcon}>💬</Text>
						<Text style={styles.emptyText}>No messages yet</Text>
						<Text style={styles.emptySubtext}>Start the conversation!</Text>
					</View>
				) : (
					<FlatList
						ref={flatRef}
						data={messages}
						keyExtractor={(m) => m.message_id.toString()}
						renderItem={({ item }) => {
							const isSelf = currentUserId ? item.sender_id === currentUserId : item.sender_id !== otherId;
							return (
								<View style={[styles.messageRow, isSelf ? styles.messageRowSelf : undefined]}>
									<View style={[styles.bubble, isSelf ? styles.bubbleSelf : styles.bubbleOther]}>
										<Text style={[styles.messageText, isSelf ? styles.messageTextSelf : undefined]}>
											{item.content}
										</Text>
										<Text style={[styles.time, isSelf ? styles.timeSelf : undefined]}>
											{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
										</Text>
									</View>
								</View>
							);
						}}
						contentContainerStyle={{ padding: 12, paddingBottom: 20 }}
						onContentSizeChange={() => flatRef.current?.scrollToEnd?.({ animated: false })}
					/>
				)}

				<View style={styles.composer}>
					<TextInput 
						value={text} 
						onChangeText={setText} 
						placeholder="Type a message..." 
						placeholderTextColor="#95a5a6"
						style={styles.input}
						multiline
						maxLength={1000}
						editable={!sending}
					/>
					<TouchableOpacity 
						style={[styles.sendButton, (!text.trim() || sending) && styles.sendButtonDisabled]} 
						onPress={send}
						disabled={!text.trim() || sending}
					>
						{sending ? (
							<ActivityIndicator size="small" color="white" />
						) : (
							<Text style={styles.sendButtonText}>Send</Text>
						)}
					</TouchableOpacity>
				</View>
			</View>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: '#f5f8fa' },
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
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 32
	},
	emptyIcon: {
		fontSize: 64,
		marginBottom: 16
	},
	emptyText: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#14171a',
		marginBottom: 8
	},
	emptySubtext: {
		fontSize: 14,
		color: '#657786',
		textAlign: 'center'
	},
	messageRow: { 
		alignItems: 'flex-start', 
		marginBottom: 8,
		paddingHorizontal: 4
	},
	messageRowSelf: { alignItems: 'flex-end' },
	bubble: { 
		padding: 12,
		borderRadius: 18,
		maxWidth: '80%',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 2
	},
	bubbleSelf: { 
		backgroundColor: '#4A90E2',
		borderBottomRightRadius: 4
	},
	bubbleOther: {
		backgroundColor: 'white',
		borderBottomLeftRadius: 4
	},
	messageText: { 
		fontSize: 16,
		lineHeight: 22,
		color: '#14171a'
	},
	messageTextSelf: {
		color: 'white'
	},
	time: { 
		fontSize: 11,
		color: '#95a5a6',
		marginTop: 4,
		alignSelf: 'flex-end'
	},
	timeSelf: {
		color: '#e6f0ff'
	},
	composer: { 
		flexDirection: 'row',
		padding: 12,
		backgroundColor: '#fff',
		borderTopWidth: 1,
		borderTopColor: '#e1e8ed',
		alignItems: 'flex-end'
	},
	input: { 
		flex: 1,
		backgroundColor: '#f0f4f8',
		padding: 12,
		paddingTop: 12,
		borderRadius: 20,
		marginRight: 8,
		fontSize: 16,
		maxHeight: 100,
		minHeight: 40
	},
	sendButton: { 
		backgroundColor: '#4A90E2',
		paddingHorizontal: 20,
		paddingVertical: 10,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 20,
		minWidth: 70
	},
	sendButtonDisabled: {
		backgroundColor: '#95a5a6',
		opacity: 0.5
	},
	sendButtonText: {
		color: 'white',
		fontWeight: '700',
		fontSize: 15
	}
});
