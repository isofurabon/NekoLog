import type { Meta, StoryObj } from '@storybook/react';
import { Provider } from 'jotai';
import { useHydrateAtoms } from 'jotai/utils';
import { LogList } from './LogList';
import { logsAtom, autoScrollAtom } from '@/store';
import type { LogEntry } from '@/types';

// Helper to hydrate atoms
// deno-lint-ignore no-explicit-any
const HydrateAtoms = ({ initialValues, children }: { initialValues: any; children: React.ReactNode }) => {
    useHydrateAtoms(initialValues);
    return <>{children}</>;
};

const meta = {
    title: 'Viewer/LogList',
    component: LogList,
    parameters: {
        layout: 'fullscreen',
    },
    decorators: [
        (Story) => (
            <div className="h-screen w-full flex flex-col">
                <Story />
            </div>
        ),
    ]
} satisfies Meta<typeof LogList>;

export default meta;
type Story = StoryObj<typeof meta>;

const createLog = (seq: number, level: LogEntry['level'] = 'I'): LogEntry => ({
    id: crypto.randomUUID(),
    timestamp: `10-14 12:${30 + (seq % 30)}:${seq % 60}.000`,
    pid: '1234',
    tid: '5678',
    level,
    tag: 'MyApp',
    message: `Log message sequence #${seq}. This is a sample log entry to demonstrate the viewer capabilities.`,
});

const generateLogs = (count: number) => {
    return Array.from({ length: count }, (_, i) => {
        const levels: LogEntry['level'][] = ['V', 'D', 'I', 'W', 'E', 'F'];
        return createLog(i, levels[i % levels.length]);
    });
};

const shortLogs = generateLogs(10);
const longLogs = generateLogs(1000);

export const Empty: Story = {
    decorators: [
        (Story) => (
            <Provider>
                <Story />
            </Provider>
        ),
    ],
};

export const WithLogs: Story = {
    decorators: [
        (Story) => (
            <Provider>
                <HydrateAtoms initialValues={[[logsAtom, shortLogs]] as const}>
                    <Story />
                </HydrateAtoms>
            </Provider>
        ),
    ],
};

export const ManyLogs: Story = {
    decorators: [
        (Story) => (
            <Provider>
                <HydrateAtoms initialValues={[[logsAtom, longLogs]] as const}>
                    <Story />
                </HydrateAtoms>
            </Provider>
        ),
    ],
};

export const AutoScrollOff: Story = {
    decorators: [
        (Story) => (
            <Provider>
                <HydrateAtoms initialValues={[[logsAtom, longLogs], [autoScrollAtom, false]] as const}>
                    <Story />
                </HydrateAtoms>
            </Provider>
        ),
    ],
};
