import type { Meta, StoryObj } from '@storybook/react';
import { Provider, useSetAtom } from 'jotai';
import { ControlBar } from './ControlBar';
import { isViewingFileAtom, currentFileNameAtom, isLoadingFileAtom, loadingProgressAtom } from '@/store';
import { useEffect } from 'react';

const StoreSetter = ({
    isViewingFile = false,
    currentFileName = null,
    isLoadingFile = false,
    loadingProgress = 0
}: {
    isViewingFile?: boolean;
    currentFileName?: string | null;
    isLoadingFile?: boolean;
    loadingProgress?: number;
}) => {
    const setIsViewingFile = useSetAtom(isViewingFileAtom);
    const setCurrentFileName = useSetAtom(currentFileNameAtom);
    const setIsLoadingFile = useSetAtom(isLoadingFileAtom);
    const setLoadingProgress = useSetAtom(loadingProgressAtom);

    useEffect(() => {
        setIsViewingFile(isViewingFile);
        setCurrentFileName(currentFileName);
        setIsLoadingFile(isLoadingFile);
        setLoadingProgress(loadingProgress);
    }, [isViewingFile, currentFileName, isLoadingFile, loadingProgress, setIsViewingFile, setCurrentFileName, setIsLoadingFile, setLoadingProgress]);

    return null;
};


const meta = {
    title: 'ControlBar/ControlBar',
    component: ControlBar,
    parameters: {
        layout: 'fullscreen', // ControlBar is absolute positioned
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
