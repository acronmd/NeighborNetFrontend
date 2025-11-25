import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { usePosts } from '@/app/data/demoPostData';
import { useRouter } from 'expo-router';

type ApiUser = {
    user_id: number;
    email: string;
    name: string;
    bio?: string | null;
    street?: string | null;
    verification_status: string;
    profile_visibility: string;
    is_moderator: boolean | number;
    created_at: string;
};

export default function Profile() {
    const router = useRouter();
    const { posts } = usePosts();

    const [user, setUser] = useState<ApiUser | null>(null);
    const [loading, setLoading] = useState(true);

    const [isEditing, setEditing] = useState(false);
    const [bio, setBio] = useState('');

    // Fetch current user
    useEffect(() => {
        async function fetchUser() {
            try {
                const token = await SecureStore.getItemAsync('authToken');
                const ip = await SecureStore.getItemAsync('serverIp');
                const res = await fetch(`http://${ip}/api/users/profile`, {
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
    }, []);

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    if (!user) return <View style={styles.center}><Text>User not found.</Text></View>;

    const userPosts = Object.values(posts).filter(p => p.user_id === user.user_id);

    const currentUserId = user.user_id; // same as fetched user
    const isSelf = true;

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
                body: JSON.stringify({
                    bio,          // only sending bio since it's the only editable state
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                // Update local state to reflect saved edits
                setUser((prev) => prev ? { ...prev, bio } : prev);
                setEditing(false);
            } else {
                console.error('Failed to update profile', data);
                alert('Failed to update profile');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred while updating your profile');
        }
    }


    return (
        <ScrollView style={styles.container}>
            <View style={styles.headerCenter}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarLetter}>{user.name[0]}</Text>
                </View>
                <Text style={styles.name}>{user.name}</Text>
                <Text style={styles.handle}>@user{user.user_id}</Text>
                {user.street && <Text style={styles.location}>{user.street}</Text>}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Bio</Text>
                {isEditing ? (
                    <TextInput value={bio} onChangeText={setBio} style={styles.input} multiline />
                ) : (
                    <Text>{bio}</Text>
                )}
            </View>

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
                            <Text style={styles.postTitle}>{p.content.length > 80 ? p.content.slice(0, 80) + '…' : p.content}</Text>
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
