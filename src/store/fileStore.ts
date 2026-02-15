import { atom } from 'jotai';

// File Mode State
export const isViewingFileAtom = atom<boolean>(false);
export const currentFileNameAtom = atom<string | null>(null);
export const isLoadingFileAtom = atom<boolean>(false);
export const loadingProgressAtom = atom<number>(0);
