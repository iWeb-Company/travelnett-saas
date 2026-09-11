// Production frontend + actual API handlers, using transport_ui_server's SQLite fixtures.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const puppeteer = require(process.env.PUPPETEER_MODULE || 'puppeteer-core');
const base = process.env.UI_TEST_URL || 'http://127.0.0.1:3010';
const backend = process.env.BACKEND_TEST_URL || 'http://127.0.0.1:8019';

(async () => {
  const browser = await puppeteer.launch({ headless: true, executablePath: process.env.CHROME_EXECUTABLE });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1000 });
    await page.setCookie({ name: 'access_token', value: 'isolated-test', url: base });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setRequestInterception(true);
    page.on('request', async request => {
      const url = new URL(request.url());
      if (!url.pathname.startsWith('/api/')) return request.continue();
      try {
        const response = await fetch(backend + url.pathname.slice(4) + url.search, {
          method: request.method(), headers: { 'Content-Type': 'application/json' },
          ...(['GET', 'HEAD'].includes(request.method()) ? {} : { body: request.postData() }),
        });
        await request.respond({ status: response.status, contentType: 'application/json', body: await response.text() });
      } catch (error) { errors.push(error.message); await request.abort(); }
    });
    const read = async route => (await fetch(`${backend}${route}?iweb_client_id=tenant`)).json();
    await page.goto(`${base}/salidas/lista/multi/transporte`);
    await page.waitForSelector('form select[name="company"]');
    for (const [company, name, phone] of [['company-a', 'Beatriz', '222'], ['company-b', 'Carlos', '333']]) {
      const forms = await page.$$('form');
      const form = forms[forms.length - 1];
      await (await form.$('select[name="company"]')).select(company);
      await (await form.$('input[name="price"]')).type('200');
      await (await form.$('input[name="name"]')).type(name);
      await (await form.$('input[name="phone"]')).type(phone);
      const saved = page.waitForResponse(response => response.url().includes('/transport-units?') && response.request().method() === 'POST');
      await (await form.$('button[type="submit"], button')).click();
      assert.equal((await saved).status(), 201);
      await page.waitForFunction(expected => document.querySelectorAll('button[aria-controls^="micro-"]').length === expected, {},
        company === 'company-a' ? 2 : 3);
    }
    const accordionButtons = await page.$$('button[aria-controls^="micro-"]');
    await accordionButtons[0].click();
    assert.equal(await accordionButtons[0].evaluate(element => element.getAttribute('aria-expanded')), 'true');
    await accordionButtons[1].click();
    assert.equal(await accordionButtons[0].evaluate(element => element.getAttribute('aria-expanded')), 'false');
    assert.equal(await accordionButtons[1].evaluate(element => element.getAttribute('aria-expanded')), 'true');
    let units = await read('/salidas/multi/transport-units');
    assert.deepEqual(units.map(u => u.number), [1, 2, 3]);
    assert.deepEqual(units.map(u => u.coordinador_nombre), ['Ana', 'Beatriz', 'Carlos']);
    assert.deepEqual(units.map(u => u.transport_company), ['company-a', 'company-a', 'company-b']);
    for (const unit of units.slice(1)) {
      await page.goto(`${base}/salidas/lista/multi/butacas?micro=${unit.id}`);
      await page.waitForSelector('select[aria-label="Tipo de bus del micro"]');
      const saved = page.waitForResponse(response => response.url().includes(`/transport-units/${unit.id}?`) && response.request().method() === 'PATCH');
      await page.select('select[aria-label="Tipo de bus del micro"]', 'mix');
      assert.equal((await saved).status(), 200);
      await page.waitForSelector('[aria-label="Butaca S-2"]');
    }
    const target = units[1];
    await page.goto(`${base}/salidas/lista/multi/butacas?micro=${target.id}`);
    await page.waitForSelector('[aria-label="Butaca S-2"]');
    assert.ok(!(await page.$eval('[aria-label="Butaca S-1"]', element => element.innerText)).includes('NOMBRE0'));
    await page.$eval('[aria-label="Butaca S-2"]', element => {
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('reservationId', 'rp-multi-1');
      element.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer }));
    });
    await page.waitForFunction(() => document.querySelector('[aria-label="Butaca S-2"]').innerText.includes('NOMBRE1'));
    const saved = page.waitForResponse(response => response.url().includes('/seat-assignments') && response.request().method() === 'PUT');
    const buttons = await page.$$('button');
    for (const button of buttons) if ((await button.evaluate(element => element.textContent)).includes('Confirmar')) await button.click();
    assert.equal((await saved).status(), 200);
    const bookings = await read('/reservas/get_reservas');
    const passenger = bookings.find(r => r.id === 'r-multi').reservation_passengers.find(p => p.id === 'rp-multi-1');
    assert.equal(passenger.salida_transport_unit_id, target.id);
    assert.equal(passenger.room_index, 1);
    assert.equal(passenger.butaca_type, 'semicama');
    const output = path.resolve(__dirname, '../.next/transport-qa');
    fs.mkdirSync(output, { recursive: true });
    await page.screenshot({ path: path.join(output, 'three-micros-taquilla.png'), fullPage: true });
    await page.goto(`${base}/salidas/lista/legacy/butacas`);
    await page.waitForSelector('[aria-label="Butaca S-1"]');
    assert.equal(await page.$('select[aria-label="Micro"]'), null);
    assert.ok((await page.$eval('[aria-label="Butaca S-1"]', element => element.innerText)).includes('NOMBRE0'));
    await page.setViewport({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(output, 'legacy-mobile.png'), fullPage: true });
    assert.deepEqual(errors, []);
    console.log('Browser QA passed: 3 micros, 2 companies, coordinators, independent types/seats, atomic save preserving room, single-micro direct access.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
