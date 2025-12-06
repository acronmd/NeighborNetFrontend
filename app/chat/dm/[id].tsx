import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from "../../lib/_api";
import { useFocusEffect } from '@react-navigation/native';

type DMMessage = {
	message_id: number;
	content: string;
	created_at: string;
	sender_id: number;
	receiver_id: number;
	sender_name?: string;
	sender_username?: string;
	sender_image?: string;
	is_read?: boolean;
};

type UserStatus = {
	user_id: number;
	is_online: boolean;
	last_seen: string;
};

export default function DMThread() {
	const router = useRouter();
	const params = useLocalSearchParams();
	const otherId = Number(params.id);
	const [messages, setMessages] = useState<DMMessage[]>([]);
	const [text, setText] = useState('');
	const [otherUserName, setOtherUserName] = useState('');
	const [currentUserId, setCurrentUserId] = useState<number | null>(null);
	const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
	const flatRef = useRef<any>(null);
	const [loading, setLoading] = useState(true);
	const [sending, setSending] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const pollingInterval = useRef<NodeJS.Timeout | null>(null);

	// Get current user ID
	useEffect(() => {
		(async () => {
			try {
				const me = await api('/users/profile', { method: 'GET' });
				if (me && me.user) setCurrentUserId(me.user.user_id);
			} catch (err) {
				console.warn('Failed to fetch current user', err);
			}
		})();
	}, []);

	// Fetch messages function
	const fetchMessages = async (silent = false) => {
		try {
			const json = await api(`/direct/${otherId}/messages?limit=50`, { method: 'GET' });
			setMessages(json.messages || []);
			
			// Get other user's name from first message or API
			if (json.messages && json.messages.length > 0) {
				const firstMsg = json.messages[0];
				const name = firstMsg.sender_id === otherId ? firstMsg.sender_name : 'User';
				setOtherUserName(name || 'User');
			}
			
			if (!silent) {
				setTimeout(() => flatRef.current?.scrollToEnd?.({ animated: false }), 100);
			}
		} catch (err: any) {
			console.error('Failed to load direct messages:', err.message || 'Unknown error');
			if (!silent) {
				Alert.alert('Error', 'Failed to load messages');
			}
		} finally {
			if (!silent) {
				setLoading(false);
			}
		}
	};

	// Fetch user online status
	const fetchUserStatus = async () => {
		try {
			const status = await api(`/direct/user/${otherId}/status`, { method: 'GET' });
			setUserStatus(status);
		} catch (err) {
			console.warn('Failed to fetch user status:', err);
		}
	};

	// Mark messages as read
	const markMessagesAsRead = async () => {
		try {
			const unreadMessages = messages.filter(m => 
				!m.is_read && m.sender_id === otherId
			);
			
			for (const msg of unreadMessages) {
				try {
					await api(`/direct/messages/${msg.message_id}/read`, { method: 'PATCH' });
				} catch (err) {
					console.warn('Failed to mark message as read:', err);
				}
			}
		} catch (err) {
			console.warn('Failed to mark messages as read:', err);
		}
	};

	// Initial load
	useEffect(() => {
		fetchMessages();
		fetchUserStatus();
	}, [otherId]);

	// Real-time polling when screen is focused
	useFocusEffect(
		React.useCallback(() => {
			// Start polling
			pollingInterval.current = setInterval(() => {
				fetchMessages(true); // Silent refresh
			}, 5000); // Poll every 5 seconds

			// Check status every 30 seconds
			const statusInterval = setInterval(fetchUserStatus, 30000);

			// Mark messages as read when viewing
			markMessagesAsRead();

			// Cleanup
			return () => {
				if (pollingInterval.current) {
					clearInterval(pollingInterval.current);
				}
				clearInterval(statusInterval);
			};
		}, [otherId, messages])
	);

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
			Alert.alert('Error', 'Failed to send message. Please try again.');
			setText(messageContent); // Restore text on error
		} finally {
			setSending(false);
		}
	};

	const handleDeleteMessage = (messageId: number) => {
		Alert.alert(
			'Delete Message',
			'Are you sure you want to delete this message?',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: async () => {
						try {
							await api(`/direct/messages/${messageId}`, { method: 'DELETE' });
							setMessages(prev => prev.filter(m => m.message_id !== messageId));
						} catch (err: any) {
							Alert.alert('Error', 'Failed to delete message');
						}
					}
				}
			]
		);
	};

	const handleEditMessage = (messageId: number, currentContent: string) => {
		Alert.prompt(
			'Edit Message',
			'Enter new message:',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Save',
					onPress: async (newContent) => {
						if (!newContent || !newContent.trim()) return;
						
						try {
							await api(`/direct/messages/${messageId}`, {
								method: 'PATCH',
								body: JSON.stringify({ content: newContent.trim() })
							});
							
							// Update local state
							setMessages(prev => prev.map(m => 
								m.message_id === messageId 
									? { ...m, content: newContent.trim(), is_edited: true, edited_at: new Date().toISOString() }
									: m
							));
						} catch (err: any) {
							Alert.alert('Error', err.message || 'Failed to edit message');
						}
					}
				}
			],
			'plain-text',
			currentContent
		);
	};

	const handleMessageLongPress = (message: DMMessage) => {
		const isSelf = currentUserId === message.sender_id;
		if (!isSelf) return; // Can only edit/delete own messages

		const options = ['Edit Message', 'Delete Message', 'Cancel'];
		
		Alert.alert(
			'Message Options',
			'',
			[
				{
					text: 'Edit Message',
					onPress: () => handleEditMessage(message.message_id, message.content)
				},
				{
					text: 'Delete Message',
					style: 'destructive',
					onPress: () => handleDeleteMessage(message.message_id)
				},
				{
					text: 'Cancel',
					style: 'cancel'
				}
			]
		);
	};

	if (loading) {
		return (
			<View style={styles.centerContainer}>
				<ActivityIndicator size="large" color="#4A90E2" />
				<Text style={styles.loadingText}>Loading messages...</Text>
			</View>
		);
	}

	const loadMoreMessages = async () => {
		if (!hasMore || loadingMore) return;
		
		setLoadingMore(true);
		try {
			const oldestMessageId = messages[0]?.message_id;
			if (!oldestMessageId) return;
			
			const json = await api(`/direct/${otherId}/messages?limit=50&before=${oldestMessageId}`, { method: 'GET' });
			
			if (json.messages && json.messages.length > 0) {
				setMessages(prev => [...json.messages, ...prev]);
			} else {
				setHasMore(false);
			}
		} catch (err: any) {
			console.warn('Failed to load more messages:', err);
		} finally {
			setLoadingMore(false);
		}
	};

	const formatLastSeen = (lastSeen: string) => {
		const now = new Date();
		const lastSeenDate = new Date(lastSeen);
		const diffMs = now.getTime() - lastSeenDate.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		
		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		const diffHours = Math.floor(diffMins / 60);
		if (diffHours < 24) return `${diffHours}h ago`;
		const diffDays = Math.floor(diffHours / 24);
		return `${diffDays}d ago`;
	};

	return (
		<KeyboardAvoidingView 
			style={{ flex: 1 }} 
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
		>
			<View style={styles.container}>
				{/* Header with online status */}
				{otherUserName && (
					<View style={styles.header}>
						<View style={styles.headerContent}>
							<Text style={styles.headerTitle}>{otherUserName}</Text>
							{userStatus && (
								<View style={styles.statusContainer}>
									{userStatus.is_online ? (
										<>
											<View style={styles.onlineDot} />
											<Text style={styles.statusText}>Active now</Text>
										</>
									) : (
										<Text style={styles.statusText}>
											Last seen {formatLastSeen(userStatus.last_seen)}
										</Text>
									)}
								</View>
							)}
						</View>
					</View>
				)}

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
								<TouchableOpacity
									style={[styles.messageRow, isSelf ? styles.messageRowSelf : undefined]}
									onLongPress={() => handleMessageLongPress(item)}
									activeOpacity={isSelf ? 0.7 : 1}
									disabled={!isSelf}
								>
									{!isSelf && item.sender_image && (
										<Image 
											source={{ uri: item.sender_image }} 
											style={styles.avatar}
											onError={() => console.log('Failed to load avatar')}
										/>
									)}
									<View style={[styles.bubble, isSelf ? styles.bubbleSelf : styles.bubbleOther]}>
										<Text style={[styles.messageText, isSelf ? styles.messageTextSelf : undefined]}>
											{item.content}
										</Text>
										<View style={styles.messageFooter}>
											<Text style={[styles.time, isSelf ? styles.timeSelf : undefined]}>
												{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
												{(item as any).is_edited && ' (edited)'}
											</Text>
											{isSelf && item.is_read && (
												<Text style={styles.readReceipt}>✓✓</Text>
											)}
										</View>
									</View>
								</TouchableOpacity>
							);
						}}
						contentContainerStyle={{ padding: 12, paddingBottom: 20 }}
						onContentSizeChange={() => flatRef.current?.scrollToEnd?.({ animated: false })}
						onEndReached={loadMoreMessages}
						onEndReachedThreshold={0.1}
						ListFooterComponent={loadingMore ? <ActivityIndicator style={{ marginVertical: 10 }} /> : null}
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
	header: {
		backgroundColor: 'white',
		borderBottomWidth: 1,
		borderBottomColor: '#e1e8ed',
		paddingHorizontal: 16,
		paddingVertical: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 3,
		elevation: 2
	},
	headerContent: {
		alignItems: 'center'
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: '700',
		color: '#14171a',
		marginBottom: 4
	},
	statusContainer: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	onlineDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: '#4CAF50',
		marginRight: 6
	},
	statusText: {
		fontSize: 13,
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
		flexDirection: 'row',
		alignItems: 'flex-end',
		marginBottom: 8,
		paddingHorizontal: 4
	},
	messageRowSelf: { 
		flexDirection: 'row-reverse'
	},
	avatar: {
		width: 32,
		height: 32,
		borderRadius: 16,
		marginRight: 8,
		marginBottom: 4,
		backgroundColor: '#dfe7ef'
	},
	bubble: { 
		padding: 12,
		borderRadius: 18,
		maxWidth: '75%',
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
	messageFooter: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 4,
		gap: 4
	},
	time: { 
		fontSize: 11,
		color: '#95a5a6'
	},
	timeSelf: {
		color: '#e6f0ff'
	},
	readReceipt: {
		fontSize: 12,
		color: '#e6f0ff',
		fontWeight: '600'
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
