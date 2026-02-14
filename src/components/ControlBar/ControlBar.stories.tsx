import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { ControlBar } from './ControlBar';
import { logsAtom, isRecordingAtom } from '@/store';

const HydrateAtoms = ({ initialValues, children }: { initialValues: any; children: React.ReactNode }) => {
    useHydrateAtoms(initialValues);
    return <>{children}</>;
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
                <Story />
            </Provider>
        ),
    ],
};
