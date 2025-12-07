import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Image, Alert, Modal, FlatList } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePosts } from '../data/_demoPostData';
import { api } from "../lib/_api";
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useFocusEffect } from 'expo-router';
import { BASE_URL } from "../lib/config";

type ApiUser = {
    user_id: number;
    email?: string;
    name: string;
    username: string;
    display_name: string;
    bio?: string | null;
    street?: string | null;
    phone?: string | null;
    profile_image?: string | null;
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

    const { posts, refreshPosts } = usePosts();

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
    
    // Follow system
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [loadingFollow, setLoadingFollow] = useState(false);

    // Load logged-in user ID from /profile
    useEffect(() => {
        async function loadLoggedInUser() {
            const token = await SecureStore.getItemAsync('authToken');
            const ip = await SecureStore.getItemAsync('serverIp');

            const res = await fetch(`https://${BASE_URL}/api/users/profile`, {
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
                    ? `https://${BASE_URL}/api/users/public/${viewingUserId}`
                    : `https://${BASE_URL}/api/users/profile`;

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
                    
                    const rawImage = data.user.profile_image_url ?? null;
                    console.log(rawImage);
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

    // Fetch follow status and counts after user is loaded
    useEffect(() => {
        if (!user || !loggedInUserId) return;
        
        const isSelf = loggedInUserId === user.user_id;
        
        if (!isSelf && viewingUserId) {
            fetchFollowStatus();
        }
        fetchFollowCounts();
    }, [user, loggedInUserId, viewingUserId]);

    const fetchFollowStatus = async () => {
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const ip = await SecureStore.getItemAsync('serverIp');

            const res = await fetch(`https://${BASE_URL}/api/follows/is-following/${viewingUserId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();
            if (data.success) {
                setIsFollowing(data.is_following);
            }
        } catch (err) {
            console.error('Failed to fetch follow status:', err);
        }
    };

    const fetchFollowCounts = async () => {
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const ip = await SecureStore.getItemAsync('serverIp');

            const userId = viewingUserId || loggedInUserId;
            const res = await fetch(`https://${BASE_URL}/api/follows/counts/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();

            if (data.success) {
                setFollowersCount(data.followers);
                setFollowingCount(data.following);
            }
        } catch (err) {
            console.error('Failed to fetch follow counts:', err);
        }
    };

    const handleFollowToggle = async () => {
        if (!viewingUserId) return;
        
        setLoadingFollow(true);
        try {
            const token = await SecureStore.getItemAsync('authToken');
            const ip = await SecureStore.getItemAsync('serverIp');

            const endpoint = isFollowing ? 'unfollow' : 'follow';
            const res = await fetch(`https://${BASE_URL}/api/follows/${endpoint}/${viewingUserId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();
            if (data.success) {
                setIsFollowing(!isFollowing);
                setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
            } else {
                Alert.alert('Error', data.message || 'Failed to update follow status');
            }
        } catch (err) {
            console.error('Failed to toggle follow:', err);
            Alert.alert('Error', 'Failed to update follow status');
        } finally {
            setLoadingFollow(false);
        }
    };

    // Fetch badges for the viewed user
    const fetchBadges = async () => {
        setLoadingBadges(true);
        try {
            const token = await SecureStore.getItemAsync("authToken");
            const ip = await SecureStore.getItemAsync("serverIp");

            const url = viewingUserId
                ? `https://${BASE_URL}/api/badges/user/${viewingUserId}`
                : `https://${BASE_URL}/api/badges/my-badges`;

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

    const isSelf = user && loggedInUserId ? loggedInUserId === user.user_id : false;

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    if (!user) return <View style={styles.center}><Text>User not found.</Text></View>;

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

            const res = await fetch(`https://${BASE_URL}/api/users/profile`, {
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

    async function getEventFromPost(post_id: number ){
        const token = await SecureStore.getItemAsync('authToken');
        const ip = await SecureStore.getItemAsync('serverIp');

        const res = await fetch(`https://${BASE_URL}/api/events/by-post/${post_id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        if (data.success) {
            console.log("return data: " + data.event.event_id);
            return data.event.event_id;
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

            const res = await fetch(`https://${BASE_URL}/api/users/profile/image`, {
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
                    setUser({ ...user, profile_image: imageUrl } as ApiUser);
                }
                
                // Refresh posts feed so profile pictures update everywhere
                await refreshPosts();
                
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
                
                {/* Follow Stats */}
                <View style={styles.followStats}>
                    <TouchableOpacity style={styles.stat}>
                        <Text style={styles.statNumber}>{followersCount}</Text>
                        <Text style={styles.statLabel}>Followers</Text>
                    </TouchableOpacity>
                    <View style={styles.statDivider} />
                    <TouchableOpacity style={styles.stat}>
                        <Text style={styles.statNumber}>{followingCount}</Text>
                        <Text style={styles.statLabel}>Following</Text>
                    </TouchableOpacity>
                </View>

                {/* Follow Button for other users */}
                {!isSelf && (
                    <TouchableOpacity 
                        style={[
                            styles.followButton,
                            isFollowing && styles.followingButton
                        ]}
                        onPress={handleFollowToggle}
                        disabled={loadingFollow}
                    >
                        {loadingFollow ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <Text style={styles.followButtonText}>
                                {isFollowing ? '✓ Following' : '+ Follow'}
                            </Text>
                        )}
                    </TouchableOpacity>
                )}
                
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
                        <TouchableOpacity
                            key={p.post_id}
                            onPress={async () => {
                                if (p.post_type === "event") {
                                    const eventId = await getEventFromPost(p.post_id); // ✅ MUST await

                                    console.log("got data:", eventId); // ✅ will log 6 (number)

                                    if (eventId != null) {
                                        router.push(`/event/${eventId}`); // ✅ USE event_id, NOT post_id
                                    } else {
                                        Alert.alert("Error", "Event not found");
                                    }
                                } else {
                                    router.push(`/feed/${p.post_id}`);
                                }
                            }}
                        >
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
    container: {
        flex: 1,
        backgroundColor: Colors.light.background,
    },
    headerCenter: {
        alignItems: 'center',
        backgroundColor: Colors.light.backgroundCard,
        paddingTop: Spacing.xxxl,
        paddingBottom: Spacing.xxl,
        marginBottom: Spacing.lg,
        ...Shadows.sm,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: Spacing.md,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.light.borderLight,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: Colors.light.backgroundCard,
        ...Shadows.md,
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: Colors.light.backgroundCard,
    },
    avatarLetter: {
        fontSize: 40,
        fontWeight: '700',
        color: Colors.light.primary,
    },
    editImageBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: Colors.light.primary,
        borderRadius: BorderRadius.full,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: Colors.light.backgroundCard,
        ...Shadows.md,
    },
    editImageText: {
        fontSize: 16,
    },
    uploadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.xs,
    },
    name: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.light.text,
    },
    verifiedBadge: {
        fontSize: 20,
        color: Colors.light.primary,
        backgroundColor: Colors.light.borderLight,
        borderRadius: BorderRadius.full,
        width: 28,
        height: 28,
        textAlign: 'center',
        lineHeight: 28,
    },
    handle: {
        color: Colors.light.textSecondary,
        fontSize: 16,
        marginBottom: Spacing.md,
    },
    verificationStatus: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
        alignSelf: 'center',
    },
    verifiedStatus: {
        color: Colors.light.success,
        backgroundColor: '#d1fae5',
    },
    pendingStatus: {
        color: Colors.light.warning,
        backgroundColor: '#fef3c7',
    },
    location: {
        color: Colors.light.textMuted,
        marginTop: Spacing.xs,
        fontSize: 14,
    },
    followStats: {
        flexDirection: 'row',
        marginTop: Spacing.lg,
        marginBottom: Spacing.md,
        alignItems: 'center',
        backgroundColor: Colors.light.borderLight,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        borderRadius: BorderRadius.full,
    },
    stat: {
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.light.text,
    },
    statLabel: {
        fontSize: 13,
        color: Colors.light.textSecondary,
        marginTop: 2,
    },
    statDivider: {
        width: 1,
        height: 32,
        backgroundColor: Colors.light.border,
    },
    followButton: {
        backgroundColor: Colors.light.primary,
        paddingHorizontal: Spacing.xxl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.full,
        marginTop: Spacing.md,
        minWidth: 140,
        alignItems: 'center',
        ...Shadows.sm,
    },
    followingButton: {
        backgroundColor: Colors.light.textMuted,
    },
    followButtonText: {
        color: Colors.light.backgroundCard,
        fontWeight: '700',
        fontSize: 15,
    },
    section: {
        marginBottom: Spacing.lg,
        marginHorizontal: Spacing.lg,
        backgroundColor: Colors.light.backgroundCard,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        ...Shadows.sm,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: Spacing.md,
        color: Colors.light.text,
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: Spacing.md,
        paddingBottom: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.borderLight,
    },
    infoLabel: {
        fontWeight: '600',
        color: Colors.light.textSecondary,
        width: 120,
        fontSize: 14,
    },
    infoText: {
        flex: 1,
        color: Colors.light.text,
        fontSize: 14,
    },
    editContainer: {
        marginBottom: Spacing.lg,
        marginHorizontal: Spacing.lg,
        backgroundColor: Colors.light.backgroundCard,
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        ...Shadows.md,
    },
    editTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: Spacing.lg,
        textAlign: 'center',
        color: Colors.light.text,
    },
    editSection: {
        marginBottom: Spacing.xl,
    },
    editSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: Spacing.md,
        color: Colors.light.text,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.light.textSecondary,
        marginBottom: Spacing.xs,
        marginTop: Spacing.sm,
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.light.border,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        backgroundColor: Colors.light.background,
        fontSize: 15,
        color: Colors.light.text,
    },
    bioInput: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    inputHint: {
        fontSize: 12,
        color: Colors.light.warning,
        marginTop: Spacing.xs,
        fontStyle: 'italic',
    },
    editActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: Spacing.md,
        marginTop: Spacing.lg,
    },
    cancelBtn: {
        flex: 1,
        backgroundColor: Colors.light.textMuted,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    cancelText: {
        color: Colors.light.backgroundCard,
        textAlign: 'center',
        fontWeight: '600',
        fontSize: 15,
    },
    editBtn: {
        backgroundColor: Colors.light.primary,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    editText: {
        color: Colors.light.backgroundCard,
        textAlign: 'center',
        fontWeight: '600',
        fontSize: 15,
    },
    saveBtn: {
        flex: 1,
        backgroundColor: Colors.light.success,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    saveText: {
        color: Colors.light.backgroundCard,
        textAlign: 'center',
        fontWeight: '600',
        fontSize: 15,
    },
    postTitle: {
        color: Colors.light.primary,
        marginBottom: Spacing.sm,
        fontSize: 14,
        lineHeight: 20,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.light.background,
    },
    badgesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    badgeItem: {
        width: 100,
        alignItems: 'center',
        padding: Spacing.md,
        backgroundColor: Colors.light.borderLight,
        borderRadius: BorderRadius.lg,
        position: 'relative',
        ...Shadows.sm,
    },
    badgeIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
        ...Shadows.sm,
    },
    badgeIcon: {
        fontSize: 30,
    },
    badgeName: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        color: Colors.light.text,
    },
    badgeToggle: {
        position: 'absolute',
        top: Spacing.xs,
        right: Spacing.xs,
        padding: Spacing.xs,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.light.border,
    },
    badgeToggleActive: {
        backgroundColor: Colors.light.primary,
    },
    badgeToggleText: {
        fontSize: 12,
    },
    noBadges: {
        fontStyle: 'italic',
        color: Colors.light.textMuted,
        textAlign: 'center',
        paddingVertical: Spacing.lg,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: Colors.light.backgroundCard,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xxl,
        width: '85%',
        maxWidth: 400,
        alignItems: 'center',
        ...Shadows.lg,
    },
    modalIconContainer: {
        width: 90,
        height: 90,
        borderRadius: 45,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.lg,
        ...Shadows.md,
    },
    modalIcon: {
        fontSize: 44,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.light.text,
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    modalCategory: {
        fontSize: 13,
        color: Colors.light.textMuted,
        fontWeight: '600',
        marginBottom: Spacing.lg,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    modalDescription: {
        fontSize: 15,
        color: Colors.light.textSecondary,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        lineHeight: 22,
    },
    modalEarnedInfo: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
        padding: Spacing.lg,
        backgroundColor: Colors.light.borderLight,
        borderRadius: BorderRadius.md,
        width: '100%',
    },
    modalEarnedText: {
        fontSize: 14,
        color: Colors.light.success,
        fontWeight: '600',
        marginBottom: Spacing.sm,
    },
    modalPointsText: {
        fontSize: 16,
        color: Colors.light.warning,
        fontWeight: '700',
    },
    modalCloseButton: {
        backgroundColor: Colors.light.primary,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xxl,
        borderRadius: BorderRadius.full,
        marginTop: Spacing.sm,
        ...Shadows.sm,
    },
    modalCloseButtonText: {
        color: Colors.light.backgroundCard,
        fontSize: 15,
        fontWeight: '600',
    },
});
