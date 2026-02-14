import type { Meta, StoryObj } from '@storybook/react';
import { DeviceStatus } from './DeviceStatus';

const meta = {
    title: 'ControlBar/DeviceStatus',
    component: DeviceStatus,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        deviceUniqueId: { control: 'text' },
        isConnected: { control: 'boolean' },
    },
} satisfies Meta<typeof DeviceStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Connected: Story = {
    args: {
        isConnected: true,
        deviceUniqueId: 'emulator-5554',
    },
};

export const Disconnected: Story = {
    args: {
        isConnected: false,
        deviceUniqueId: undefined, // Or empty string, depending on component logic
    },
};

export const Connecting: Story = {
    args: {
        isConnected: false,
        deviceUniqueId: 'emulator-5554'
    }
}
