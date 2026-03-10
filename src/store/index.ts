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
export const includedFieldsAtom = atom<Set<SearchableField>>(new Set(['message']));

// Derived Filtered Logs
export const filteredLogsAtom = atom((get) => {
    const logs = get(logsAtom);
    const filterText = get(filterTextAtom).toLowerCase();
    const includedFields = get(includedFieldsAtom);

    if (!filterText) return logs;

    const escapedFilterText = filterText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedFilterText, 'i');

    return logs.filter(log => {
        for (const field of includedFields) {
            const value = log[field as keyof LogEntry];
            // For level, use exact match
            if (field === 'level') {
                if ((typeof value === 'string' ? value : String(value)).toLowerCase() === filterText) {
                    return true;
                }
                continue;
            }

            if (typeof value === 'string') {
                if (regex.test(value)) return true;
            } else if (regex.test(String(value))) {
                return true;
            }
        }
        return false;
    });
});

// File Mode State
export * from './fileStore.ts';
