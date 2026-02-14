import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { LogSearch } from './LogSearch';
import { filterTextAtom, includedFieldsAtom } from '@/store';
import React from 'react';

const HydrateAtoms = ({ initialValues, children }: { initialValues: any; children: React.ReactNode }) => {
    useHydrateAtoms(initialValues);
    return <>{children}</>;
};

const meta = {
    title: 'ControlBar/LogSearch',
    component: LogSearch,
    parameters: {
        layout: 'centered',
    },
    decorators: [
        (Story) => (
            <div className="w-[600px] h-12 bg-gray-800 rounded-lg flex items-center relative">
                <Story />
            </div>
        )
    ],
    tags: ['autodocs'],
    render: (args) => {
        const inputRef = React.useRef<HTMLInputElement>(null);
        return <LogSearch {...args} inputRef={inputRef} />;
    }
} satisfies Meta<typeof LogSearch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        onClose: () => console.log('Close search'),
        inputRef: { current: null } as any, // Mocked in render
    },
    decorators: [
        (Story) => (
            <Provider>
                <Story />
            </Provider>
        ),
    ],
};

export const WithFilterText: Story = {
    args: {
        onClose: () => console.log('Close search'),
        inputRef: { current: null } as any,
    },
    decorators: [
        (Story) => (
            <Provider>
                <HydrateAtoms initialValues={[[filterTextAtom, 'error']]}>
                    <Story />
                </HydrateAtoms>
            </Provider>
        ),
    ],
};
