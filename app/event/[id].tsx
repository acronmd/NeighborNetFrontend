import { View, Text, Image, StyleSheet, Pressable, BackHandler } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { useEvents } from "@/app/data/demoEventData";

export default function EventDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { events, addRSVP } = useEvents();

    const eventId = Number(id);
    const event = Object.values(events).find(e => e.id === eventId);

    useEffect(() => {
        const sub = BackHandler.addEventListener("hardwareBackPress", () => {
            router.back();
            return true;
        });
        return () => sub.remove();
    }, []);

    if (!event) {
        return (
            <View>
                <Text>Event not found.</Text>
            </View>
        );
    }

    return (
        <View style={styles.backgroundContainer}>
            <View style={styles.card}>
                {/* HEADER
                    <View style={styles.header}>
                        <Pressable onPress={() => router.push(`/users/${event.userData.id}`)}>
                            <Image
                                source={
                                    event.userData.avatarUrl
                                        ? { uri: event.userData.avatarUrl }
                                        : require("@/assets/images/default-avatar.png")
                                }
                                style={styles.avatar}
                            />
                        </Pressable>

                        <View>
                            <Text style={styles.displayName}>{event.userData.authorDisplayName}</Text>
                            <Text style={styles.username}>@{event.userData.authorUsername}</Text>
                        </View>
                    </View>
                */}

                {/* EVENT IMAGE */}
                <View style={styles.imageBox}>
                    <Image
                        source={
                            event.imageUrl
                                ? { uri: event.imageUrl }
                                : require("@/assets/images/default-avatar.png")
                        }
                        style={styles.image}
                    />
                </View>

                {/* EVENT INFO */}
                <Text style={styles.title}>{event.title}</Text>
                <Pressable onPress={() => router.push(`/users/${event.userData.id}`)}>
                    <Text style={styles.host}>Hosted by @{event.userData.authorUsername}</Text>
                </Pressable>

                <Text style={styles.overview}>{event.overview}</Text>

                <Text style={styles.location}>{event.location}</Text>
                <Text style={styles.date}>{event.dateTime.toString()}</Text>

                {/* ATTENDING */}
                <Text style={styles.attending}>
                    👥 {event.attendingNo} / {event.attendingMaxNo}
                </Text>

                {/* BUTTONS */}
                <View style={styles.buttons}>
                    <Pressable
                        style={styles.rsvpBtn}
                        onPress={() => addRSVP(String(event.id))}
                    >
                        <Text style={styles.rsvpText}>RSVP</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 20,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    displayName: {
        fontWeight: "700",
        fontSize: 18,
        color: "white",
    },
    username: {
        color: "#B8BED0",
    },
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
    image: {
        width: "100%",
        height: "100%",
        resizeMode: "cover",
    },
    title: {
        fontSize: 26,
        fontWeight: "700",
        color: "white",
        marginTop: 16,
    },
    host: {
        color: "#B8BED0",
        marginBottom: 10,
    },
    location: {
        fontSize: 15,
        color: "white",
    },
    date: {
        fontSize: 15,
        color: "#B8BED0",
    },
    attending: {
        marginTop: 16,
        fontSize: 16,
        color: "#B8BED0",
        fontWeight: "600",
        textAlign: "center",
    },
    buttons: {
        flexDirection: "row",
        marginTop: 20,
        justifyContent: "space-between",
    },
    detailsBtn: {
        flex: 1,
        marginRight: 10,
        paddingVertical: 12,
        borderRadius: 30,
        backgroundColor: "#2E3347",
        alignItems: "center",
    },
    detailsText: {
        color: "white",
        fontWeight: "600",
    },
    rsvpBtn: {
        flex: 1,
        marginLeft: 10,
        paddingVertical: 12,
        borderRadius: 30,
        backgroundColor: "white",
        alignItems: "center",
    },
    rsvpText: {
        color: "#2E3347",
        fontWeight: "700",
    },
    backgroundContainer: {
        flex: 1,
        backgroundColor: "#2E3347",
    },
    overview: {
        fontSize: 18,
        color: "white",
        marginBottom: 15,
    },
});
