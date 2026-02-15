import { test, expect } from '@playwright/test';

test.describe('Drag & Drop Log File', () => {
    test('should disconnect mock mode and open log file when dropped', async ({ page }) => {
        await page.goto('/');

        // Start Mock Mode first
        const startMockBtn = page.getByText('Start Demo Mode');
        await startMockBtn.click();
        await expect(page.getByText('Neko Mock Device')).toBeVisible();

        // Prepare file content with PID/TID format
        const logContent = `02-15 16:03:56.424  1138/ 1163 I ThermalService: Sensor Name:usbport temp:26.467
02-15 07:03:56.669     ?/    ? I Raw: --------- beginning of main`;

        // Drop file
        const dataTransfer = await page.evaluateHandle((data) => {
            const dt = new DataTransfer();
            const file = new File([data], 'sample.log', { type: 'text/plain' });
            dt.items.add(file);
            return dt;
        }, logContent);

        await page.dispatchEvent('.bg-base', 'drop', { dataTransfer });

        // Verify Mock Mode is disconnected
        await expect(page.getByText('Neko Mock Device')).not.toBeVisible();

        // Verify file loaded and parsed correctly
        await expect(page.getByText('sample.log')).toBeVisible();
        await expect(page.getByText('ThermalService')).toBeVisible();
        await expect(page.getByText('Sensor Name:usbport')).toBeVisible();
        await expect(page.getByText('beginning of main')).toBeVisible();

        // Verify "Click to filter" hint on hover
        await page.getByTestId('control-bar-container').hover();
        await expect(page.getByText('Click to filter').first()).toBeVisible();

        // Cleanup: Click Trash

        const trashIcon = page.getByTitle('Clear Logs');
        await trashIcon.click({ force: true });

        // Verify state reset
        await expect(page.getByText('sample.log')).not.toBeVisible();
    });
});
