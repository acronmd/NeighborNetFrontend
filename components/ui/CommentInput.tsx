import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function CommentInput({
  onSubmit,
  placeholder = 'Write a comment...',
  submitLabel = 'Send',
}: {
  onSubmit: (text: string) => void;
  placeholder?: string;
  submitLabel?: string;
}) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    const t = text.trim();
    if (!t) return;
    onSubmit(t);
    setText('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor="#9AA0C7"
        style={styles.input}
      />
      <Pressable onPress={handleSubmit} style={styles.button}>
        <Text style={styles.buttonText}>{submitLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  input: {
    flex: 1,
    backgroundColor: '#2E3347',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    color: 'white',
  },
  button: {
    backgroundColor: 'white',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  buttonText: { color: '#2E3347', fontWeight: '700' },
});
