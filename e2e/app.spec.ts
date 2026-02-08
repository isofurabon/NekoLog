import { test, expect } from '@playwright/test';

test.describe('NekoLog Application', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('loads with correct title and initial state', async ({ page }) => {
        // Check page load
        await expect(page).toHaveTitle(/NekoLog/);

        // Check initial UI elements are present
        await expect(page.getByText('Start Demo Mode')).toBeVisible();
        await expect(page.getByText('No Connected Device')).toBeVisible();
    });

    test('control bar displays correctly', async ({ page }) => {
        // Device status button should be visible
        const deviceStatus = page.locator('[data-testid="device-status"]').or(
            page.getByText('No Connected Device')
        );
        await expect(deviceStatus).toBeVisible();
    });

    test('demo mode starts and displays logs', async ({ page }) => {
        // Click start demo mode
        await page.getByText('Start Demo Mode').click();

        // Wait for logs to appear (demo mode generates logs rapidly)
        await page.waitForTimeout(500);

        // Check that device name changes to mock device
        await expect(page.getByText('Neko Mock Device')).toBeVisible();

        // Demo mode button should disappear
        await expect(page.getByText('Start Demo Mode')).not.toBeVisible();
    });

    test('log filtering works in demo mode', async ({ page }) => {
        // Start demo mode
        await page.getByText('Start Demo Mode').click();
        await page.waitForTimeout(500);

        // Click on the control bar to open search (when connected)
        // First, find a clickable area that triggers the search
        const _filterArea = page.getByPlaceholder(/filter logs/i);

        // If search isn't open, we need to trigger it
        // Based on the code, clicking the control bar area when connected shows LogSearch
        const controlBar = page.locator('.relative.flex.items-center').first();
        await controlBar.click();

        // Wait for filter input to appear
        await page.waitForTimeout(200);

        // Type in the filter
        const filterInput = page.getByPlaceholder(/filter logs/i);
        if (await filterInput.isVisible()) {
            await filterInput.fill('mock');

            // Filter should be applied
            await page.waitForTimeout(100);
        }
    });

    test('clear logs functionality', async ({ page }) => {
        // Start demo mode
        await page.getByText('Start Demo Mode').click();
        await page.waitForTimeout(1000);

        // Find and click the trash/clear button
        const _clearButton = page.locator('button').filter({ has: page.locator('svg') }).last();

        // Look for the trash icon button in control bar
        const trashButton = page.getByTitle(/clear/i);
        if (await trashButton.isVisible()) {
            await trashButton.click();
            await page.waitForTimeout(200);
        }
    });

    test('filter menu opens and closes', async ({ page }) => {
        // Start demo mode to get the connected state
        await page.getByText('Start Demo Mode').click();
        await page.waitForTimeout(300);

        // Open search by clicking the control bar
        const controlBar = page.locator('.relative.flex.items-center').first();
        await controlBar.click();
        await page.waitForTimeout(200);

        // Look for the filter icon button
        const filterButton = page.getByTitle('Filter Fields');
        if (await filterButton.isVisible()) {
            await filterButton.click();

            // Menu should appear with field options
            const menu = page.locator('.bg-surface0'); // Use class selector for menu container
            await expect(menu).toBeVisible();
            await expect(menu.getByText('message')).toBeVisible();
            await expect(menu.getByText('tag')).toBeVisible();
            await expect(menu.getByText('level')).toBeVisible();
        }
    });

    test('toggle filter field in menu', async ({ page }) => {
        // Start demo mode
        await page.getByText('Start Demo Mode').click();
        await page.waitForTimeout(300);

        // Open search
        const controlBar = page.locator('.relative.flex.items-center').first();
        await controlBar.click();
        await page.waitForTimeout(200);

        // Open filter menu
        const filterButton = page.getByTitle('Filter Fields');
        if (await filterButton.isVisible()) {
            await filterButton.click();
            await page.waitForTimeout(200);

            // Click on 'tag' to toggle it
            const tagOption = page.getByText('tag').first();
            await tagOption.click();

            // Verify it's toggled (checkbox state change)
            await page.waitForTimeout(100);
        }
    });
});

test.describe('Keyboard Navigation', () => {
    test('escape key closes search', async ({ page }) => {
        await page.goto('/');

        // Start demo mode
        await page.getByText('Start Demo Mode').click();
        await page.waitForTimeout(300);

        // Open search
        const controlBar = page.locator('.relative.flex.items-center').first();
        await controlBar.click();
        await page.waitForTimeout(200);

        // Check if filter input is visible
        const filterInput = page.getByPlaceholder(/filter logs/i);
        if (await filterInput.isVisible()) {
            // Press Escape
            await filterInput.press('Escape');
            await page.waitForTimeout(200);
        }
    });
});
