import { atom } from 'jotai';
import type { LogEntry } from '@/types';
import { type SearchableField } from '@/constants/search.ts';

// Raw Logs
export const logsAtom = atom<LogEntry[]>([]);

// Filter Text
export const filterTextAtom = atom<string>('');

// Auto-scroll preference
export const autoScrollAtom = atom<boolean>(true);

// Recording state
export const isRecordingAtom = atom<boolean>(false);

// Included Search Fields (fields to search in)
export const includedFieldsAtom = atom<SearchableField[]>(['message']);

// Derived Filtered Logs
export const filteredLogsAtom = atom((get) => {
    const logs = get(logsAtom);
    const filterText = get(filterTextAtom).toLowerCase();
    const includedFields = get(includedFieldsAtom);

    if (!filterText) return logs;

    return logs.filter(log =>
        includedFields.some(field => {
            const value = log[field as keyof LogEntry];
            // For level, use exact match
            if (field === 'level') {
                return (typeof value === 'string' ? value : String(value)).toLowerCase() === filterText;
            }

            if (typeof value === 'string') {
                return value.toLowerCase().includes(filterText);
            }
            return String(value).toLowerCase().includes(filterText);
        })
    );
});

