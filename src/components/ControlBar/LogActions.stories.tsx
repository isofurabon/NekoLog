import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { LogActions } from './LogActions';
import { autoScrollAtom, logsAtom } from '@/store';
// import { fn } from '@storybook/test'; // If available

const HydrateAtoms = ({ initialValues, children }: { initialValues: any; children: React.ReactNode }) => {
    useHydrateAtoms(initialValues);
    return <>{children}</>;
};

const meta = {
    title: 'ControlBar/LogActions',
    component: LogActions,
    parameters: {
        layout: 'centered',
    },
    args: {
        isExpanded: false,
        onClear: () => console.log('Clear logs clicked'),
        isHovered: true, // Force visible for demo
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div className="p-10 bg-gray-900 border border-gray-700 rounded-lg relative min-h-[100px] flex justify-center">
                <Story />
            </div>
        )
    ]
} satisfies Meta<typeof LogActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    decorators: [
        (Story) => (
            <Provider>
                <Story />
            </Provider>
        ),
    ],
};

export const AutoScrollEnabled: Story = {
    decorators: [
        (Story) => (
            <Provider>
                <HydrateAtoms initialValues={[[autoScrollAtom, true]]}>
                    <Story />
                </HydrateAtoms>
            </Provider>
        ),
    ],
};

export const AutoScrollDisabled: Story = {
    decorators: [
        (Story) => (
            <Provider>
                <HydrateAtoms initialValues={[[autoScrollAtom, false]]}>
                    <Story />
                </HydrateAtoms>
            </Provider>
        ),
    ],
};

// Hidden because isHovered is false (it needs to be hovered to show up when contracted)
export const NotHovered: Story = {
    args: {
        isHovered: false,
    },
    decorators: [
        (Story) => (
            <Provider>
                <Story />
            </Provider>
        ),
    ],
};
