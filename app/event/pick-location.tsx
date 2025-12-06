import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Text, Alert, ActivityIndicator } from "react-native";
import MapView, { Marker, MapPressEvent } from "react-native-maps";
import { useRouter } from "expo-router";
import * as Location from "expo-location";

type PickedLocation = {
    latitude: number;
    longitude: number;
    address?: string;
    poi?: string; // new POI field
};

export default function PickLocationScreen() {
    const router = useRouter();
    const [selected, setSelected] = useState<PickedLocation | null>(null);
    const [loadingAddress, setLoadingAddress] = useState(false);

    // Request location permission on mount
    useEffect(() => {
        const requestPermission = async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert(
                    "Permission required",
                    "Enable location permissions to pick a location."
                );
            }
        };
        requestPermission();
    }, []);

    // Fetch POI / building name from OpenStreetMap Nominatim
    const fetchPOI = async (lat: number, lng: number) => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`
            );
            const data = await res.json();
            console.log("Nominatim response:", data);
            // Use 'name' if available, fallback to 'display_name'
            return data.name || data.display_name || "";
        } catch (err) {
            console.warn("Failed to fetch POI:", err);
            return "";
        }
    };

    const handleMapPress = async (e: MapPressEvent) => {
        const coords = e.nativeEvent.coordinate;
        setLoadingAddress(true);

        let address = "";
        let poi = "";

        try {
            // Reverse geocode for human-readable address
            const geocoded = await Location.reverseGeocodeAsync(coords);
            console.log("Reverse geocode:", geocoded);
            if (geocoded.length > 0) {
                const first = geocoded[0];
                address = `${first.name ?? ""} ${first.street ?? ""}, ${first.city ?? ""}, ${first.region ?? ""}, ${first.country ?? ""}`.trim();
            }
        } catch (err) {
            console.warn("Reverse geocode failed:", err);
            address = "Unknown location";
        }

        // Fetch POI / building/business name from OpenStreetMap
        poi = await fetchPOI(coords.latitude, coords.longitude);

        setSelected({
            latitude: coords.latitude,
            longitude: coords.longitude,
            address,
            poi,
        });
        setLoadingAddress(false);
    };

    const handleConfirm = () => {
        if (!selected) {
            Alert.alert("Pick a location first", "Tap on the map to choose a spot.");
            return;
        }

        router.replace({
            pathname: "/event/newEvent",
            params: {
                lat: selected.latitude.toString(),
                lng: selected.longitude.toString(),
                address: selected.address ?? "",
                poi: selected.poi ?? "",
            },
        });
    };

    return (
        <View style={{ flex: 1 }}>
            <MapView
                style={StyleSheet.absoluteFill}
                showsUserLocation
                onPress={handleMapPress}
            >
                {selected && <Marker coordinate={selected} />}
            </MapView>

            <TouchableOpacity
                onPress={handleConfirm}
                disabled={!selected || loadingAddress}
                style={[
                    styles.confirm,
                    { opacity: selected && !loadingAddress ? 1 : 0.5 },
                ]}
            >
                {loadingAddress ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text style={{ color: "white", fontWeight: "bold" }}>
                        {selected ? "Confirm Location" : "Tap Map First"}
                    </Text>
                )}
            </TouchableOpacity>

            {selected?.address && !loadingAddress && (
                <View style={styles.addressBox}>
                    <Text style={{ color: "#333" }}>{selected.address}</Text>
                    {selected.poi ? <Text style={{ color: "#555", fontWeight: "600" }}>POI: {selected.poi}</Text> : null}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    confirm: {
        position: "absolute",
        bottom: 40,
        alignSelf: "center",
        backgroundColor: "#3b82f6",
        padding: 14,
        borderRadius: 10,
    },
    addressBox: {
        position: "absolute",
        bottom: 100,
        left: 16,
        right: 16,
        backgroundColor: "white",
        padding: 12,
        borderRadius: 10,
        elevation: 3,
    },
});
