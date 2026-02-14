import type { Meta, StoryObj } from '@storybook/react';
import { MarqueeText } from './MarqueeText';

const meta = {
    title: 'ControlBar/MarqueeText',
    component: MarqueeText,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        text: { control: 'text' },
        isHovered: { control: 'boolean' },
    },
} satisfies Meta<typeof MarqueeText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        text: 'Short text',
        isHovered: false,
        className: 'text-white w-32 border border-gray-600',
    },
};

export const LongTextHover: Story = {
    args: {
        text: 'This is a very long text that should marquee when hovered because it exceeds the container width.',
        isHovered: true,
        className: 'text-white w-64 border border-gray-600',
    },
};

export const LongTextNoHover: Story = {
    args: {
        text: 'This is a very long text that should truncate when not hovered.',
        isHovered: false,
        className: 'text-white w-64 border border-gray-600',
    },
};
