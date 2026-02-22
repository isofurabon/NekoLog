import type { Meta, StoryObj } from '@storybook/react';
import { WavingText } from './WavingText.tsx';

const meta = {
    title: 'Components/WavingText',
    component: WavingText,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <div className="bg-gray-900 p-12 rounded-xl">
                <Story />
            </div>
        )
    ]
} satisfies Meta<typeof WavingText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        text: 'Ready to Inspect',
    },
};

export const CustomText: Story = {
    args: {
        text: 'Hello World',
    },
};

export const LongText: Story = {
    args: {
        text: 'This is a very long waving text component example',
    },
};
