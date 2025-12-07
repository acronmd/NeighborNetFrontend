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

    const {
        lat,
        lng,
        address,
        poi,
        title: paramTitle,
        description: paramDescription,
        maxAttendees: paramMaxAttendees,
        eventDate: paramEventDate,
    } = useLocalSearchParams();


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

    React.useEffect(() => {
        if (paramTitle !== undefined) {
            setTitle(Array.isArray(paramTitle) ? paramTitle[0] : paramTitle);
        }

        if (paramDescription !== undefined) {
            setDescription(Array.isArray(paramDescription) ? paramDescription[0] : paramDescription);
        }

        if (paramMaxAttendees !== undefined) {
            setMaxAttendees(Array.isArray(paramMaxAttendees) ? paramMaxAttendees[0] : paramMaxAttendees);
        }

        if (paramEventDate) {
            const parsed = new Date(Array.isArray(paramEventDate) ? paramEventDate[0] : paramEventDate);
            if (!isNaN(parsed.getTime())) {
                setEventDate(parsed);
            }
        }
    }, [paramTitle, paramDescription, paramMaxAttendees, paramEventDate]);


    // Format date to MySQL DATETIME in UTC
    const formatDateForMySQL = (date: Date) => {
        const pad = (n: number) => n.toString().padStart(2, '0');

        // Convert to UTC components
        const year = date.getUTCFullYear();
        const month = pad(date.getUTCMonth() + 1);
        const day = pad(date.getUTCDate());
        const hours = pad(date.getUTCHours());
        const minutes = pad(date.getUTCMinutes());
        const seconds = pad(date.getUTCSeconds());

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };



    const showDateTimePicker = () => {
        if (Platform.OS === 'android') {
            // Step 1: pick date
            DateTimePickerAndroid.open({
                value: eventDate,
                onChange: (event, selectedDate) => {
                    if (selectedDate) {
                        const currentDate = new Date(selectedDate);

                        // Step 2: pick time immediately after
                        DateTimePickerAndroid.open({
                            value: currentDate,
                            onChange: (event, selectedTime) => {
                                if (selectedTime) {
                                    // combine date and time
                                    const newDateTime = new Date(
                                        currentDate.getFullYear(),
                                        currentDate.getMonth(),
                                        currentDate.getDate(),
                                        selectedTime.getHours(),
                                        selectedTime.getMinutes(),
                                        selectedTime.getSeconds()
                                    );
                                    setEventDate(newDateTime);
                                }
                            },
                            mode: 'time',
                            is24Hour: false,
                        });
                    }
                },
                mode: 'date',
            });
        } else {
            setShowIOSPicker(true); // iOS already supports 'datetime'
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
            router.push('/feed');
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
                onPress={() =>
                    router.push({
                        pathname: "/event/pick-location",
                        params: {
                            title,
                            description,
                            maxAttendees,
                            eventDate: eventDate.toISOString()
                        }
                    })
                }
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
