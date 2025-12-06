import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet, Alert } from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";
import * as Location from "expo-location";
import { api } from "@/app/lib/_api";

export interface Event {
    event_id: number;
    title: string;
    description?: string;
    location_lat: number;
    location_lng: number;
    going_count: number;
    interested_count: number;
}

export default function MapScreen() {
    const [events, setEvents] = useState<Event[]>([]);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const radiusKm = 10;

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

    useEffect(() => {
        if (!userLocation) return;

        const fetchEvents = async () => {
            try {
                setLoading(true);

                // Build query params safely
                const params = new URLSearchParams({
                    latitude: userLocation.latitude.toString(),
                    longitude: userLocation.longitude.toString(),
                    radius: radiusKm.toString(),
                    status: "upcoming", // optional, default on backend
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
    }, [userLocation]);

    if (loading || !userLocation) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={{
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                    latitudeDelta: radiusKm / 111,
                    longitudeDelta: radiusKm / 111,
                }}
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
                            longitude: Number(event.location_lng)
                        }}
                        title={event.title}
                        description={event.description}
                    />
                ))}
            </MapView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },
});
