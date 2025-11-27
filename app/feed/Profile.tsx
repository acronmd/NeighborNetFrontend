import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePosts } from '@/app/data/demoPostData';

type ApiUser = {
    user_id: number;
    email?: string;
    name: string;
    username: string;
    display_name: string;
    bio?: string | null;
    street?: string | null;
    verification_status: string;
    profile_visibility: string;
    is_moderator: boolean | number;
    created_at: string;
};

export default function Profile() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id?: string }>();  // id from route
    const viewingUserId = id ? Number(id) : null;

    const { posts } = usePosts();

    const [user, setUser] = useState<ApiUser | null>(null);
    const [loggedInUserId, setLoggedInUserId] = useState<number | null>(null);

    const [loading, setLoading] = useState(true);
    const [isEditing, setEditing] = useState(false);
    const [bio, setBio] = useState("");

    // Load logged-in user ID from /profile
    useEffect(() => {
        async function loadLoggedInUser() {
            const token = await SecureStore.getItemAsync('authToken');
            const ip = await SecureStore.getItemAsync('serverIp');

            const res = await fetch(`http://${ip}/api/users/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();
            if (data.success) setLoggedInUserId(data.user.user_id);
        }
        loadLoggedInUser();
    }, []);

    // Fetch user being viewed (self or other)
    useEffect(() => {
        async function fetchUser() {
            try {
                const token = await SecureStore.getItemAsync('authToken');
                const ip = await SecureStore.getItemAsync('serverIp');

                const url = viewingUserId
                    ? `http://${ip}/api/users/public/${viewingUserId}`
                    : `http://${ip}/api/users/profile`;

                const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const data = await res.json();

                if (data.success) {
                    setUser(data.user);
                    setBio(data.user.bio ?? '');
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchUser();
    }, [viewingUserId]);

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    if (!user) return <View style={styles.center}><Text>User not found.</Text></View>;

    const isSelf = loggedInUserId === user.user_id;

    const userPosts = Object.values(posts).filter(p => p.user_id === user.user_id);

    async function saveEdits() {
        try {
            const token = await SecureStore.getItemAsync("authToken");
            const ip = await SecureStore.getItemAsync("serverIp");

            const res = await fetch(`http://${ip}/api/users/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ bio })
            });

            const data = await res.json();

            if (data.success) {
                setUser(prev => prev ? { ...prev, bio } : prev);
                setEditing(false);
            } else {
                alert("Failed to update profile");
            }
        } catch {
            alert("Error saving profile");
        }
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.headerCenter}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarLetter}>{user.name[0]}</Text>
                </View>

                <Text style={styles.name}>{user.display_name}</Text>
                <Text style={styles.handle}>@{user.username}</Text>
                {user.street && <Text style={styles.location}>{user.street}</Text>}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Bio</Text>
                {isEditing ? (
                    <TextInput value={bio} onChangeText={setBio} style={styles.input} multiline />
                ) : (
                    <Text>{bio || "No bio."}</Text>
                )}
            </View>

            {/* Only show edit button if viewing your own profile */}
            {isSelf && (
                <View style={styles.section}>
                    {isEditing ? (
                        <TouchableOpacity onPress={saveEdits} style={styles.saveBtn}>
                            <Text style={styles.saveText}>Save</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={() => setEditing(true)} style={styles.editBtn}>
                            <Text style={styles.editText}>Edit Profile</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Posts</Text>
                {userPosts.length > 0 ? (
                    userPosts.map(p => (
                        <TouchableOpacity key={p.post_id} onPress={() => router.push(`/feed/${p.post_id}`)}>
                            <Text style={styles.postTitle}>
                                {p.content.length > 80 ? p.content.slice(0, 80) + '…' : p.content}
                            </Text>
                        </TouchableOpacity>
                    ))
                ) : (
                    <Text>No posts yet.</Text>
                )}
            </View>
        </ScrollView>
    );
}


const styles = StyleSheet.create({
    container: { flex: 1, padding: 10 },
    headerCenter: { alignItems: 'center', marginBottom: 20 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    avatarLetter: { fontSize: 32, fontWeight: 'bold' },
    name: { fontSize: 20, fontWeight: 'bold' },
    handle: { color: '#555' },
    location: { color: '#888', marginTop: 4 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 4, padding: 10, backgroundColor: '#fff' },
    editBtn: { backgroundColor: '#007bff', padding: 10, borderRadius: 4 },
    editText: { color: '#fff', textAlign: 'center' },
    saveBtn: { backgroundColor: '#28a745', padding: 10, borderRadius: 4 },
    saveText: { color: '#fff', textAlign: 'center' },
    postTitle: { color: '#007bff', marginBottom: 5 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
