import { MonitorSmartphone } from 'lucide-react';

interface DeviceStatusProps {
    deviceUniqueId?: string;
    isConnected: boolean;
}

export const DeviceStatus = ({ deviceUniqueId, isConnected }: DeviceStatusProps) => (
    <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
        <MonitorSmartphone size={16} className={isConnected ? "text-green-400" : "text-gray-500"} />
        <span className="whitespace-nowrap">{deviceUniqueId || "No Connected Device"}</span>
    </div>
);
