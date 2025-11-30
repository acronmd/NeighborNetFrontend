import { EventType } from '@/app/data/demoEventData'; // adjust import if needed
import { useComments } from '@/app/hooks/useComments';
import { api } from "@/app/lib/api";
import CommentInput from '@/components/ui/CommentInput';
import CommentList from '@/components/ui/CommentList';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

type EventPostProps = EventType & {
    current_attendees?: number;
};

export default function EventPost({
                                      title,
                                      event_id,
                                      post_id,
                                      description,
                                      location,
                                      event_date,
                                      max_attendees,
                                      current_attendees,
                                      organizer_id,
                                      status,
                                  }: EventPostProps) {
    const router = useRouter();
    const [replyText, setReplyText] = useState('');
    const { comments, loading, createComment } = useComments(post_id);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleReply = async () => {
        if (!replyText.trim()) return;
        await createComment(replyText.trim());
        setReplyText('');
    };

    const handleCreateComment = async (content: string) => {
        if (!content.trim() || isSubmitting) return;
            setIsSubmitting(true);
        try {
            await createComment(content.trim()); // the hook will re-fetch comments
        } catch (err) {
            console.error('createComment error', err);
            Alert.alert('Error', 'Could not post comment.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const [authorName, setAuthorName] = useState<string | null>(null);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const data = await api(`/api/posts/${post_id}`);
                if (data.success && data.post) {
                    setAuthorName(data.post.author_name);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchPost();
    }, [post_id]);

    const dateObj = new Date(event_date);

    return (
        <View style={styles.card}>
            {/* Right Side Text */}
            <View style={styles.rightContent}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.host}>Hosted by {authorName} (@userID{organizer_id})</Text>

                <Text style={styles.location}>{description}</Text>

                {location && <Text style={styles.location}>{location}</Text>}
                <Text style={styles.date}>{dateObj.toLocaleDateString()} {dateObj.toLocaleTimeString()}</Text>

                <Text style={styles.attendingText}>
                    👥 {current_attendees ?? 0} / {max_attendees ?? '—'}
                </Text>

                <View style={styles.buttons}>
                    <Pressable
                        style={styles.detailsBtn}
                        onPress={() => router.push(`/event/${event_id}`)}
                    >
                        <Text style={styles.detailsText}>Details</Text>
                    </Pressable>

                </View>
                {/* Comments section */}
                <View style={{ marginTop: 12 }}>
                    {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <CommentList comments={comments} />
                    )}

                    <CommentInput onSubmit={async (text) => {
                        await handleCreateComment(text);
                    }} />

                    {isSubmitting ? <Text style={{ color: '#B8BED0', marginTop: 6 }}>Sending...</Text> : null}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: '#3C4159',
        padding: 16,
        borderRadius: 24,
        marginVertical: 10,
        marginHorizontal: 12,
    },
    rightContent: {
        flex: 1,
    },
    title: { fontSize: 20, fontWeight: '700', color: 'white' },
    host: { marginTop: 2, color: '#B8BED0', fontSize: 14 },
    location: { marginTop: 12, color: 'white', fontSize: 15 },
    date: { color: '#B8BED0', fontSize: 13, marginTop: 2 },
    attendingText: { marginTop: 8, color: '#B8BED0', fontSize: 14, fontWeight: '600' },
    buttons: { flexDirection: 'row', marginTop: 16, alignItems: 'center' },
    detailsBtn: { paddingVertical: 8, paddingHorizontal: 22, borderRadius: 24, backgroundColor: '#2E3347', marginRight: 12 },
    detailsText: { color: 'white', fontWeight: '600' },
});
