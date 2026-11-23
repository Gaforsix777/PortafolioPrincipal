import { test, expect } from '@playwright/test';
test('muestra proyectos reales de la API y permite filtrarlos', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Ramiro');
  const cards = page.locator('#proyectos article');
  await expect(cards).toHaveCount(3);
  await page.getByRole('button', { name: 'Videojuegos', exact: true }).click();
  await expect(cards).toHaveCount(1); await expect(cards).toContainText('Fragmentos del Olvido');
  await page.getByRole('button', { name: 'Todos', exact: true }).click(); await expect(cards).toHaveCount(3);
});
test('envía un contacto desde el navegador a la API y muestra confirmación', async ({ page }) => {
  await page.goto('/#contacto');
  await page.getByLabel('Nombre', { exact: true }).fill('Prueba E2E');
  await page.getByLabel('Correo electrónico').fill('e2e@example.com');
  await page.getByLabel('Cuéntame tu idea').fill('Me gustaría desarrollar una aplicación web.');
  const saved = page.waitForResponse(r => r.url().endsWith('/api/contact') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();
  expect((await saved).status()).toBe(201);
  await expect(page.getByRole('status')).toContainText('Tu mensaje quedó guardado');
  await expect(page.getByLabel('Nombre', { exact: true })).toHaveValue('');
});
test('muestra validación accesible e impide un envío vacío', async ({ page }) => {
  let requests = 0; page.on('request', r => { if (r.method() === 'POST') requests++; });
  await page.goto('/#contacto'); await page.getByRole('button', { name: 'Enviar mensaje' }).click();
  await expect(page.getByLabel('Nombre', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('Escribe un correo válido.', { exact: true })).toBeVisible();
  await expect(page.getByText('Escribe un mensaje de 10 a 2000 caracteres.', { exact: true })).toBeVisible();
  expect(requests).toBe(0);
});
test('permite navegar en móvil sin desbordamiento horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/');
  await page.getByRole('link', { name: 'Hablemos' }).click();
  await expect(page).toHaveURL(/#contacto$/); await expect(page.getByLabel('Nombre', { exact: true })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
