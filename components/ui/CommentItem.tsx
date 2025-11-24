import type { CommentType } from '@/app/data/demoEventData';
import { StyleSheet, Text, View } from 'react-native';

export default function CommentItem({ comment, userName }: { comment: CommentType; userName?: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.meta}>
        <Text style={styles.user}>{userName ?? comment.userData.authorUsername}</Text>
        <Text style={styles.time}>{new Date().toLocaleString()}</Text>
      </View>
      <Text style={styles.text}>{comment.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#2E3347' },
  meta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  user: { color: 'white', fontWeight: '600' },
  time: { color: '#B8BED0', fontSize: 12 },
  text: { color: '#DDE1F0' },
});
