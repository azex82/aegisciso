import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should show login page when not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByRole('heading', { name: /aegisciso/i })).toBeVisible();
  });

  test('should display login form with all fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('invalid@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/invalid email or password/i)).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('ciso@aegisciso.com');
    await page.getByLabel(/password/i).fill('SecurePass123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('/');
    await expect(page.getByText(/security posture/i)).toBeVisible();
  });

  test('should be able to logout', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('ciso@aegisciso.com');
    await page.getByLabel(/password/i).fill('SecurePass123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('/');

    // Click user menu and logout
    await page.getByRole('button', { name: /SC/i }).click();
    await page.getByRole('menuitem', { name: /log out/i }).click();
    await expect(page).toHaveURL(/.*login/);
  });
});

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('ciso@aegisciso.com');
    await page.getByLabel(/password/i).fill('SecurePass123!');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('/');
  });

  test('should display posture card with score', async ({ page }) => {
    await expect(page.getByText(/security posture/i)).toBeVisible();
  });

  test('should display metrics cards', async ({ page }) => {
    await expect(page.getByText(/policies/i).first()).toBeVisible();
    await expect(page.getByText(/risks/i).first()).toBeVisible();
    await expect(page.getByText(/objectives/i).first()).toBeVisible();
  });

  test('should have working navigation', async ({ page }) => {
    await page.getByRole('link', { name: /posture/i }).click();
    await expect(page).toHaveURL(/.*posture/);
  });
});
