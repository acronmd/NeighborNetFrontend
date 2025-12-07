import { EventType, useEvents } from "../data/_demoEventData";
import { api } from "../lib/_api";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    BackHandler,
    Pressable,
    Linking,
    StyleSheet,
    Text,
    View,
    Alert,
    ScrollView,
    ActivityIndicator,
    Platform
} from "react-native";
import * as SecureStore from "expo-secure-store";
import {BASE_URL} from "@/app/lib/config";

type Attendee = {
    user_id: number;
    name: string;
    username: string;
};

export default function EventDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { events } = useEvents();

    const eventId = Number(id);
    const event = events.find((e: EventType & { event_id: number; poi?: string; poi_lat?: number; poi_lng?: number }) => e.event_id === eventId);

    const [authorName, setAuthorName] = useState<string | null>(null);
    const [authorUsername, setAuthorUsername] = useState<string | null>(null);
    const [authorDisplayName, setAuthorDisplayName] = useState<string | null>(null);
    const [attendees, setAttendees] = useState<Attendee[]>([]);
    const [isSignedUp, setIsSignedUp] = useState(false);
    const [loadingAttendees, setLoadingAttendees] = useState(false);
    const [currentAttendeeCount, setCurrentAttendeeCount] = useState(event?.current_attendees ?? 0);

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
                    setAuthorUsername(data.post.username);
                    setAuthorDisplayName(data.post.display_name);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchPost();
        fetchAttendees();
        checkSignUpStatus();
    }, [event]);

    const fetchAttendees = async () => {
        if (!event) return;
        setLoadingAttendees(true);
        try {
            const token = await SecureStore.getItemAsync("authToken");
            const ip = await SecureStore.getItemAsync("serverIp");

            const res = await fetch(`https://${BASE_URL}/api/events/${event.event_id}/attendees`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();
            if (data.success) {
                setAttendees(data.attendees || []);
                setCurrentAttendeeCount(data.attendees?.length || 0);
            }
        } catch (err) {
            console.error("Failed to fetch attendees:", err);
        } finally {
            setLoadingAttendees(false);
        }
    };

    const checkSignUpStatus = async () => {
        if (!event) return;
        try {
            const token = await SecureStore.getItemAsync("authToken");
            const ip = await SecureStore.getItemAsync("serverIp");

            const res = await fetch(`https://${BASE_URL}/api/events/${event.event_id}/signup/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();
            if (data.success) {
                setIsSignedUp(data.isSignedUp);
            }
        } catch (err) {
            console.error("Failed to check sign-up status:", err);
        }
    };

    const handleSignUp = async () => {
        if (!event) return;

        if (event.max_attendees && currentAttendeeCount >= event.max_attendees) {
            Alert.alert("Event Full", "This event has reached maximum capacity and is no longer accepting sign-ups.");
            return;
        }

        try {
            const token = await SecureStore.getItemAsync("authToken");
            const ip = await SecureStore.getItemAsync("serverIp");

            const res = await fetch(`https://${BASE_URL}/api/events/${event.event_id}/signup`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setIsSignedUp(true);
                setCurrentAttendeeCount(prev => prev + 1);
                Alert.alert("Success", "You've successfully signed up for this event!");
                await fetchAttendees();
            } else if (res.status === 409) {
                Alert.alert("Already Signed Up", "You're already registered for this event.");
            } else if (res.status === 400 && data.message?.includes("capacity")) {
                Alert.alert("Event Full", "Sorry, this event has reached maximum capacity.");
            } else {
                Alert.alert("Error", data.message || "Failed to sign up for event.");
            }
        } catch (err) {
            console.error("Sign-up error:", err);
            Alert.alert("Error", "Failed to sign up for event.");
        }
    };

    const handleCancelSignUp = async () => {
        if (!event) return;

        Alert.alert(
            "Cancel Sign-Up",
            "Are you sure you want to cancel your registration?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const token = await SecureStore.getItemAsync("authToken");
                            const ip = await SecureStore.getItemAsync("serverIp");

                            const res = await fetch(`https://${BASE_URL}/api/events/${event.event_id}/signup`, {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${token}` }
                            });

                            if (res.ok) {
                                setIsSignedUp(false);
                                setCurrentAttendeeCount(prev => prev - 1);
                                Alert.alert("Success", "You've cancelled your registration.");
                                await fetchAttendees();
                            } else {
                                Alert.alert("Error", "Failed to cancel registration.");
                            }
                        } catch (err) {
                            console.error("Cancel error:", err);
                            Alert.alert("Error", "Failed to cancel registration.");
                        }
                    }
                }
            ]
        );
    };

    const openInMaps = () => {
        if (!event?.location_lat || !event?.location_lng) return;

        const lat = event.location_lat;
        const lng = event.location_lng;
        const label = event.location || "Event Location";

        const url = Platform.select({
            ios: `maps://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(label)}`,
            android: `geo:${lat},${lng}?q=${encodeURIComponent(label)}`
        });

        if (url) {
            Linking.openURL(url).catch(err => console.error("Failed to open maps:", err));
        }
    };

    const openPOIInMaps = () => {
        if (!event?.location_lat || !event?.location_lng) return;

        const lat = event.location_lat;
        const lng = event.location_lng;
        const label = event.poi || "POI";

        const url = Platform.select({
            ios: `maps://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(label)}`,
            android: `geo:${lat},${lng}?q=${encodeURIComponent(label)}`
        });

        if (url) {
            Linking.openURL(url).catch(err => console.error("Failed to open POI maps:", err));
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
    const isAtCapacity = event.max_attendees && currentAttendeeCount >= event.max_attendees;

    return (
        <ScrollView style={styles.backgroundContainer}>
            <View style={styles.card}>
                {/* EVENT INFO */}
                <Text style={styles.title}>{event.title}</Text>
                {authorName && (
                    <Pressable onPress={() => router.push(`/users/${event.organizer_id}`)}>
                        <Text style={styles.host}>Hosted by {authorName} ({authorDisplayName})</Text>
                    </Pressable>
                )}

                <Text style={styles.overview}>{event.description}</Text>

                {event.poi && (
                    <Pressable onPress={openPOIInMaps}>
                        <Text style={[styles.location, { textDecorationLine: "underline" }]}>
                            📌 {event.poi}
                        </Text>
                    </Pressable>
                )}

                {event.location && (
                    <Pressable onPress={openInMaps}>
                        <Text style={[styles.location, { textDecorationLine: "underline" }]}>
                            📍 {event.location}
                        </Text>
                    </Pressable>
                )}



                <Text style={styles.date}>
                    📅 {dateObj.toLocaleDateString()} {dateObj.toLocaleTimeString()}
                </Text>

                {/* ATTENDING */}
                <Text style={[styles.attending, !!isAtCapacity && styles.atCapacity]}>
                    👥 {currentAttendeeCount} / {event.max_attendees ?? '∞'}
                    {isAtCapacity && " (FULL)"}
                </Text>

                {/* BUTTONS */}
                <View style={styles.buttons}>
                    {isSignedUp ? (
                        <Pressable style={styles.cancelBtn} onPress={handleCancelSignUp}>
                            <Text style={styles.cancelText}>Cancel Registration</Text>
                        </Pressable>
                    ) : (
                        <Pressable
                            style={[styles.rsvpBtn, !!isAtCapacity && styles.disabledBtn]}
                            onPress={handleSignUp}
                            disabled={!!isAtCapacity}
                        >
                            <Text style={styles.rsvpText}>
                                {isAtCapacity ? "Event Full" : "Sign Up"}
                            </Text>
                        </Pressable>
                    )}
                </View>

                {/* ATTENDEES LIST */}
                <View style={styles.attendeesSection}>
                    <Text style={styles.attendeesTitle}>Attendees ({currentAttendeeCount})</Text>
                    {loadingAttendees ? (
                        <ActivityIndicator color="white" style={{ marginTop: 10 }} />
                    ) : attendees.length > 0 ? (
                        <View style={styles.attendeesList}>
                            {attendees.map((attendee) => (
                                <Pressable
                                    key={attendee.user_id}
                                    style={styles.attendeeItem}
                                    onPress={() => router.push(`/users/${attendee.user_id}`)}
                                >
                                    <View style={styles.attendeeAvatar}>
                                        <Text style={styles.attendeeAvatarText}>
                                            {attendee.name[0].toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={styles.attendeeInfo}>
                                        <Text style={styles.attendeeName}>{attendee.name}</Text>
                                        <Text style={styles.attendeeUsername}>@{attendee.username}</Text>
                                    </View>
                                </Pressable>
                            ))}
                        </View>
                    ) : (
                        <Text style={styles.noAttendees}>No attendees yet. Be the first to sign up!</Text>
                    )}
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    backgroundContainer: { flex: 1, backgroundColor: "#2E3347" },
    card: { padding: 20 },
    centered: { flex: 1, justifyContent: "center", alignItems: "center" },
    imageBox: { width: "100%", height: 200, marginTop: 10, borderRadius: 20, backgroundColor: "white", justifyContent: "center", alignItems: "center", overflow: "hidden" },
    image: { width: "100%", height: "100%", resizeMode: "cover" },
    title: { fontSize: 26, fontWeight: "700", color: "white", marginTop: 16 },
    host: { color: "#B8BED0", marginBottom: 10 },
    overview: { fontSize: 18, color: "white", marginBottom: 15 },
    location: { fontSize: 15, color: "white", marginBottom: 8 },
    date: { fontSize: 15, color: "#B8BED0", marginBottom: 8 },
    attending: { marginTop: 16, fontSize: 16, color: "#B8BED0", fontWeight: "600", textAlign: "center" },
    atCapacity: { color: "#E74C3C", fontWeight: "700" },
    buttons: { flexDirection: "row", marginTop: 20, justifyContent: "space-between" },
    rsvpBtn: { flex: 1, paddingVertical: 12, borderRadius: 30, backgroundColor: "white", alignItems: "center" },
    rsvpText: { color: "#2E3347", fontWeight: "700" },
    disabledBtn: { backgroundColor: "#95a5a6", opacity: 0.6 },
    cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 30, backgroundColor: "#E74C3C", alignItems: "center" },
    cancelText: { color: "white", fontWeight: "700" },
    attendeesSection: { marginTop: 30, paddingTop: 20, borderTopWidth: 1, borderTopColor: "#B8BED0" },
    attendeesTitle: { fontSize: 20, fontWeight: "700", color: "white", marginBottom: 15 },
    attendeesList: { gap: 12 },
    attendeeItem: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.1)", padding: 12, borderRadius: 12 },
    attendeeAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#4A90E2", justifyContent: "center", alignItems: "center", marginRight: 12 },
    attendeeAvatarText: { color: "white", fontWeight: "700", fontSize: 18 },
    attendeeInfo: { flex: 1 },
    attendeeName: { fontSize: 16, fontWeight: "600", color: "white" },
    attendeeUsername: { fontSize: 14, color: "#B8BED0" },
    noAttendees: { fontSize: 14, color: "#B8BED0", fontStyle: "italic", textAlign: "center", marginTop: 10 },
});
