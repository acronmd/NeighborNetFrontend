import React, {useCallback, useEffect, useState} from "react";
import {View, Text, ActivityIndicator, StyleSheet, Alert, TouchableOpacity} from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";
import * as Location from "expo-location";
import { api } from "@/app/lib/_api";
import {useFocusEffect, useRouter} from "expo-router";
import {useRadius} from "@/app/lib/RadiusContext";

export interface Event {
    event_id: number;
    post_id?: number;
    title: string;
    description?: string;
    event_date?: string;
    location?: string;
    location_lat: number | string;
    location_lng: number | string;
    max_attendees?: number;
    current_attendees?: number;
    organizer_name?: string;
    going_count?: number;
    interested_count?: number;
}

export default function MapScreen() {
    const [events, setEvents] = useState<Event[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const { radiusMiles } = useRadius();
    const radiusKm = radiusMiles * 1.60934;

    const router = useRouter();

    // Request location permission
    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Location permission denied", "Cannot show map without location access");
                setLoading(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            setUserLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });
        })();
    }, []);

    // Fetch events near user
    useEffect(() => {
        if (!userLocation) return;

        const fetchEvents = async () => {
            try {
                setLoading(true);

                const params = new URLSearchParams({
                    latitude: userLocation.latitude.toString(),
                    longitude: userLocation.longitude.toString(),
                    radius: radiusKm.toString(),
                    status: "upcoming",
                    limit: "100",
                });

                const json = await api(`/api/events/nearby?${params.toString()}`);
                setEvents(json.events || []);
            } catch (err) {
                console.error("Error fetching events:", err);
                Alert.alert("Error fetching events");
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [userLocation, radiusMiles]);

    const fetchNearbyEvents = async () => {
        if (!userLocation) return;
        try {
            setLoading(true);
            const params = new URLSearchParams({
                latitude: userLocation.latitude.toString(),
                longitude: userLocation.longitude.toString(),
                radius: radiusKm.toString(),
                status: "upcoming",
                limit: "100",
            });

            const json = await api(`/api/events/nearby?${params.toString()}`);
            setEvents(json.events || []);
        } catch (err) {
            console.error("Error fetching events:", err);
            Alert.alert("Error fetching events");
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchNearbyEvents();
            setSelectedEvent(null); // reset overlay
        }, [userLocation, radiusMiles])
    );


    if (loading || !userLocation) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

    return (
        <View style={{ flex: 1 }}>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                    latitudeDelta: radiusKm / 111,
                    longitudeDelta: radiusKm / 111,
                }}
                onPress={() => setSelectedEvent(null)} // <-- deselect when tapping empty space
            >
                <Circle
                    center={userLocation}
                    radius={radiusKm * 1000}
                    strokeColor="rgba(0,0,255,0.3)"
                    fillColor="rgba(0,0,255,0.1)"
                />

                {events.map((event) => (
                    <Marker
                        key={event.event_id}
                        coordinate={{
                            latitude: Number(event.location_lat),
                            longitude: Number(event.location_lng),
                        }}
                        title={event.title}
                        description={event.description}
                        onPress={() => setSelectedEvent(event)}
                    />
                ))}
            </MapView>

            {/* Bottom overlay outside MapView */}
            {selectedEvent && (
                <View style={{ position: 'absolute', bottom: 20, left: 10, right: 10 }}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                            router.push(`/event/${selectedEvent.event_id}`);
                        }}
                        style={styles.eventOverlay}
                    >
                        <Text style={styles.title}>{selectedEvent.title}</Text>
                        {selectedEvent.description && <Text style={styles.text}>{selectedEvent.description}</Text>}
                        {selectedEvent.location && <Text style={styles.text}>📍 {selectedEvent.location}</Text>}
                        {selectedEvent.event_date && (
                            <Text style={styles.text}>🗓 {new Date(selectedEvent.event_date).toLocaleString()}</Text>
                        )}
                        {selectedEvent.going_count !== undefined && (
                            <Text style={styles.text}>👥 Going: {selectedEvent.current_attendees} / {selectedEvent.max_attendees}</Text>
                        )}
                        {selectedEvent.organizer_name && (
                            <Text style={styles.text}>👤 Organizer: {selectedEvent.organizer_name}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
    eventOverlay: {
        position: 'absolute',
        bottom: 20,
        left: 10,
        right: 10,
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 8,
        elevation: 5,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 4,
    },
    text: {
        marginBottom: 2,
        fontSize: 14,
    },
});
