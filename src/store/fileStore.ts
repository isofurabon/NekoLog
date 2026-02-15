import { atom } from 'jotai';

// --- File Mode State ---

interface FileModeState {
    isViewing: boolean;
    fileName: string | null;
    isLoading: boolean;
    progress: number;
}

const fileModeBaseAtom = atom<FileModeState>({
    isViewing: false,
    fileName: null,
    isLoading: false,
    progress: 0,
});

// Derived read-only atoms for component consumption
export const isViewingFileAtom = atom((get) => get(fileModeBaseAtom).isViewing);
export const currentFileNameAtom = atom((get) => get(fileModeBaseAtom).fileName);
export const isLoadingFileAtom = atom((get) => get(fileModeBaseAtom).isLoading);
export const loadingProgressAtom = atom((get) => get(fileModeBaseAtom).progress);

// Action atoms for batch state transitions
export const startFileLoadAtom = atom(null, (_get, set, fileName: string) => {
    set(fileModeBaseAtom, { isViewing: true, fileName, isLoading: true, progress: 0 });
});

export const updateFileProgressAtom = atom(null, (_get, set, progress: number) => {
    set(fileModeBaseAtom, (prev) => ({ ...prev, progress }));
});

export const finishFileLoadAtom = atom(null, (_get, set) => {
    set(fileModeBaseAtom, (prev) => ({ ...prev, isLoading: false }));
});

export const cancelFileLoadAtom = atom(null, (_, set) => {
    set(fileModeBaseAtom, (prev) => ({ ...prev, isLoading: false }));
});

export const resetFileModeAtom = atom(null, (_, set) => {
    set(fileModeBaseAtom, { isViewing: false, fileName: null, isLoading: false, progress: 0 });
});
