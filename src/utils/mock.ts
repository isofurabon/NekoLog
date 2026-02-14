export const generateMockLog = (): string => {
    const levels = ['D', 'I', 'W', 'E', 'V'];
    const level = levels[Math.floor(Math.random() * levels.length)];
    const tags = ['ActivityManager', 'WindowManager', 'NekoService', 'SystemUI'];
    const tag = tags[Math.floor(Math.random() * tags.length)];
    const timestamp = new Date().toISOString().slice(5, 23).replace('T', ' ');
    const pid = Math.floor(Math.random() * 10000);
    const tid = Math.floor(Math.random() * 10000);

    const baseMessage = 'This is a mock log message ';
    const messageNumber = Math.floor(Math.random() * 1000);

    // Generate variable length content
    const length = Math.floor(Math.random() * 200); // 0 to 200 extra chars
    const extraContent = 'x'.repeat(length);

    return `${timestamp} ${pid} ${tid} ${level} ${tag}: ${baseMessage}#${messageNumber} ${extraContent}\n`;
};
