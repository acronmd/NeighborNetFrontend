import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import {BASE_URL} from "@/app/lib/config";

export default function ForgotUsernameScreen() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRecoverUsername = async () => {
        setError("");

        setLoading(true);

        try {
            const res = await fetch(`https://${BASE_URL}/api/auth/forgot-username`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "Failed to recover username");
                setLoading(false);
                return;
            }

            Alert.alert(
                "Username Sent", 
                "Your username has been sent to your email address. Please check your inbox.",
                [{ text: "OK", onPress: () => router.replace("/login") }]
            );
        } catch (err) {
            console.error(err);
            setError("Network error. Check IP or server status.");
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Recover Username</Text>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Text style={styles.description}>
                    Enter your email address and we'll send you your username.
                </Text>

                {/*<TextInput*/}
                {/*    style={styles.input}*/}
                {/*    placeholder="Backend IP (e.g., 192.168.1.25:5050)"*/}
                {/*    placeholderTextColor="#888"*/}
                {/*    value={ip}*/}
                {/*    onChangeText={setIp}*/}
                {/*/>*/}

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#888"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                />

                <Pressable 
                    style={[styles.button, loading && styles.buttonDisabled]} 
                    onPress={handleRecoverUsername}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? "Sending..." : "Send Username"}
                    </Text>
                </Pressable>

                <Pressable onPress={() => router.back()} style={styles.linkContainer}>
                    <Text style={styles.linkText}>Back to Login</Text>
                </Pressable>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111",
    },
    content: {
        padding: 24,
        paddingTop: 60,
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "white",
        marginBottom: 16,
        textAlign: "center",
    },
    description: {
        color: "#ccc",
        fontSize: 14,
        marginBottom: 24,
        textAlign: "center",
        lineHeight: 20,
    },
    input: {
        backgroundColor: "#222",
        color: "white",
        padding: 12,
        marginBottom: 12,
        borderRadius: 8,
    },
    button: {
        backgroundColor: "#4A90E2",
        padding: 14,
        borderRadius: 8,
        marginTop: 12,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        textAlign: "center",
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },
    error: {
        color: "red",
        marginBottom: 12,
        textAlign: "center",
    },
    linkContainer: {
        marginTop: 20,
        alignItems: "center",
    },
    linkText: {
        color: "#4A90E2",
        fontSize: 16,
    },
});
