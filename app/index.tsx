import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { ActivityIndicator, View } from "react-native";

export default function Root() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = await SecureStore.getItemAsync("authToken");

                if (!token) {
                    router.replace("/login"); // go to login
                } else {
                    router.replace("/(tabs)/feed"); // go to main app
                }
            } catch (err) {
                console.error("SecureStore error:", err);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#4A90E2" />
            </View>
        );
    }

    return null;
}
