import type { CommentType } from '@/app/data/demoEventData';
import { FlatList, Text } from 'react-native';
import CommentItem from './CommentItem';

export default function CommentList({
  comments,
  getUserName,
  emptyText = 'No comments yet',
}: {
  comments?: CommentType[];
  getUserName?: (id: string) => string;
  emptyText?: string;
}) {
  if (!comments || comments.length === 0) {
    return <Text style={{ color: '#B8BED0', marginVertical: 6 }}>{emptyText}</Text>;
  }

  return (
    <FlatList
      data={comments}
      keyExtractor={(c) => String(c.id)}
      renderItem={({ item }) => <CommentItem comment={item} userName={getUserName?.(String(item.userData.id))} />}
      scrollEnabled={false}
    />
  );
}
