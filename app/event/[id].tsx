import { EventType, useEvents } from "@/app/data/demoEventData";
import { api } from "@/app/lib/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {Alert, BackHandler, Pressable, StyleSheet, Text, View} from "react-native";
import * as SecureStore from "expo-secure-store";


export default function EventDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { events } = useEvents();

    const eventId = Number(id);
    const event = events.find((e: EventType & { event_id: number }) => e.event_id === eventId);

    const [authorName, setAuthorName] = useState<string | null>(null);
    const [authorUsername, setAuthorUsername] = useState<string | null>(null);

    const [rsvpStatus, setRsvpStatus] = useState<string | null>(null);
    const [rsvpLoading, setRsvpLoading] = useState(false);
    const [currentAttendees, setCurrentAttendees] = useState(event?.current_attendees ?? 0);

    useEffect(() => {
        const fetchRSVP = async () => {
            try {
                const token = await SecureStore.getItemAsync("authToken");
                const ip = await SecureStore.getItemAsync("serverIp");

                const res = await fetch(`http://${ip}/api/events/${eventId}/rsvp`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (data.success && data.rsvp) {
                    setRsvpStatus(data.rsvp.status);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchRSVP();
    }, [eventId]);


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
                const token = await SecureStore.getItemAsync("authToken");
                const ip = await SecureStore.getItemAsync("serverIp");

                const res = await fetch(`http://${ip}/api/users/public/${event.organizer_id}`, {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await res.json();

                if (data.success && data.user) {
                    setAuthorName(data.user.display_name);
                    setAuthorUsername(data.user.username);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchPost();
    }, [event]);

    const handleRSVP = async (status: "going" | "interested" | "not_going") => {
        if (rsvpLoading) return;
        setRsvpLoading(true);

        try {
            const token = await SecureStore.getItemAsync("authToken");
            const ip = await SecureStore.getItemAsync("serverIp");

            const res = await fetch(`http://${ip}/api/events/${eventId}/rsvp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status }),
            });
            const data = await res.json();

            if (data.success) {
                setRsvpStatus(data.status);
                if (data.current_attendees !== undefined) {
                    setCurrentAttendees(data.current_attendees);
                }
            } else {
                Alert.alert("Error", data.error || "Could not RSVP");
            }
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Could not RSVP");
        } finally {
            setRsvpLoading(false);
        }
    };


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
                        <Text style={styles.host}>Hosted by {authorName} (@{authorUsername})</Text>
                    </Pressable>
                )}

                <Text style={styles.overview}>{event.description}</Text>

                {event.location && <Text style={styles.location}>{event.location}</Text>}
                <Text style={styles.date}>
                    {dateObj.toLocaleDateString()} {dateObj.toLocaleTimeString()}
                </Text>

                {/* ATTENDING */}
                <Text style={styles.attending}>
                    👥 {currentAttendees} / {event.max_attendees ?? "—"}
                </Text>

                {/* BUTTONS */}
                <View style={styles.buttons}>
                    {["going", "interested", "not_going"].map((statusOption) => (
                        <Pressable
                            key={statusOption}
                            onPress={() => handleRSVP(statusOption as any)}
                            style={{
                                flex: 1,
                                paddingVertical: 12,
                                borderRadius: 30,
                                marginHorizontal: 4,
                                alignItems: "center",
                                backgroundColor: rsvpStatus === statusOption ? "#4CAF50" : "white",
                            }}
                        >
                            <Text
                                style={{
                                    color: rsvpStatus === statusOption ? "white" : "#2E3347",
                                    fontWeight: "700",
                                    textTransform: "capitalize",
                                }}
                            >
                                {statusOption}
                            </Text>
                        </Pressable>
                    ))}
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
