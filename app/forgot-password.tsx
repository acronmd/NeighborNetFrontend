import React, { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import {BASE_URL} from "@/app/lib/config";

export default function ForgotPasswordScreen() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [step, setStep] = useState<'request' | 'verify'>('request');
    const [verificationCode, setVerificationCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRequestReset = async () => {
        setError("");

        setLoading(true);

        try {
            const res = await fetch(`https://${BASE_URL}/api/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "Failed to send reset code");
                setLoading(false);
                return;
            }

            Alert.alert(
                "Code Sent", 
                "A verification code has been sent to your email. Please check your inbox.",
                [{ text: "OK", onPress: () => setStep('verify') }]
            );
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError("Network error. Check IP or server status.");
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        setError("");

        if (!verificationCode || !newPassword || !confirmPassword) {
            setError("All fields are required");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(`https://${BASE_URL}/api/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    code: verificationCode,
                    new_password: newPassword,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.message || "Failed to reset password");
                setLoading(false);
                return;
            }

            Alert.alert(
                "Success", 
                "Your password has been reset successfully. Please log in with your new password.",
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
                <Text style={styles.title}>Reset Password</Text>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                {step === 'request' ? (
                    <>
                        <Text style={styles.description}>
                            Enter your email address and we'll send you a verification code to reset your password.
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
                            onPress={handleRequestReset}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>
                                {loading ? "Sending..." : "Send Reset Code"}
                            </Text>
                        </Pressable>
                    </>
                ) : (
                    <>
                        <Text style={styles.description}>
                            Enter the verification code sent to {email} and your new password.
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Verification Code"
                            placeholderTextColor="#888"
                            value={verificationCode}
                            onChangeText={setVerificationCode}
                            keyboardType="number-pad"
                            maxLength={6}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="New Password (min 6 characters)"
                            placeholderTextColor="#888"
                            secureTextEntry
                            value={newPassword}
                            onChangeText={setNewPassword}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Confirm New Password"
                            placeholderTextColor="#888"
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />

                        <Pressable 
                            style={[styles.button, loading && styles.buttonDisabled]} 
                            onPress={handleResetPassword}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>
                                {loading ? "Resetting..." : "Reset Password"}
                            </Text>
                        </Pressable>

                        <Pressable 
                            onPress={() => setStep('request')} 
                            style={styles.backButton}
                        >
                            <Text style={styles.backButtonText}>Resend Code</Text>
                        </Pressable>
                    </>
                )}

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
    backButton: {
        marginTop: 16,
        alignItems: "center",
    },
    backButtonText: {
        color: "#888",
        fontSize: 14,
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
