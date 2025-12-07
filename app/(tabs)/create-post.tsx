import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ScrollView, ActivityIndicator } from 'react-native';
import { usePosts } from '@/app/data/_demoPostData';
import { useState } from 'react';
import React from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import {router} from "expo-router";
import {BASE_URL} from "@/app/lib/config";
import * as Location from 'expo-location';

// Preset tags users can quickly select
const PRESET_TAGS = [
    'help', 'urgent', 'question', 'announcement', 'event',
    'lost-found', 'safety', 'recommendations', 'community',
    'maintenance', 'parking', 'noise', 'pets', 'garden'
];

export default function CreatePostScreen() {
    const { createPost, refreshPosts } = usePosts();
    const [content, setContent] = useState("");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [customTag, setCustomTag] = useState("");
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need camera roll permissions to upload images.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0]) {
            setSelectedImage(result.assets[0].uri);
        }
    };

    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            if (selectedTags.length < 5) {
                setSelectedTags([...selectedTags, tag]);
            } else {
                Alert.alert("Maximum 5 tags allowed");
            }
        }
    };

    const addCustomTag = () => {
        const trimmed = customTag.trim().toLowerCase();
        if (!trimmed) return;
        
        if (trimmed.length > 20) {
            Alert.alert("Tag too long", "Tags must be 20 characters or less");
            return;
        }

        if (selectedTags.includes(trimmed)) {
            Alert.alert("Tag already added");
            return;
        }

        if (selectedTags.length >= 5) {
            Alert.alert("Maximum 5 tags allowed");
            return;
        }

        setSelectedTags([...selectedTags, trimmed]);
        setCustomTag("");
    };

    const removeTag = (tag: string) => {
        setSelectedTags(selectedTags.filter(t => t !== tag));
    };

    const getUserLocation = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need location access to attach your location to the post.');
            return null;
        }

        const location = await Location.getCurrentPositionAsync({});
        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        };
    };


    const handlePost = async () => {
        if (!content.trim()) {
            Alert.alert("Cannot post empty content!");
            return;
        }

        setUploading(true);

        try {
            const token = await SecureStore.getItemAsync("authToken");

            // Get user's location
            const userLocation = await getUserLocation();

            if (!userLocation) {
                setUploading(false);
                return;
            }

            // Create FormData for multipart upload
            const formData = new FormData();
            formData.append('content', content);
            formData.append('post_type', 'general');

            if (selectedTags.length > 0) {
                formData.append('tags', JSON.stringify(selectedTags));
            }

            if (selectedImage) {
                const filename = selectedImage.split('/').pop() || 'post_image.jpg';
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';

                formData.append('post_image', {
                    uri: selectedImage,
                    name: filename,
                    type: type,
                } as any);
            }

            // Append location
            formData.append('location_lat', userLocation.latitude.toString());
            formData.append('location_lng', userLocation.longitude.toString());

            const res = await fetch(`https://${BASE_URL}/api/posts`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setContent("");
                setSelectedTags([]);
                setCustomTag("");
                setSelectedImage(null);
                await refreshPosts();
                Alert.alert("Success", "Post created!");
                router.push('/feed');
            } else {
                Alert.alert("Error", data.message || "Failed to create post");
            }
        } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to create post");
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Create a New Post</Text>

            <TextInput
                value={content}
                onChangeText={setContent}
                style={styles.input}
                multiline
                placeholder="What's on your mind?"
                editable={!uploading}
            />

            {/* Preset Tags */}
            <Text style={styles.sectionLabel}>Quick Tags (select up to 5):</Text>
            <View style={styles.presetTagsContainer}>
                {PRESET_TAGS.map((tag) => (
                    <TouchableOpacity
                        key={tag}
                        style={[
                            styles.presetTag,
                            selectedTags.includes(tag) && styles.presetTagSelected
                        ]}
                        onPress={() => toggleTag(tag)}
                        disabled={uploading}
                    >
                        <Text style={[
                            styles.presetTagText,
                            selectedTags.includes(tag) && styles.presetTagTextSelected
                        ]}>
                            {tag}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Custom Tag Input */}
            <Text style={styles.sectionLabel}>Or add custom tag:</Text>
            <View style={styles.customTagContainer}>
                <TextInput
                    value={customTag}
                    onChangeText={setCustomTag}
                    style={styles.customTagInput}
                    placeholder="Enter custom tag..."
                    editable={!uploading}
                    maxLength={20}
                />
                <TouchableOpacity
                    style={styles.addTagButton}
                    onPress={addCustomTag}
                    disabled={uploading || !customTag.trim()}
                >
                    <Text style={styles.addTagButtonText}>+</Text>
                </TouchableOpacity>
            </View>

            {/* Selected Tags Display */}
            {selectedTags.length > 0 && (
                <View style={styles.selectedTagsContainer}>
                    <Text style={styles.selectedTagsLabel}>Selected Tags:</Text>
                    <View style={styles.selectedTagsList}>
                        {selectedTags.map((tag) => (
                            <View key={tag} style={styles.selectedTag}>
                                <Text style={styles.selectedTagText}>#{tag}</Text>
                                <TouchableOpacity
                                    onPress={() => removeTag(tag)}
                                    disabled={uploading}
                                >
                                    <Text style={styles.removeTagText}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {selectedImage && (
                <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
                    <TouchableOpacity 
                        style={styles.removeImageButton}
                        onPress={() => setSelectedImage(null)}
                        disabled={uploading}
                    >
                        <Text style={styles.removeImageText}>✕</Text>
                    </TouchableOpacity>
                </View>
            )}

            <TouchableOpacity 
                onPress={pickImage} 
                style={styles.imageButton}
                disabled={uploading}
            >
                <Text style={styles.imageButtonText}>
                    📷 {selectedImage ? 'Change Image' : 'Add Image'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity 
                onPress={handlePost} 
                style={[styles.button, uploading && styles.buttonDisabled]}
                disabled={uploading}
            >
                {uploading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Post</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    title: { fontWeight: "bold", fontSize: 18, marginBottom: 12 },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        minHeight: 80,
        textAlignVertical: "top",
        backgroundColor: '#fff',
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginTop: 8,
        marginBottom: 8,
    },
    presetTagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    presetTag: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: '#f0f0f0',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    presetTagSelected: {
        backgroundColor: '#E8F5FD',
        borderColor: '#1DA1F2',
    },
    presetTagText: {
        fontSize: 12,
        color: '#666',
        fontWeight: '500',
    },
    presetTagTextSelected: {
        color: '#1DA1F2',
        fontWeight: '600',
    },
    customTagContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    customTagInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fff',
    },
    addTagButton: {
        backgroundColor: '#1DA1F2',
        width: 45,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    addTagButtonText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    selectedTagsContainer: {
        marginBottom: 12,
    },
    selectedTagsLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        marginBottom: 6,
    },
    selectedTagsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    selectedTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5FD',
        paddingLeft: 12,
        paddingRight: 8,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#1DA1F2',
        gap: 6,
    },
    selectedTagText: {
        color: '#1DA1F2',
        fontSize: 12,
        fontWeight: '600',
    },
    removeTagText: {
        color: '#1DA1F2',
        fontSize: 16,
        fontWeight: 'bold',
    },
    imagePreviewContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 8,
    },
    removeImageButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 15,
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeImageText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    imageButton: {
        backgroundColor: "#95a5a6",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        marginBottom: 12,
    },
    imageButtonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 14,
    },
    button: {
        backgroundColor: "#1DA1F2",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: { 
        color: "#fff", 
        fontWeight: "bold", 
        fontSize: 16 
    },
});
