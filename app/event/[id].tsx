import { View, Text, Image, StyleSheet, Pressable, BackHandler } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useEvents, EventType } from "@/app/data/demoEventData";
import { api } from "@/app/lib/api";
import React from "react";

export default function EventDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { events, addRSVP } = useEvents();

    const eventId = Number(id);
    const event = events.find((e: EventType & { event_id: number }) => e.event_id === eventId);

    const [authorName, setAuthorName] = useState<string | null>(null);

    useEffect(() => {
        const sub = BackHandler.addEventListener("hardwareBackPress", () => {
            router.back();
            return true;
        });
        return () => sub.remove();
    }, []);

    useEffect(() => {
        if (!event) return;
        const fetchPost = async () => {
            try {
                const data = await api(`/api/posts/${event.post_id}`);
                if (data.success && data.post) {
                    setAuthorName(data.post.author_name);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchPost();
    }, [event]);

    if (!event) {
        return (
            <View style={styles.centered}>
                <Text style={{ color: "white" }}>Event not found.</Text>
            </View>
        );
    }

    const dateObj = new Date(event.event_date);

    return (
        <View style={styles.backgroundContainer}>
            <View style={styles.card}>
                {/* EVENT INFO */}
                <Text style={styles.title}>{event.title}</Text>
                {authorName && (
                    <Pressable onPress={() => router.push(`/users/${event.organizer_id}`)}>
                        <Text style={styles.host}>Hosted by {authorName} (@userID{event.organizer_id})</Text>
                    </Pressable>
                )}

                <Text style={styles.overview}>{event.description}</Text>

                {event.location && <Text style={styles.location}>{event.location}</Text>}
                <Text style={styles.date}>
                    {dateObj.toLocaleDateString()} {dateObj.toLocaleTimeString()}
                </Text>

                {/* ATTENDING */}
                <Text style={styles.attending}>
                    👥 {event.current_attendees ?? 0} / {event.max_attendees ?? '—'}
                </Text>

                {/* BUTTONS */}
                <View style={styles.buttons}>
                    <Pressable
                        style={styles.rsvpBtn}
                        onPress={() => addRSVP(String(event.event_id))}
                    >
                        <Text style={styles.rsvpText}>RSVP</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    backgroundContainer: { flex: 1, backgroundColor: "#2E3347" },
    card: { padding: 20 },
    centered: { flex: 1, justifyContent: "center", alignItems: "center" },
    imageBox: {
        width: "100%",
        height: 200,
        marginTop: 10,
        borderRadius: 20,
        backgroundColor: "white",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
    },
    image: { width: "100%", height: "100%", resizeMode: "cover" },
    title: { fontSize: 26, fontWeight: "700", color: "white", marginTop: 16 },
    host: { color: "#B8BED0", marginBottom: 10 },
    overview: { fontSize: 18, color: "white", marginBottom: 15 },
    location: { fontSize: 15, color: "white" },
    date: { fontSize: 15, color: "#B8BED0" },
    attending: { marginTop: 16, fontSize: 16, color: "#B8BED0", fontWeight: "600", textAlign: "center" },
    buttons: { flexDirection: "row", marginTop: 20, justifyContent: "space-between" },
    rsvpBtn: { flex: 1, paddingVertical: 12, borderRadius: 30, backgroundColor: "white", alignItems: "center" },
    rsvpText: { color: "#2E3347", fontWeight: "700" },
});
