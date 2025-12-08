import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import {BASE_URL} from "@/app/lib/config"; // if using expo-router

export default function LoginScreen() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showResendOption, setShowResendOption] = useState(false);
    const [isResending, setIsResending] = useState(false);

    const handleLogin = async () => {
        setError("");
        setShowResendOption(false);

        try {
            const res = await fetch(`https://${BASE_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                const errorMessage = data.message || "Login failed";
                setError(errorMessage);
                
                // Check if error is due to unverified email
                if (errorMessage.toLowerCase().includes('verify your email')) {
                    setShowResendOption(true);
                }
                return;
            }

            // Save token and IP securely
            await SecureStore.setItemAsync("authToken", data.token);

            // Navigate to main app
            router.replace("/(tabs)/feed"); // adjust route to your home page
        } catch (err) {
            console.error(err);
            setError("Network error. Check IP or server status.");
        }
    };

    const handleResendVerification = async () => {
        if (!email) {
            Alert.alert("Error", "Please enter your email address");
            return;
        }

        setIsResending(true);
        try {
            const res = await fetch(`https://${BASE_URL}/api/auth/resend-verification`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (data.success) {
                Alert.alert(
                    "Email Sent!",
                    "A new verification link has been sent to your email. Please check your inbox (and spam folder).",
                    [{ text: "OK" }]
                );
                setShowResendOption(false);
                setError("");
            } else {
                Alert.alert("Error", data.message || "Failed to resend verification email");
            }
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Network error. Failed to resend verification email.");
        } finally {
            setIsResending(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Neighborhood Network Login</Text>

            {error ? <Text style={styles.error}>{error}</Text> : null}

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
                value={email}
                onChangeText={setEmail}
            />

            <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#888"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            <Pressable style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Log In</Text>
            </Pressable>

            {showResendOption && (
                <Pressable
                    style={[styles.resendButton, isResending && styles.resendButtonDisabled]}
                    onPress={handleResendVerification}
                    disabled={isResending}
                >
                    <Text style={styles.resendButtonText}>
                        {isResending ? "Sending..." : "📧 Resend Verification Email"}
                    </Text>
                </Pressable>
            )}

            <View style={styles.linksRow}>
                <Pressable onPress={() => router.push("/forgot-password" as any)}>
                    <Text style={styles.linkText}>Forgot Password?</Text>
                </Pressable>
                <Pressable onPress={() => router.push("/forgot-username" as any)}>
                    <Text style={styles.linkText}>Forgot Username?</Text>
                </Pressable>
            </View>

            <Pressable onPress={() => router.push("/resend-verification" as any)} style={styles.linkContainer}>
                <Text style={styles.linkText}>Resend Verification Email</Text>
            </Pressable>

            <Pressable onPress={() => router.push("/signup")} style={styles.linkContainer}>
                <Text style={styles.linkText}>{"Don't have an account? Sign up"}</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111",
        padding: 24,
        justifyContent: "center",
    },
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "white",
        marginBottom: 24,
        textAlign: "center",
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
        fontSize: 14,
    },
    linksRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        paddingHorizontal: 8,
    },
    resendButton: {
        backgroundColor: "#27AE60",
        padding: 14,
        borderRadius: 8,
        marginTop: 12,
    },
    resendButtonDisabled: {
        backgroundColor: "#666",
    },
    resendButtonText: {
        textAlign: "center",
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },
});
