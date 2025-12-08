import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {BASE_URL} from "@/app/lib/config";

export default function ResendVerificationScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleResend = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        if (!email.includes('@')) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        setIsLoading(true);
        try {

            const res = await fetch(`https://${BASE_URL}/api/auth/resend-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            });

            const data = await res.json();

            if (data.success) {
                Alert.alert(
                    'Email Sent!',
                    'A new verification link has been sent to your email. Please check your inbox (and spam folder).',
                    [{ text: 'OK', onPress: () => router.back() }]
                );
            } else {
                Alert.alert('Error', data.message || 'Failed to resend verification email');
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Network error. Failed to resend verification email.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Resend Verification Email</Text>
            <Text style={styles.subtitle}>
                {"Enter your email address and we'll send you a new verification link."}
            </Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isLoading}
            />

            <Pressable
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleResend}
                disabled={isLoading}
            >
                <Text style={styles.buttonText}>
                    {isLoading ? 'Sending...' : 'Send Verification Email'}
                </Text>
            </Pressable>

            <Pressable onPress={() => router.back()} disabled={isLoading}>
                <Text style={styles.backLink}>Back to Login</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111',
        padding: 24,
        justifyContent: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#888',
        marginBottom: 32,
        textAlign: 'center',
        lineHeight: 24,
    },
    input: {
        backgroundColor: '#222',
        color: 'white',
        padding: 12,
        marginBottom: 16,
        borderRadius: 8,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#4A90E2',
        padding: 14,
        borderRadius: 8,
    },
    buttonDisabled: {
        backgroundColor: '#666',
    },
    buttonText: {
        textAlign: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    backLink: {
        color: '#4A90E2',
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
    },
});
