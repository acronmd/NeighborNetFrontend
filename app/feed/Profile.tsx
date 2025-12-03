import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Image, Alert, Modal, FlatList } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePosts } from '@/app/data/demoPostData';
import { api } from '@/app/lib/api';

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

type Badge = {
    badge_id: number;
    name: string;
    description: string;
    icon: string;
    category: string;
    points_value: number;
    earned_at?: string;
    is_displayed: boolean;
    progress?: {
        current: number;
        target: number;
        percentage: number;
    };
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
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [badges, setBadges] = useState<Badge[]>([]);
    const [loadingBadges, setLoadingBadges] = useState(false);
    const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

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
                    setProfileImage(data.user.profile_image ?? null);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchUser();
        fetchBadges();
    }, [viewingUserId]);

    // Fetch badges for the viewed user
    const fetchBadges = async () => {
        setLoadingBadges(true);
        try {
            const token = await SecureStore.getItemAsync("authToken");
            const ip = await SecureStore.getItemAsync("serverIp");

            const url = viewingUserId
                ? `http://${ip}/api/badges/user/${viewingUserId}`
                : `http://${ip}/api/badges/my-badges`;

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();
            if (data.success) {
                // Only show displayed badges or all badges if viewing own profile
                const badgesToShow = isSelf ? data.badges : data.badges?.filter((b: Badge) => b.is_displayed);
                setBadges(badgesToShow || []);
            }
        } catch (err) {
            console.error("Failed to fetch badges:", err);
        } finally {
            setLoadingBadges(false);
        }
    };

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

    const pickImage = async () => {
        // Request permissions
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need camera roll permissions to upload a profile picture.');
            return;
        }

        // Launch image picker
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0]) {
            await uploadProfileImage(result.assets[0].uri);
        }
    };

    const uploadProfileImage = async (imageUri: string) => {
        setUploadingImage(true);
        try {
            const token = await SecureStore.getItemAsync("authToken");
            const ip = await SecureStore.getItemAsync("serverIp");

            // Create form data
            const formData = new FormData();
            const filename = imageUri.split('/').pop() || 'profile.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';

            formData.append('profile_image', {
                uri: imageUri,
                name: filename,
                type: type,
            } as any);

            const res = await fetch(`http://${ip}/api/users/profile/image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await res.json();

            if (data.success) {
                const imageUrl = data.image_url || data.profile_image || data.url;
                setProfileImage(imageUrl);
                
                // Refresh user data to get updated profile
                const token = await SecureStore.getItemAsync('authToken');
                const ip = await SecureStore.getItemAsync('serverIp');
                const userRes = await fetch(`http://${ip}/api/users/profile`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const userData = await userRes.json();
                if (userData.success && userData.user.profile_image) {
                    setProfileImage(userData.user.profile_image);
                }
                
                Alert.alert('Success', 'Profile picture updated!');
            } else {
                Alert.alert('Error', data.message || 'Failed to upload image');
            }
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to upload profile picture');
        } finally {
            setUploadingImage(false);
        }
    };

    const toggleBadgeDisplay = async (badgeId: number, currentDisplay: boolean) => {
        try {
            await api(`/badges/${badgeId}/display`, {
                method: 'PATCH',
                body: JSON.stringify({ is_displayed: !currentDisplay }),
            });
            
            setBadges(prev =>
                prev.map(b =>
                    b.badge_id === badgeId ? { ...b, is_displayed: !currentDisplay } : b
                )
            );
            
            Alert.alert(
                'Success',
                !currentDisplay ? 'Badge will be displayed on your profile' : 'Badge hidden from profile'
            );
        } catch (err) {
            Alert.alert('Error', 'Failed to update badge display');
        }
    };

    const getBadgeCategoryColor = (category: string): string => {
        switch (category) {
            case 'participation':
                return '#4A90E2';
            case 'contribution':
                return '#27AE60';
            case 'leadership':
                return '#F39C12';
            case 'special':
                return '#9B59B6';
            default:
                return '#95A5A6';
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.headerCenter}>
                <TouchableOpacity 
                    style={styles.avatarContainer} 
                    onPress={isSelf ? pickImage : undefined}
                    disabled={!isSelf || uploadingImage}
                >
                    {profileImage ? (
                        <Image 
                            source={{ uri: profileImage }} 
                            style={styles.avatarImage}
                            onError={(e) => {
                                console.error('Profile image load error:', e.nativeEvent.error);
                                console.log('Failed URL:', profileImage);
                                setProfileImage(null);
                            }}
                            onLoad={() => console.log('Profile image loaded successfully:', profileImage)}
                        />
                    ) : (
                        <View style={styles.avatar}>
                            <Text style={styles.avatarLetter}>{user.name[0]}</Text>
                        </View>
                    )}
                    {isSelf && (
                        <View style={styles.editImageBadge}>
                            <Text style={styles.editImageText}>📷</Text>
                        </View>
                    )}
                    {uploadingImage && (
                        <View style={styles.uploadingOverlay}>
                            <ActivityIndicator color="white" />
                        </View>
                    )}
                </TouchableOpacity>

                <View style={styles.nameContainer}>
                    <Text style={styles.name}>{user.name}</Text>
                    {user.verification_status === 'verified' && (
                        <Text style={styles.verifiedBadge}>✓</Text>
                    )}
                </View>
                <Text style={styles.handle}>@{user.username}</Text>
                {user.verification_status && (
                    <Text style={[
                        styles.verificationStatus,
                        user.verification_status === 'verified' && styles.verifiedStatus,
                        user.verification_status === 'pending' && styles.pendingStatus,
                    ]}>
                        {user.verification_status === 'verified' && '✓ Verified'}
                        {user.verification_status === 'pending' && '⏳ Verification Pending'}
                        {user.verification_status === 'unverified' && '○ Unverified'}
                    </Text>
                )}
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

            {/* Badges Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Badges ({badges.length})</Text>
                {loadingBadges ? (
                    <ActivityIndicator />
                ) : badges.length > 0 ? (
                    <View style={styles.badgesGrid}>
                        {badges.map((badge) => (
                            <TouchableOpacity
                                key={badge.badge_id}
                                style={styles.badgeItem}
                                onPress={() => setSelectedBadge(badge)}
                            >
                                <View style={[styles.badgeIconContainer, { backgroundColor: getBadgeCategoryColor(badge.category) }]}>
                                    <Text style={styles.badgeIcon}>{badge.icon}</Text>
                                </View>
                                <Text style={styles.badgeName} numberOfLines={1}>{badge.name}</Text>
                                {isSelf && (
                                    <TouchableOpacity
                                        style={[styles.badgeToggle, badge.is_displayed && styles.badgeToggleActive]}
                                        onPress={(e) => {
                                            e.stopPropagation();
                                            toggleBadgeDisplay(badge.badge_id, badge.is_displayed);
                                        }}
                                    >
                                        <Text style={styles.badgeToggleText}>
                                            {badge.is_displayed ? '👁️' : '👁️‍🗨️'}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : (
                    <Text style={styles.noBadges}>No badges earned yet.</Text>
                )}
            </View>

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

            {/* Badge Detail Modal */}
            <Modal
                visible={selectedBadge !== null}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedBadge(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {selectedBadge && (
                            <>
                                <View
                                    style={[
                                        styles.modalIconContainer,
                                        { backgroundColor: getBadgeCategoryColor(selectedBadge.category) }
                                    ]}
                                >
                                    <Text style={styles.modalIcon}>{selectedBadge.icon}</Text>
                                </View>
                                <Text style={styles.modalTitle}>{selectedBadge.name}</Text>
                                <Text style={styles.modalCategory}>
                                    {selectedBadge.category.toUpperCase()}
                                </Text>
                                <Text style={styles.modalDescription}>{selectedBadge.description}</Text>
                                
                                {selectedBadge.earned_at && (
                                    <View style={styles.modalEarnedInfo}>
                                        <Text style={styles.modalEarnedText}>
                                            ✓ Earned on {new Date(selectedBadge.earned_at).toLocaleDateString()}
                                        </Text>
                                        <Text style={styles.modalPointsText}>
                                            Awarded {selectedBadge.points_value} points
                                        </Text>
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={styles.modalCloseButton}
                                    onPress={() => setSelectedBadge(null)}
                                >
                                    <Text style={styles.modalCloseButtonText}>Close</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}


const styles = StyleSheet.create({
    container: { flex: 1, padding: 10 },
    headerCenter: { alignItems: 'center', marginBottom: 20 },
    avatarContainer: { position: 'relative', marginBottom: 10 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
    avatarImage: { width: 80, height: 80, borderRadius: 40 },
    avatarLetter: { fontSize: 32, fontWeight: 'bold' },
    editImageBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#4A90E2',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    editImageText: { fontSize: 14 },
    uploadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    name: { fontSize: 20, fontWeight: 'bold' },
    verifiedBadge: {
        fontSize: 18,
        color: '#1DA1F2',
        backgroundColor: '#E8F5FD',
        borderRadius: 12,
        width: 24,
        height: 24,
        textAlign: 'center',
        lineHeight: 24,
    },
    handle: { color: '#555' },
    verificationStatus: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'center',
    },
    verifiedStatus: {
        color: '#27AE60',
        backgroundColor: '#E8F8F0',
    },
    pendingStatus: {
        color: '#F39C12',
        backgroundColor: '#FEF5E7',
    },
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
    badgesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    badgeItem: {
        width: 100,
        alignItems: 'center',
        padding: 8,
        backgroundColor: '#f5f8fa',
        borderRadius: 12,
        position: 'relative',
    },
    badgeIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    badgeIcon: {
        fontSize: 28,
    },
    badgeName: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        color: '#14171a',
    },
    badgeToggle: {
        position: 'absolute',
        top: 4,
        right: 4,
        padding: 4,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
    },
    badgeToggleActive: {
        backgroundColor: '#4A90E2',
    },
    badgeToggleText: {
        fontSize: 12,
    },
    noBadges: {
        fontStyle: 'italic',
        color: '#657786',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        width: '85%',
        maxWidth: 400,
        alignItems: 'center',
    },
    modalIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalIcon: {
        fontSize: 40,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#14171a',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalCategory: {
        fontSize: 12,
        color: '#657786',
        fontWeight: '600',
        marginBottom: 16,
    },
    modalDescription: {
        fontSize: 14,
        color: '#657786',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    modalEarnedInfo: {
        alignItems: 'center',
        marginBottom: 20,
    },
    modalEarnedText: {
        fontSize: 13,
        color: '#27AE60',
        fontWeight: '600',
        marginBottom: 8,
    },
    modalPointsText: {
        fontSize: 14,
        color: '#F39C12',
        fontWeight: 'bold',
    },
    modalCloseButton: {
        backgroundColor: '#4A90E2',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginTop: 8,
    },
    modalCloseButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
});
