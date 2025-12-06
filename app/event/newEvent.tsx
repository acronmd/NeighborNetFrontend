import { useEvents } from "../data/_demoEventData";
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Button, Platform, ScrollView, Text, TextInput } from 'react-native';
import { useLocalSearchParams } from "expo-router";


export default function NewEventPage() {
    const router = useRouter();
    const { createEvent } = useEvents();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [eventDate, setEventDate] = useState(new Date());
    const [maxAttendees, setMaxAttendees] = useState('');
    const [showIOSPicker, setShowIOSPicker] = useState(false);

    const { lat, lng, address, poi } = useLocalSearchParams();

    const parseParam = (param: string | string[] | undefined) => {
        if (!param) return null;
        return Array.isArray(param) ? param[0] : param;
    };

    const [locationLat, setLocationLat] = useState<number | null>(
        parseParam(lat) ? parseFloat(parseParam(lat)!) : null
    );

    const [locationLng, setLocationLng] = useState<number | null>(
        parseParam(lng) ? parseFloat(parseParam(lng)!) : null
    );

    const [location, setLocation] = useState<string>(parseParam(address) || '');

    const [locationPoi, setLocationPoi] = useState<string>(parseParam(poi) || '');

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
                mode: 'date',
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
                location_lat: locationLat,
                location_lng: locationLng,
                poi: locationPoi
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

            <Button
                title={
                    locationLat
                        ? `Selected: ${locationLat.toFixed(4)}, ${locationLng?.toFixed(4)}`
                        : "Pick Location on Map"
                }
                onPress={() => router.push("/event/pick-location")}
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
