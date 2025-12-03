import { usePosts } from '@/app/data/demoPostData';
import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { createPost as apiCreatePost, fetchTags } from '../lib/api';

export default function CreatePostScreen() {
    const { createPost } = usePosts(); // <-- API-based create
    const [content, setContent] = useState("");
    const [availableTags, setAvailableTags] = useState<Array<{ tag_id: number; name: string; color?: string }>>([]);
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

    useEffect(() => {
        fetchTags()
            .then(tags => setAvailableTags(tags))
            .catch(err => console.warn('Failed to fetch tags', err));
    }, []);

    const handlePost = async () => {
        if (!content.trim()) {
            Alert.alert("Cannot post empty content!");
            return;
        }

        const payload = {
            content: content.trim(),
            post_type: 'general',
            priority: 'normal',
            tags: selectedTagIds,
        };

        try {
            // Try to create via backend API
            await apiCreatePost(payload);
            setContent("");
            setSelectedTagIds([]);
            Alert.alert('Post created!');
        } catch (apiErr) {
            console.warn('API create post failed, falling back to demo createPost', apiErr);
            try {
                // Fallback to demo/local createPost so UI still updates in demo mode
                await createPost(content, 'general');
                setContent('');
                setSelectedTagIds([]);
                Alert.alert('Post created (local)');
            } catch (err: any) {
                Alert.alert('Error', err.message || 'Failed to create post');
                console.log(err);
            }
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Create a New Post</Text>

            <TextInput
                value={content}
                onChangeText={setContent}
                style={styles.input}
                multiline
                placeholder="What's on your mind?"
            />

            {/* Tag selector */}
            <Text style={{ marginTop: 12, marginBottom: 8, fontWeight: '600' }}>Tags</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {availableTags.map(tag => {
                    const selected = selectedTagIds.includes(tag.tag_id);
                    return (
                        <TouchableOpacity
                            key={tag.tag_id}
                            onPress={() => setSelectedTagIds(prev => prev.includes(tag.tag_id) ? prev.filter(x => x !== tag.tag_id) : [...prev, tag.tag_id])}
                            style={{
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                borderRadius: 16,
                                marginRight: 8,
                                marginBottom: 8,
                                backgroundColor: selected ? '#333' : (tag.color || '#eee'),
                            }}
                        >
                            <Text style={{ color: selected ? '#fff' : '#000' }}>{tag.name}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <TouchableOpacity onPress={handlePost} style={styles.button}>
                <Text style={styles.buttonText}>Post</Text>
            </TouchableOpacity>
        </View>
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
    },
    button: {
        backgroundColor: "#1DA1F2",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
