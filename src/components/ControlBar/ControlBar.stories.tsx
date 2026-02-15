import type { Meta, StoryObj } from '@storybook/react';
import { Provider, useSetAtom } from 'jotai';
import { ControlBar } from './ControlBar';
import { startFileLoadAtom, updateFileProgressAtom, resetFileModeAtom } from '@/store';
import { useEffect } from 'react';

/** Helper component that sets file-mode state for Storybook stories via action atoms */
const StoreSetter = ({
    isViewingFile = false,
    currentFileName = null,
    isLoadingFile = false,
    loadingProgress = 0,
}: {
    isViewingFile?: boolean;
    currentFileName?: string | null;
    isLoadingFile?: boolean;
    loadingProgress?: number;
}) => {
    const startFileLoad = useSetAtom(startFileLoadAtom);
    const updateProgress = useSetAtom(updateFileProgressAtom);
    const resetFileMode = useSetAtom(resetFileModeAtom);

    useEffect(() => {
        if (isViewingFile && currentFileName) {
            startFileLoad(currentFileName);
            updateProgress(loadingProgress);
            // If not loading, we need to simulate the "finished" state
            // startFileLoad sets isLoading: true, so if we don't want loading, no further action needed
            // since the ControlBar auto-collapses on isLoading becoming false. 
            // For storybook, the isLoading state from startFileLoad is fine for ViewingFile story.
        } else {
            resetFileMode();
        }
    }, [isViewingFile, currentFileName, isLoadingFile, loadingProgress, startFileLoad, updateProgress, resetFileMode]);

    return null;
};

const meta = {
    title: 'ControlBar/ControlBar',
    component: ControlBar,
    parameters: {
        layout: 'fullscreen',
    },
    decorators: [
        (Story) => (
            <div className="h-[200px] w-full bg-gray-900 relative">
                <Story />
            </div>
        )
    ],
    tags: ['autodocs']
} satisfies Meta<typeof ControlBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Disconnected: Story = {
    args: {
        isConnected: false,
        deviceUniqueId: undefined,
        onConnect: () => console.log('Connect clicked'),
        onClear: () => console.log('Clear clicked'),
    },
    decorators: [
        (Story) => (
            <Provider>
                <Story />
            </Provider>
        ),
    ],
};

export const Connected: Story = {
    args: {
        isConnected: true,
        deviceUniqueId: 'pixel-6-pro',
        onConnect: () => console.log('Connect clicked'),
        onClear: () => console.log('Clear clicked'),
    },
    decorators: [
        (Story) => (
            <Provider>
                <StoreSetter isViewingFile={false} />
                <Story />
            </Provider>
        ),
    ],
};

export const ViewingFile: Story = {
    args: {
        isConnected: false,
        deviceUniqueId: undefined,
        onConnect: () => { },
        onClear: () => console.log('Clear clicked'),
    },
    decorators: [
        (Story) => (
            <Provider>
                <StoreSetter isViewingFile currentFileName="anr_trace.txt" />
                <Story />
            </Provider>
        ),
    ],
};

export const LoadingFile: Story = {
    args: {
        isConnected: false,
        deviceUniqueId: undefined,
        onConnect: () => { },
        onClear: () => console.log('Clear clicked'),
    },
    decorators: [
        (Story) => (
            <Provider>
                <StoreSetter
                    isViewingFile
                    currentFileName="large_log_file.txt"
                    isLoadingFile
                    loadingProgress={45}
                />
                <Story />
            </Provider>
        ),
    ],
};
