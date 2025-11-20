import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const API_ERROR_RESPONSE = {
  error: 'Unauthorized',
};

const API_SUCCESS_RESPONSE = {
  success: true,
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();

    if (url.includes('/auth/me')) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify(API_ERROR_RESPONSE),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(API_SUCCESS_RESPONSE),
    });
  });
});

const getToastByMessage = (page: Page, message: string) =>
  page.getByRole('status').filter({ hasText: message }).first();

test('shows login screen for anonymous visitors', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: /Добро пожаловать в Stogram/i })).toBeVisible();
  await expect(page.getByPlaceholder('Enter email or username')).toBeVisible();
  await expect(page.getByPlaceholder('Enter password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Войти' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Зарегистрироваться' })).toBeVisible();
});

test('prevents login submit with empty credentials', async ({ page }) => {
  await page.goto('/login');

  await page.getByRole('button', { name: 'Войти' }).click();
  await expect(getToastByMessage(page, 'Please fill in all fields')).toBeVisible();
});

test('navigates to registration and validates password confirmation', async ({ page }) => {
  await page.goto('/login');

  await page.getByRole('link', { name: 'Зарегистрироваться' }).click();
  await expect(page).toHaveURL(/\/register$/);

  await page.getByPlaceholder('your@email.com').fill('demo@stogram.com');
  await page.getByPlaceholder('username').fill('demouser');
  await page.getByPlaceholder('Your Name (optional)').fill('Demo User');
  await page.getByPlaceholder('Min. 8 characters').fill('password123');
  await page.getByPlaceholder('Repeat password').fill('password321');

  await page.getByRole('button', { name: 'Create Account' }).click();
  await expect(getToastByMessage(page, 'Passwords do not match')).toBeVisible();
});
