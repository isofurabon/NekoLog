import type { Meta, StoryObj } from '@storybook/react';
import { LogRow } from './LogRow';
import type { LogEntry } from '@/types';

const meta = {
    title: 'Viewer/LogRow',
    component: LogRow,
    parameters: {
        layout: 'padded',
    },
    tags: ['autodocs'],
} satisfies Meta<typeof LogRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const createLog = (level: LogEntry['level'], message: string): LogEntry => ({
    id: crypto.randomUUID(),
    timestamp: '10-14 12:34:56.789',
    pid: '1234',
    tid: '5678',
    level,
    tag: 'MyApp',
    message,
});

export const Info: Story = {
    args: {
        log: createLog('I', 'Application started successfully.'),
        index: 0,
        style: { position: 'relative', height: 24, width: '100%' },
    },
};

export const Debug: Story = {
    args: {
        log: createLog('D', 'Debugging variable x = 42'),
        index: 1,
        style: { position: 'relative', height: 24, width: '100%' },
    },
};

export const Warning: Story = {
    args: {
        log: createLog('W', 'Resource usage is high.'),
        index: 2,
        style: { position: 'relative', height: 24, width: '100%' },
    },
};

export const Error: Story = {
    args: {
        log: createLog('E', 'Failed to connect to server.'),
        index: 3,
        style: { position: 'relative', height: 24, width: '100%' },
    },
};

export const Fatal: Story = {
    args: {
        log: createLog('F', 'System crash imminent!'),
        index: 4,
        style: { position: 'relative', height: 24, width: '100%' },
    },
};

export const Verbose: Story = {
    args: {
        log: createLog('V', 'Detailed verbose logging info...'),
        index: 5,
        style: { position: 'relative', height: 24, width: '100%' },
    },
};
