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
    phone?: string | null;
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
    const { id } = useLocalSearchParams<{ id?: string }>();
    const viewingUserId = id ? Number(id) : null;

    const { posts } = usePosts();

    const [user, setUser] = useState<ApiUser | null>(null);
    const [loggedInUserId, setLoggedInUserId] = useState<number | null>(null);

    const [loading, setLoading] = useState(true);
    const [isEditing, setEditing] = useState(false);
    
    // Editable fields
    const [bio, setBio] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [username, setUsername] = useState("");
    const [name, setName] = useState("");
    const [street, setStreet] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [fixedProfileImage, setFixedProfileImage] = useState<string | null>(null);
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
                    // Initialize all editable fields
                    setBio(data.user.bio ?? '');
                    setDisplayName(data.user.display_name ?? '');
                    setUsername(data.user.username ?? '');
                    setName(data.user.name ?? '');
                    setStreet(data.user.street ?? '');
                    setEmail(data.user.email ?? '');
                    setPhone(data.user.phone ?? '');
                    
                    const rawImage = data.user.profile_image ?? null;
                    setProfileImage(rawImage);
                    
                    // Fix localhost URLs
                    if (rawImage && rawImage.includes('localhost') && ip) {
                        const fixed = rawImage.replace('localhost:5050', ip).replace('localhost', ip);
                        setFixedProfileImage(fixed);
                    } else {
                        setFixedProfileImage(rawImage);
                    }
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

    const startEditing = () => {
        if (user) {
            setBio(user.bio ?? '');
            setDisplayName(user.display_name ?? '');
            setUsername(user.username ?? '');
            setName(user.name ?? '');
            setStreet(user.street ?? '');
            setEmail(user.email ?? '');
            setPhone(user.phone ?? '');
        }
        setEditing(true);
    };

    const cancelEditing = () => {
        if (user) {
            setBio(user.bio ?? '');
            setDisplayName(user.display_name ?? '');
            setUsername(user.username ?? '');
            setName(user.name ?? '');
            setStreet(user.street ?? '');
            setEmail(user.email ?? '');
            setPhone(user.phone ?? '');
        }
        setEditing(false);
    };

    async function saveEdits() {
        if (!name.trim()) {
            Alert.alert("Error", "Name cannot be empty");
            return;
        }

        if (!displayName.trim()) {
            Alert.alert("Error", "Display name cannot be empty");
            return;
        }

        if (!username.trim()) {
            Alert.alert("Error", "Username cannot be empty");
            return;
        }

        if (username.length < 3) {
            Alert.alert("Error", "Username must be at least 3 characters");
            return;
        }

        if (email && !email.includes('@')) {
            Alert.alert("Error", "Please enter a valid email");
            return;
        }

        try {
            const token = await SecureStore.getItemAsync("authToken");
            const ip = await SecureStore.getItemAsync("serverIp");

            const updateData = {
                name: name.trim(),
                display_name: displayName.trim(),
                username: username.trim(),
                bio: bio.trim(),
                street: street.trim() || null,
                email: email.trim() || null,
                phone: phone.trim() || null,
            };

            const res = await fetch(`http://${ip}/api/users/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            const data = await res.json();

            if (data.success) {
                setUser(prev => prev ? { 
                    ...prev, 
                    name,
                    display_name: displayName,
                    username,
                    bio,
                    street,
                    email,
                    phone: phone || undefined
                } : prev);
                setEditing(false);
                Alert.alert("Success", "Profile updated successfully");
            } else {
                Alert.alert("Error", data.message || "Failed to update profile");
            }
        } catch (err) {
            console.error("Error saving profile:", err);
            Alert.alert("Error", "Failed to update profile");
        }
    }

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need camera roll permissions to upload a profile picture.');
            return;
        }

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

            console.log('Profile image upload response:', data);

            if (data.success) {
                let imageUrl = data.image_url || data.profile_image || data.url;
                
                console.log('Raw image URL from backend:', imageUrl);
                
                if (imageUrl && imageUrl.includes('localhost')) {
                    imageUrl = imageUrl.replace('localhost:5050', ip).replace('localhost', ip);
                    console.log('Fixed image URL:', imageUrl);
                }
                
                setProfileImage(imageUrl);
                setFixedProfileImage(imageUrl);
                
                if (user) {
                    setUser({ ...user, profile_image: imageUrl });
                }
                
                Alert.alert('Success', 'Profile picture updated!');
            } else {
                console.error('Profile image upload failed:', data);
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
                    {fixedProfileImage ? (
                        <Image 
                            source={{ uri: fixedProfileImage }} 
                            style={styles.avatarImage}
                            onError={(e) => {
                                console.error('Profile image load error:', e.nativeEvent.error);
                                console.log('Failed URL:', fixedProfileImage);
                                setFixedProfileImage(null);
                            }}
                            onLoad={() => console.log('Profile image loaded successfully:', fixedProfileImage)}
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

            {isEditing ? (
                <View style={styles.editContainer}>
                    <Text style={styles.editTitle}>Edit Profile</Text>
                    
                    <View style={styles.editSection}>
                        <Text style={styles.editSectionTitle}>Personal Information</Text>
                        
                        <Text style={styles.inputLabel}>Full Name *</Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            style={styles.input}
                            placeholder="John Doe"
                        />

                        <Text style={styles.inputLabel}>Display Name *</Text>
                        <TextInput
                            value={displayName}
                            onChangeText={setDisplayName}
                            style={styles.input}
                            placeholder="Johnny"
                        />

                        <Text style={styles.inputLabel}>Username * (shown as @{username})</Text>
                        <TextInput
                            value={username}
                            onChangeText={setUsername}
                            style={styles.input}
                            placeholder="johndoe"
                            autoCapitalize="none"
                        />
                        <Text style={styles.inputHint}>⚠️ Changing your username will change your @handle</Text>
                    </View>

                    <View style={styles.editSection}>
                        <Text style={styles.editSectionTitle}>Contact Information</Text>
                        
                        <Text style={styles.inputLabel}>Email</Text>
                        <TextInput
                            value={email}
                            onChangeText={setEmail}
                            style={styles.input}
                            placeholder="email@example.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <Text style={styles.inputLabel}>Phone Number</Text>
                        <TextInput
                            value={phone}
                            onChangeText={setPhone}
                            style={styles.input}
                            placeholder="(555) 123-4567"
                            keyboardType="phone-pad"
                        />

                        <Text style={styles.inputLabel}>Street Address</Text>
                        <TextInput
                            value={street}
                            onChangeText={setStreet}
                            style={styles.input}
                            placeholder="123 Main St"
                        />
                    </View>

                    <View style={styles.editSection}>
                        <Text style={styles.editSectionTitle}>About</Text>
                        
                        <Text style={styles.inputLabel}>Bio</Text>
                        <TextInput
                            value={bio}
                            onChangeText={setBio}
                            style={[styles.input, styles.bioInput]}
                            placeholder="Tell us about yourself..."
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    <View style={styles.editActions}>
                        <TouchableOpacity onPress={cancelEditing} style={styles.cancelBtn}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={saveEdits} style={styles.saveBtn}>
                            <Text style={styles.saveText}>Save Changes</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>About</Text>
                        <Text style={styles.infoText}>{bio || "No bio."}</Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Information</Text>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Full Name:</Text>
                            <Text style={styles.infoText}>{user.name}</Text>
                        </View>
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Display Name:</Text>
                            <Text style={styles.infoText}>{user.display_name}</Text>
                        </View>
                        {user.email && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Email:</Text>
                                <Text style={styles.infoText}>{user.email}</Text>
                            </View>
                        )}
                        {user.phone && (
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Phone:</Text>
                                <Text style={styles.infoText}>{user.phone}</Text>
                            </View>
                        )}
                    </View>

                    {isSelf && (
                        <View style={styles.section}>
                            <TouchableOpacity onPress={startEditing} style={styles.editBtn}>
                                <Text style={styles.editText}>Edit Profile</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </>
            )}

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
    infoRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    infoLabel: {
        fontWeight: '600',
        color: '#666',
        width: 120,
    },
    infoText: {
        flex: 1,
        color: '#333',
    },
    editContainer: {
        marginBottom: 20,
        backgroundColor: '#f9f9f9',
        padding: 16,
        borderRadius: 8,
    },
    editTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    editSection: {
        marginBottom: 20,
    },
    editSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        color: '#333',
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
        marginBottom: 4,
        marginTop: 8,
    },
    input: { 
        borderWidth: 1, 
        borderColor: '#ccc', 
        borderRadius: 4, 
        padding: 10, 
        backgroundColor: '#fff',
        fontSize: 14,
    },
    bioInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    inputHint: {
        fontSize: 12,
        color: '#F39C12',
        marginTop: 4,
        fontStyle: 'italic',
    },
    editActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginTop: 10,
    },
    cancelBtn: { 
        flex: 1,
        backgroundColor: '#6c757d', 
        padding: 12, 
        borderRadius: 4 
    },
    cancelText: { 
        color: '#fff', 
        textAlign: 'center',
        fontWeight: '600',
    },
    editBtn: { 
        backgroundColor: '#007bff', 
        padding: 12, 
        borderRadius: 4 
    },
    editText: { 
        color: '#fff', 
        textAlign: 'center',
        fontWeight: '600',
    },
    saveBtn: { 
        flex: 1,
        backgroundColor: '#28a745', 
        padding: 12, 
        borderRadius: 4 
    },
    saveText: { 
        color: '#fff', 
        textAlign: 'center',
        fontWeight: '600',
    },
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
