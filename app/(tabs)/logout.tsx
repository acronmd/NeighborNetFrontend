// /app/(tabs)/logout.tsx
import React, { useEffect } from 'react';
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { View, ActivityIndicator, StyleSheet } from "react-native";

export default function Logout() {
    const router = useRouter();

    useEffect(() => {
        const doLogout = async () => {
            try {
                await SecureStore.deleteItemAsync("authToken");
                await SecureStore.deleteItemAsync("serverIp"); // optional
            } catch (err) {
                console.error("Failed to clear token:", err);
            } finally {
                router.replace("/login"); // redirect to login
            }
        };

        doLogout();
    }, []);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#4A90E2" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center" },
});
