import React, { useState } from 'react';
import { View, Text, TextInput, Button, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useEvents } from '@/app/data/demoEventData';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

export default function NewEventPage() {
    const router = useRouter();
    const { createEvent } = useEvents();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [eventDate, setEventDate] = useState(new Date());
    const [maxAttendees, setMaxAttendees] = useState('');
    const [showIOSPicker, setShowIOSPicker] = useState(false);

    // Format date to MySQL DATETIME format: YYYY-MM-DD HH:MM:SS
    const formatDateForMySQL = (date: Date) => {
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    const showDateTimePicker = () => {
        if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
                value: eventDate,
                onChange: (event, selectedDate) => {
                    if (selectedDate) setEventDate(selectedDate);
                },
                mode: 'datetime',
                is24Hour: true,
            });
        } else {
            setShowIOSPicker(true);
        }
    };

    const handleSubmit = async () => {
        if (!title || !eventDate) {
            Alert.alert('Validation', 'Title and date are required.');
            return;
        }
        try {
            await createEvent({
                title,
                description,
                location,
                event_date: formatDateForMySQL(eventDate), // correctly formatted
                max_attendees: maxAttendees ? parseInt(maxAttendees, 10) : undefined,
            });
            Alert.alert('Success', 'Event created successfully!');
            router.push('/event-feed');
        } catch (err) {
            console.error(err);
            Alert.alert('Error', 'Failed to create event');
        }
    };

    return (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text>Title *</Text>
            <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Event title"
                style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 12 }}
            />

            <Text>Description</Text>
            <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Event description"
                multiline
                style={{ height: 100, borderWidth: 1, padding: 8, marginVertical: 8 }}
            />

            <Text>Location</Text>
            <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="Location"
                style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 12 }}
            />

            <Text>Date & Time *</Text>
            <Button title={eventDate.toLocaleString()} onPress={showDateTimePicker} />

            {Platform.OS === 'ios' && showIOSPicker && (
                <DateTimePicker
                    value={eventDate}
                    mode="datetime"
                    display="default"
                    onChange={(e, selectedDate) => {
                        setShowIOSPicker(false);
                        if (selectedDate) setEventDate(selectedDate);
                    }}
                />
            )}

            <Text>Max Attendees</Text>
            <TextInput
                value={maxAttendees}
                onChangeText={setMaxAttendees}
                keyboardType="numeric"
                placeholder="Max attendees"
                style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 12 }}
            />

            <Button title="Create Event" onPress={handleSubmit} />
        </ScrollView>
    );
}
