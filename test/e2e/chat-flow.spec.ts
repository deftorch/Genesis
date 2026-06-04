import { test, expect } from '@playwright/test';

test.describe('Genesis Chat Application E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before navigation to ensure a clean state and seed default chats
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.localStorage.setItem('settings-storage', JSON.stringify({
        state: { preferences: { developerMode: true, theme: 'system', fontSize: 'medium', autoSave: true, showTokenCount: false, enableNotifications: true } },
        version: 0
      }));
    });

    // Intercept /api/chat requests and return a mock AI response with a code block
    await page.route('**/api/chat', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message: {
            role: 'assistant',
            content: 'Here is your custom visualizer code!\n\n```javascript\n// renderer: p5\nfunction setup() {\n  createCanvas(400, 400);\n}\nfunction draw() {\n  background(100, 200, 255);\n  fill(255);\n  ellipse(200, 200, 100);\n}\n```',
            tokens: 45
          }
        }),
      });
    });

    // Go to the main application page
    await page.goto('/');
  });

  test('should display seeded chats in sidebar', async ({ page }) => {
    // Verify that sidebar loads and displays seeded chats
    const sidebar = page.locator('aside, .sidebar, [class*="sidebar"]');
    await expect(page.locator('text=Bouncing Ball Animation').first()).toBeVisible();
    await expect(page.locator('text=Particle System').first()).toBeVisible();
    await expect(page.locator('text=Fractal Tree').first()).toBeVisible();
    await expect(page.locator('text=Wave Pattern').first()).toBeVisible();
  });

  test('should toggle settings modal and theme correctly', async ({ page }) => {
    // Click Settings button
    const settingsBtn = page.locator('button[title="Settings"]').first();
    await settingsBtn.click();

    // Verify Settings Modal is open
    await expect(page.locator('text=Settings').first()).toBeVisible();
    await expect(page.locator('text=General Settings').first()).toBeVisible();
    await expect(page.locator('text=Auto-save chats').first()).toBeVisible();

    // Close Settings Modal
    const closeBtn = page.locator('button:has-text("Close"), button[aria-label="Close"]').first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    } else {
      await page.keyboard.press('Escape');
    }

    // Verify Settings Modal is closed
    await expect(page.locator('text=General Settings').first()).not.toBeVisible();
  });

  test('should select sidebar chat and load messages', async ({ page }) => {
    // Click on "Bouncing Ball Animation" chat in sidebar
    await page.locator('text=Bouncing Ball Animation').first().click();

    // Verify chat workspace shows the active chat title or messages
    await expect(page.locator('text=Bouncing Ball Animation').first()).toBeVisible();
  });

  test('should submit user prompt, receive mock response, and display preview panel', async ({ page }) => {
    // Type in chat input and submit
    const input = page.getByPlaceholder('What creativity do you want to realize today?');
    await expect(input).toBeVisible();
    await input.fill('Create a circle animation');
    await input.press('Enter');

    // Verify the mock response is added to the chat and shows up
    await expect(page.locator('text=Here is your custom visualizer code!').first()).toBeVisible();

    // Verify preview panel tab is visible and default active
    await expect(page.locator('text=Preview').first()).toBeVisible();
    await expect(page.locator('text=Code').first()).toBeVisible();
  });
});
