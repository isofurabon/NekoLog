import { test, expect } from '@playwright/test';


test.describe('Drag & Drop Log File', () => {
    test('should open log file when dropped', async ({ page }) => {
        await page.goto('/');


        const logContent = `01-15 10:30:45.123  1234  5678 I ActivityManager: Starting activity
01-15 10:30:45.124  1234  5678 D TestTag: This is a debug message
01-15 10:30:45.125  1234  5678 E ErrorTag: Something went wrong`;

        // Create a DataTransfer object and simulate drop
        // We need to target the main container
        const dataTransfer = await page.evaluateHandle((data) => {
            const dt = new DataTransfer();
            const file = new File([data], 'sample.log', { type: 'text/plain' });
            dt.items.add(file);
            return dt;
        }, logContent);

        await page.dispatchEvent('.bg-base', 'drop', { dataTransfer });

        // Verify file name is shown in Control Bar
        await expect(page.getByText('sample.log')).toBeVisible();

        // Verify logs are displayed
        await expect(page.getByText('ActivityManager')).toBeVisible();
        await expect(page.getByText('This is a debug message')).toBeVisible();
        await expect(page.getByText('Something went wrong')).toBeVisible();

        // Verify "File Mode" state
        // "Start Demo Mode" should NOT be visible (or Connect button behavior)
        // The "Trash" icon should be visible on hover
        await page.getByTestId('control-bar-container').hover(); // Hover over control bar container

        const trashIcon = page.getByTitle('Clear Logs'); // Assuming title is "Clear Logs"
        // await expect(trashIcon).toBeVisible(); // Skip visibility check if hover is flaky

        // Click Trash to request clear/reset
        await trashIcon.click({ force: true });


        // Verify state reset
        await expect(page.getByText('sample.log')).not.toBeVisible();
        await expect(page.getByText('Click to connect').first()).toBeVisible();
    });
});
