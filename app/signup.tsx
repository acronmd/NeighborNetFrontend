// the sign up page. lets you create a regular user account, which is sent to the database. system can now check for this info when you try to login
import { Link, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

export default function SignupScreen() {
    const router = useRouter();
    const [form, setForm] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        name: "",
        username: "",
        display_name: ""
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [ip, setIp] = useState("");
    const [ipError, setIpError] = useState("");

    const validateField = (name: string, value: string) => {
        const newErrors = { ...errors };
        
        switch (name) {
            case 'email':
                if (!value) newErrors.email = 'Email is required';
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) 
                    newErrors.email = 'Invalid email format';
                else delete newErrors.email;
                break;
                
            case 'password':
                if (!value) newErrors.password = 'Password is required';
                else if (value.length < 8) 
                    newErrors.password = 'Must be at least 8 characters';
                else if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value))
                    newErrors.password = 'Must contain letter and number';
                else delete newErrors.password;
                break;
                
            case 'confirmPassword':
                if (value !== form.password) 
                    newErrors.confirmPassword = 'Passwords do not match';
                else delete newErrors.confirmPassword;
                break;
                
            case 'name':
                if (!value) newErrors.name = 'Name is required';
                else if (value.length < 2) 
                    newErrors.name = 'Must be at least 2 characters';
                else if (value.length > 100)
                    newErrors.name = 'Name is too long';
                else delete newErrors.name;
                break;
                
            case 'username':
                if (!value) newErrors.username = 'Username is required';
                else delete newErrors.username;
                break;
                
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (name: string, value: string) => {
        setForm(prev => {
            const newForm = { ...prev, [name]: value };
            // Auto-fills the display name from first part of name
            if (name === 'name' && !form.display_name) {
                newForm.display_name = value.split(' ')[0];
            }
            return newForm;
        });
        
        if (name !== 'confirmPassword') {
            validateField(name, value);
        }

        // Clears an IP error when typing in the IP field
        if (name === 'ip' && ipError) {
            setIpError('');
        }
    };

    const handleSubmit = async () => {
        // Validates the IP first.
        if (!ip) {
            setIpError('Backend IP is required');
            return;
        }

        // Validate all form fields
        const isFormValid = Object.entries(form).every(([key, value]) => {
            if (key === 'display_name') return true;
            return validateField(key, value);
        });
        
        if (!isFormValid) {
            Alert.alert('Error', 'Please fix the errors in the form');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`http://${ip}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: form.email,
                    password: form.password,
                    name: form.name,
                    username: form.username,
                    display_name: form.display_name || form.name.split(' ')[0]
                }),
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Signup failed');  }

            // Save token and IP, then redirects to feed
            await SecureStore.setItemAsync('authToken', data.token);
            await SecureStore.setItemAsync('serverIp', ip);
            router.replace('/(tabs)/feed');
            
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <FlatList
            data={[{}]}
            renderItem={() => (
                <View style={styles.container}>
                    <Text style={styles.title}>Create Account</Text>
                    
                    <Text style={styles.label}>Backend IP (e.g., 192.168.1.25:5050)</Text>
                    <TextInput
                        style={[styles.input, ipError ? styles.inputError : null]}
                        value={ip}
                        onChangeText={setIp}
                        placeholder="192.168.1.25:5050"
                        placeholderTextColor="#888"
                        autoCapitalize="none"
                        keyboardType="url"
                    />
                    {ipError ? <Text style={styles.errorText}>{ipError}</Text> : null}

                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={[styles.input, errors.email && styles.inputError]}
                        value={form.email}
                        onChangeText={(text) => handleChange('email', text)}
                        placeholder="your@email.com"
                        placeholderTextColor="#888"
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                    {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={[styles.input, errors.password && styles.inputError]}
                        value={form.password}
                        onChangeText={(text) => handleChange('password', text)}
                        placeholder="••••••••"
                        placeholderTextColor="#888"
                        secureTextEntry
                    />
                    {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                    <Text style={styles.label}>Confirm Password</Text>
                    <TextInput
                        style={[styles.input, errors.confirmPassword && styles.inputError]}
                        value={form.confirmPassword}
                        onChangeText={(text) => handleChange('confirmPassword', text)}
                        placeholder="••••••••"
                        placeholderTextColor="#888"
                        secureTextEntry
                    />
                    {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

                    <Text style={styles.label}>Full Name</Text>
                    <TextInput
                        style={[styles.input, errors.name && styles.inputError]}
                        value={form.name}
                        onChangeText={(text) => handleChange('name', text)}
                        placeholder="Julius Ceasaer"
                        placeholderTextColor="#888"
                    />
                    {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

                    <Text style={styles.label}>Username</Text>
                    <TextInput
                        style={[styles.input, errors.username && styles.inputError]}
                        value={form.username}
                        onChangeText={(text) => handleChange('username', text)}
                        placeholder="Juliusceasaer"
                        placeholderTextColor="#888"
                        autoCapitalize="none"
                    />
                    {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}

                    <Text style={styles.label}>Display Name (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        value={form.display_name}
                        onChangeText={(text) => handleChange('display_name', text)}
                        placeholder="Ceasaer"
                        placeholderTextColor="#888"
                    />

                  

                    <Pressable 
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Sign Up</Text>
                        )}
                    </Pressable>

                    <View style={styles.loginContainer}>
                        <Text style={styles.loginText}>Already have an account? </Text>
                        <Link href="/login" style={styles.loginLink}>
                            Log In
                        </Link>
                    </View>
                </View>
            )}
            contentContainerStyle={{ paddingBottom: 60 }}
            keyboardShouldPersistTaps="handled"
        />
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111",
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
    label: {
        fontSize: 14,
        color: "#888",
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: "#333",
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 16,
        color: "white",
        backgroundColor: "#1E1E1E",
    },
    inputError: {
        borderColor: "#FF3B30",
    },
    errorText: {
        color: "#FF3B30",
        fontSize: 12,
        marginTop: 4,
        marginBottom: 8,  },
    button: {
        backgroundColor: "#4A90E2",
        height: 50,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 24,
    },
    buttonDisabled: {
        opacity: 0.7, },
    buttonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
        alignItems: 'center',
    },
    loginText: {
        color: '#888',
        fontSize: 14,
    },
    loginLink: {
        color: '#4A90E2',
        fontWeight: '600',
        fontSize: 14,  },
});
