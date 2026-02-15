/// <reference types="@types/w3c-web-usb" />
import { useCallback, useEffect, useRef, useState } from 'react';
import { AdbDaemonWebUsbDeviceManager } from '@yume-chan/adb-daemon-webusb';
import { Adb, AdbDaemonTransport } from '@yume-chan/adb';
import AdbWebCredentialStore from '@yume-chan/adb-credential-web';
import { generateMockLog } from '../utils/mock.ts';

export function useAdb(onData: (chunk: ArrayBuffer) => void) {
    const [, setDevice] = useState<Adb | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [deviceName, setDeviceName] = useState<string | null>(null);

    // Mock state
    const mockInterval = useRef<number | null>(null);
    const CredentialStore = useRef(new AdbWebCredentialStore());

    // Listen for device disconnection
    useEffect(() => {
        const handleDisconnect = () => {
            setDevice(null);
            setIsConnected(false);
            setDeviceName(null);
        };

        const usb = navigator.usb;
        if (!usb) return;

        usb.addEventListener('disconnect', handleDisconnect);
        return () => usb.removeEventListener('disconnect', handleDisconnect);
    }, []);

    const abortControllerRef = useRef<AbortController | null>(null);

    const startLogcat = useCallback(async (adb: Adb) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
            // Check if shellProtocol is available
            if (!adb.subprocess.shellProtocol) {
                alert('Device does not support shell command');
                return;
            }

            // Clear buffer first
            await adb.subprocess.shellProtocol.spawnWait('logcat -c');

            const process = await adb.subprocess.shellProtocol.spawn('logcat -v threadtime');

            // Reading stream
            // process.stdout is a ReadableStream<Uint8Array>
            // We use a reader to consume it
            const reader = process.stdout.getReader();

            while (true) {
                if (controller.signal.aborted) {
                    await reader.cancel();
                    break;
                }

                const { done, value } = await reader.read();
                if (done) break;
                if (value) {
                    // Value is Uint8Array, we need ArrayBuffer or just pass the buffer
                    // Copying to ArrayBuffer to be safe for transfer
                    const buffer = value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
                    onData(buffer as ArrayBuffer);
                }
            }
        } catch (e) {
            // Ignore abort errors
            if (controller.signal.aborted) return;
            console.error('Logcat Error:', e);
        }
    }, [onData]);

    const connect = useCallback(async () => {
        const MAX_RETRIES = 3;
        const RETRY_DELAY_MS = 500;

        const Manager = AdbDaemonWebUsbDeviceManager.BROWSER;
        if (!Manager) {
            alert('WebUSB is not supported in this browser');
            return;
        }

        const device = await Manager.requestDevice();
        if (!device) return;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const connection = await device.connect();

                // Authenticate using AdbDaemonTransport
                // serial is required, fall back to "unknown" if missing (WebUSB device usually has it)
                const transport = await AdbDaemonTransport.authenticate({
                    serial: device.serial || 'unknown',
                    connection,
                    credentialStore: CredentialStore.current,
                });

                const adb = new Adb(transport);

                setDevice(adb);
                setIsConnected(true);
                setDeviceName(device.name || 'Android Device');

                // Start logcat immediately
                startLogcat(adb);
                return; // Success, exit the retry loop

            } catch (e) {
                const errorMessage = (e as Error).message;
                console.error(`ADB Connect Error (attempt ${attempt}/${MAX_RETRIES}):`, e);

                // If the device was disconnected, we can't retry with the same reference
                if (errorMessage.includes('disconnected')) {
                    alert('Connection interrupted. Please try again.');
                    return;
                }

                if (attempt === MAX_RETRIES) {
                    // Final attempt failed, show error to user
                    alert('Failed to connect: ' + errorMessage);
                } else {
                    // Wait before retrying
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                }
            }
        }
    }, [startLogcat]);

    // Mock Mode
    const startMock = useCallback(() => {
        if (mockInterval.current) return;
        setIsConnected(true);
        setDeviceName('Neko Mock Device');

        const encoder = new TextEncoder();
        const runMock = () => {
            const log = generateMockLog();
            const encoded = encoder.encode(log);
            onData(encoded.buffer);

            // Schedule next log
            // Random interval between 1ms and 30ms
            const delay = 1 + Math.floor(Math.random() * 30);
            mockInterval.current = setTimeout(runMock, delay) as unknown as number;
        };

        runMock();
    }, [onData]);

    const stopMock = useCallback(() => {
        if (mockInterval.current) {
            clearTimeout(mockInterval.current);
            mockInterval.current = null;
        }
    }, []);

    const disconnect = useCallback(() => {
        // Stop logcat reading
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        setDevice(null);
        setIsConnected(false);
        setDeviceName(null);
        stopMock();
    }, [stopMock]);

    return {
        connect,
        disconnect,
        isConnected,
        deviceName,
        startMock,
        stopMock
    };
}
