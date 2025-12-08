import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import {BASE_URL} from "@/app/lib/config";

export default function SignupScreen() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [name, setName] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [username, setUsername] = useState("");
    const [street, setStreet] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleResendVerification = async () => {
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
            } else {
                Alert.alert("Error", data.message || "Failed to resend verification email");
            }
        } catch (err) {
            console.error(err);
            Alert.alert("Error", "Network error. Failed to resend verification email.");
        }
    };

    const handleSignup = async () => {
        setError("");

        // Validation
        if (!email || !password || !name || !displayName || !username) {
            setError("Required fields: IP, email, password, name, display name, username");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`https://${BASE_URL}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    password,
                    name,
                    display_name: displayName,
                    username,
                    street: street || undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "Signup failed");
                setLoading(false);
                return;
            }


            Alert.alert(
                "Account Created!", 
                "Your account has been created successfully. A verification email has been sent to your email address. Please verify your email before logging in.",
                [
                    {
                        text: "OK",
                        onPress: () => router.replace("/login"),
                    },
                    {
                        text: "Didn't receive email?",
                        onPress: handleResendVerification,
                        style: "default",
                    },
                ]
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
                <Text style={styles.title}>Create Account</Text>

                <Text style={styles.notice}>
                    📧 A verification email will be sent to verify your identity
                </Text>

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
                    placeholder="Email *"
                    placeholderTextColor="#888"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Full Name * (e.g., John Doe)"
                    placeholderTextColor="#888"
                    value={name}
                    onChangeText={setName}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Display Name * (e.g., Johnny)"
                    placeholderTextColor="#888"
                    value={displayName}
                    onChangeText={setDisplayName}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Username * (e.g., johndoe)"
                    placeholderTextColor="#888"
                    autoCapitalize="none"
                    value={username}
                    onChangeText={setUsername}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Street (Optional)"
                    placeholderTextColor="#888"
                    value={street}
                    onChangeText={setStreet}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Password * (min 6 characters)"
                    placeholderTextColor="#888"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Confirm Password *"
                    placeholderTextColor="#888"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />

                <Pressable 
                    style={[styles.button, loading && styles.buttonDisabled]} 
                    onPress={handleSignup}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? "Creating Account..." : "Sign Up"}
                    </Text>
                </Pressable>

                <Pressable onPress={() => router.push("/login")} style={styles.linkContainer}>
                    <Text style={styles.linkText}>Already have an account? Log in</Text>
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
    notice: {
        color: "#4A90E2",
        fontSize: 13,
        marginBottom: 16,
        textAlign: "center",
        backgroundColor: "rgba(74, 144, 226, 0.1)",
        padding: 12,
        borderRadius: 8,
    },
});
