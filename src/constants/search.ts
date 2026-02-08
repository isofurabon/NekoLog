export const SEARCHABLE_FIELDS = ['message', 'tag', 'level', 'pid', 'tid', 'timestamp'] as const;
export type SearchableField = typeof SEARCHABLE_FIELDS[number];
