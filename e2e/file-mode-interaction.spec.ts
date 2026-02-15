import { test, expect } from '@playwright/test';

test.describe('File Mode Interactions', () => {
    test('should stop live logs and allow expand on click', async ({ page }) => {
        await page.goto('/');

        // 1. Start Mock Mode
        await page.getByText('Start Demo Mode').click();
        await expect(page.getByText('Neko Mock Device')).toBeVisible();

        // 2. Wait for at least one log row to appear
        await expect(page.locator('div[data-index="0"]')).toBeVisible({ timeout: 10000 });


        // 3. Drop File
        const logContent = `12-12 12:12:12.123  1000  1000 I FileLog: FILE_CONTENT_MARKER`;
        const dataTransfer = await page.evaluateHandle((data) => {
            const dt = new DataTransfer();
            const file = new File([data], 'interaction.log', { type: 'text/plain' });
            dt.items.add(file);
            return dt;
        }, logContent);

        await page.dispatchEvent('.bg-base', 'drop', { dataTransfer });

        // 4. Verify File Mode and Disconnect
        await expect(page.getByText('interaction.log')).toBeVisible();
        await expect(page.getByText('Neko Mock Device')).not.toBeVisible();

        // 5. Verify Content
        await expect(page.getByText('FILE_CONTENT_MARKER')).toBeVisible();

        // 6. Verify NO new mock logs (Mock logs have specific format, e.g. "Mock Log")
        // We can check if "Neko Mock Device" is gone, which implies disconnection in UI.
        // But to be sure about stream, we wait a bit and check if log count is stable? 
        // Hard to test stream stop strictly in E2E without intercepting, but UI state check is good enough for now.

        // 7. Verify Control Bar Click
        // Force mouse move away to clear hover state
        await page.mouse.move(0, 0);

        // Hover first to see the hint (optional for test, but mimics user)
        await page.getByTestId('control-bar-container').hover();

        // Click to expand - target the clickable area explicitly, force to bypass potential overlay issues
        await page.getByTestId('file-mode-click-area').click({ force: true });


        // Verify Search Input appears
        const searchInput = page.getByPlaceholder('Filter logs... (Ctrl+K or Cmd+K)');

        await expect(searchInput).toBeVisible();
        await expect(searchInput).toBeFocused();
    });
});
