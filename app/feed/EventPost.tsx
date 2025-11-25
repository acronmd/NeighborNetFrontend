


import { EventPostType, useEvents } from "@/app/data/demoEventData";
import { UserType } from "@/app/data/demoUserData";
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function EventPost({
                                      id,
                                      userData,
                                      title,
                                      overview,
                                      location,
                                      dateTime,
                                      attendingNo,
                                      attendingMaxNo,
                                      imageUrl,
                                      comments,
                                  }: EventPostType) {
    const router = useRouter();
    const { addRSVP, addComment } = useEvents();
    const [replyText, setReplyText] = useState('');

    const handleReply = () => {
        if (!replyText.trim()) return;
        // create a minimal comment object matching demoPostData.CommentType
        addComment(String(id), {
            id: (comments?.length ?? 0),
            userData: {
                id: 0,
                authorDisplayName: 'You',
                authorUsername: 'you',
            } as UserType,
            text: replyText.trim(),
        });
        setReplyText('');
    };

    return (
        <View style={styles.card}>
            {/* Image / Icon */}
            <View className="items-center justify-center">
                <View style={styles.imageBox}>
                    <Image
                        source={imageUrl ? { uri: imageUrl } : require('@/assets/images/default-avatar.png')}
                        style={styles.image}
                    />
                </View>

                <Text style={styles.attendingText}>
                    👥 {attendingNo} / {attendingMaxNo}
                </Text>
            </View>

            {/* Right Side Text */}
            <View style={styles.rightContent}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.host}>Hosted by @{userData.authorUsername}</Text>

                <Text style={styles.location}>{location}</Text>
                <Text style={styles.date}>{dateTime.toLocaleDateString()}</Text>

                {/* Buttons */}
                <View style={styles.buttons}>
                    <Pressable
                        style={styles.detailsBtn}
                        onPress={() => router.push(`/event/${id}`)}
                    >
                        <Text style={styles.detailsText}>Details</Text>
                    </Pressable>

                    <Pressable
                        style={styles.rsvpBtn}
                        onPress={() => addRSVP(String(id))}
                    >
                        <Text style={styles.rsvpText}>RSVP</Text>
                    </Pressable>
                </View>

                {/* Comment action + input (based on Post.tsx) */}
                <View style={{ marginTop: 8 }}>
                    <Pressable style={styles.actionButton} onPress={handleReply}>
                        <Text style={styles.actionText}>💬 {comments?.length || 0} Comment{(comments?.length ?? 0) === 1 ? '' : 's'}</Text>
                    </Pressable>

                    <View style={{ flexDirection: 'row', marginTop: 8 }}>
                        <TextInput
                            value={replyText}
                            onChangeText={setReplyText}
                            placeholder="Write a reply..."
                            placeholderTextColor="#9AA0C7"
                            style={{
                                flex: 1,
                                borderWidth: 1,
                                borderColor: '#ccc',
                                borderRadius: 8,
                                paddingHorizontal: 8,
                                paddingVertical: 6,
                                color: 'white',
                                backgroundColor: '#2E3347'
                            }}
                        />
                        <Pressable onPress={handleReply} style={{ marginLeft: 8, justifyContent: 'center', paddingHorizontal: 8 }}>
                            <Text style={{ color: '#1DA1F2', fontWeight: '600' }}>Send</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: '#3C4159',      // dark slate card like screenshot
        padding: 16,
        borderRadius: 24,
        marginVertical: 10,
        marginHorizontal: 12,
    },
    imageBox: {
        width: 110,
        height: 110,
        borderRadius: 12,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    image: {
        width: 60,
        height: 60,
        resizeMode: 'contain',
    },
    rightContent: {
        flex: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: 'white',
    },
    host: {
        marginTop: 2,
        color: '#B8BED0',
        fontSize: 14,
    },
    location: {
        marginTop: 12,
        color: 'white',
        fontSize: 15,
    },
    date: {
        color: '#B8BED0',
        fontSize: 13,
        marginTop: 2,
    },
    buttons: {
        flexDirection: 'row',
        marginTop: 16,
        alignItems: 'center',
    },
    detailsBtn: {
        paddingVertical: 8,
        paddingHorizontal: 22,
        borderRadius: 24,
        backgroundColor: '#2E3347',
        marginRight: 12,
    },
    detailsText: {
        color: 'white',
        fontWeight: '600',
    },
    rsvpBtn: {
        paddingVertical: 8,
        paddingHorizontal: 22,
        borderRadius: 24,
        backgroundColor: 'white',
    },
    rsvpText: {
        color: '#2E3347',
        fontWeight: '700',
    },
    attendingText: {
        marginTop: 8,         // space under the image
        paddingVertical: 4,   // small padding for breathing room
        paddingHorizontal: 8,
        color: '#B8BED0',     // light gray text (same as screenshot)
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
});


