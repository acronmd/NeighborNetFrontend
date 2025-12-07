import { EventType } from "../data/_demoEventData"; // adjust import if needed
import { useComments } from "../hooks/_useComments";
import { api } from "../lib/_api";
import CommentInput from '@/components/ui/CommentInput';
import CommentList from '@/components/ui/CommentList';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
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
                                      poi,
                                      event_date,
                                      max_attendees,
                                      current_attendees,
                                      organizer_id,
                                      status,
                                  }: EventPostProps) {
    const router = useRouter();
    const { comments, loading, createComment, fetchComments } = useComments(post_id);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Post comment to event-specific endpoint using stored token/ip
    const handleReply = async (content?: string) => {
        const bodyText = (content ?? '').trim();
        if (!bodyText || isSubmitting) return;
        setIsSubmitting(true);
        try {
            await createComment(bodyText);
            if (typeof fetchComments === 'function') await fetchComments();
        } catch (err) {
            console.error('handleReply error', err);
            Alert.alert('Error', 'Could not post comment.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const [authorName, setAuthorName] = useState<string | null>(null);
    const [authorUsername, setAuthorUsername] = useState<string | null>(null);
    const [authorDisplayName, setAuthorDisplayName] = useState<string | null>(null);


    useEffect(() => {
        const fetchPost = async () => {
            try {
                const data = await api(`/api/posts/${post_id}`);
                if (data.success && data.post) {
                    setAuthorName(data.post.author_name);
                    setAuthorUsername(data.post.username);
                    setAuthorDisplayName(data.post.display_name);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchPost();
    }, [post_id]);

    const dateObj = new Date(event_date);

    // Map API comment shape to local CommentType expected by CommentList
    const mappedComments = (comments || []).map((c: any) => ({
        id: c.comment_id,
        userData: { authorUsername: c.author_name, id: c.user_id },
        text: c.content,
        createdAt: c.created_at || new Date().toISOString(),
    }));

    return (
        <View style={styles.card}>
            {/* Right Side Text */}
            <View style={styles.rightContent}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.host}>Hosted by {authorName} ({authorDisplayName})</Text>

                <Text style={styles.location}>{description}</Text>

                {location && <Text style={styles.location}>{poi}</Text>}
                {!poi && location && <Text style={styles.location}>{location}</Text>}
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
                        <CommentList comments={mappedComments} />
                    )}

                    <CommentInput onSubmit={async (text) => {
                        await handleReply(text);
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
