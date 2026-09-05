// Browser smoke test using mocked APIs: never writes to a real agency.
// PUPPETEER_MODULE and CHROME_EXECUTABLE may point to existing local installations.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const puppeteer = require(process.env.PUPPETEER_MODULE || 'puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({ headless: true, executablePath: process.env.CHROME_EXECUTABLE });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 1000 });
    const base = process.env.UI_TEST_URL || 'http://localhost:3010';
    await page.setCookie({ name: 'access_token', value: 'isolated-ui-test', url: base });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const params = {
      destinos: [{ id: 'd3', name: 'Zárate' }, { id: 'd1', name: 'Ávila' }, { id: 'd2', name: 'bariloche' }],
      hotels: [{ id: 'h1', name: 'Hotel de prueba', destino: 'd1' }],
      excursions: [], periods: [{ id: 'p1', name: 'Invierno' }], regimenes: [{ id: 'r1', name: 'Media pensión' }],
    };
    const cargas = ['Liniers', 'Morón', 'San Justo', 'La Plata'].map((name, i) => ({ id: `c${i}`, name, horario: i === 1 ? '' : '08:00' }));
    const salidas = ['2026-07-26', '2026-08-02', '2026-08-09'].map((date_of_out, i) => ({
      id: `s${i}`, date_of_out, destino: 'd1', periodo: 'p1', semicama: 40, cama: 10, cargas, active: true,
    }));
    let pkg = { id: 'pkg', iweb_client_id: 'tenant', name: 'Nombre comercial', name_system: 'Nombre interno',
      destino: 'd1', periodo: 'p1', price: 100, gastos: 10, description: 'Descripción de prueba', moneda: 'pesos', image: '/sin-imagen.svg', active: true, web: true,
      dates: salidas.map(s => s.id), hotels: [{ id: 'ph1', hotel_id: 'h1', hotel_regimen_id: 'r1', hotel_noches: 3,
        estandar: true, superior: false, suite: true, pricing_type: 'persona', cupos: salidas.map(s => ({ salida_id: s.id, capacidad: 20 })) }] };
    let captured;
    let rejectSave = true;
    let hotelAvailable = 18;
    const reservations = [{ id: 'res1', salida_id: 's0', package_id: 'pkg', hotel_id: 'h1', active: true,
      lugar_carga_id: 'c0', type: 'tradicional', room_type: 'doble_matrimonial_estandar',
      reservation_passengers: [
        { id: 'rp1', pasajero_id: 'pax1', name: 'Ana', last_name: 'Uno', pasajero_type: 'ADL', lugar_carga_id: 'c0' },
        { id: 'rp2', pasajero_id: 'pax2', name: 'Luis', last_name: 'Dos', pasajero_type: 'ADL', lugar_carga_id: 'c1' },
      ] }];
    await page.setRequestInterception(true);
    page.on('request', request => {
      const url = new URL(request.url());
      if (!url.pathname.startsWith('/api/')) return request.continue();
      let data = [];
      let status = 200;
      if (url.pathname === '/api/auth/me') data = { id: 'user', iweb_client_id: 'tenant', name: 'QA', rol: 'admin', username: 'qa' };
      else if (url.pathname.endsWith('get_all_parameters')) data = params;
      else if (url.pathname.endsWith('get_destinos')) data = params.destinos;
      else if (url.pathname.endsWith('get_hotels')) data = params.hotels;
      else if (url.pathname.endsWith('get_regimenes')) data = params.regimenes;
      else if (url.pathname.endsWith('get_periods')) data = params.periods;
      else if (url.pathname.endsWith('get_lugares_carga')) data = cargas;
      else if (url.pathname.endsWith('get_clients')) data = [{ id: 'cli2', complete_name: 'Zulma' }, { id: 'cli1', complete_name: 'Ángel' }];
      else if (url.pathname.endsWith('get_packages')) data = [pkg];
      else if (url.pathname.includes('get_package/')) data = pkg;
      else if (url.pathname.endsWith('get_salidas')) data = salidas;
      else if (url.pathname.includes('get_salida/')) data = salidas.find(s => url.pathname.endsWith(s.id));
      else if (url.pathname.endsWith('get_reservas')) data = reservations;
      else if (url.pathname.includes('get_availability/')) data = salidas.map(s => ({ hotel_id: 'h1', salida_id: s.id, capacidad: 20, ocupacion: 20 - hotelAvailable, disponible: hotelAvailable }));
      else if (url.pathname.includes('update_package/')) {
        captured = JSON.parse(request.postData());
        if (rejectSave) { status = 400; data = { detail: 'El cupo hotelero no puede ser menor a los pasajeros ya reservados' }; }
        else { pkg = { ...pkg, ...captured }; data = pkg; }
      } else if (url.pathname.includes('update_salida/')) {
        captured = JSON.parse(request.postData()); data = salidas[0];
      }
      return request.respond({ status, contentType: 'application/json', body: JSON.stringify(data) });
    });
    await page.goto(`${base}/paquetes/agregar-paquete?id=pkg`);
    await page.waitForSelector('input[aria-label="Nombre en sistema"]');
    const fields = await page.$$('input[aria-label^="Cupo hotelero"]');
    assert.equal(fields.length, 3);
    assert.equal(await page.$eval('input[aria-label="Nombre en sistema"]', e => e.value), 'Nombre interno');
    const destinationOptions = await page.$$eval('select', selects => Array.from(selects[0].options).map(o => o.textContent));
    assert.deepEqual(destinationOptions.slice(1), ['Ávila', 'bariloche', 'Zárate']);
    await page.$eval('input[aria-label="Nombre en sistema"]', e => e.select());
    await page.type('input[aria-label="Nombre en sistema"]', 'Interno QA');
    await fields[0].click({ clickCount: 3 });
    await fields[0].type('25');
    const output = path.resolve(__dirname, '../.next/capacity-qa');
    fs.mkdirSync(output, { recursive: true });
    await page.screenshot({ path: path.join(output, 'package-desktop.png'), fullPage: true });
    await page.$eval('form', form => form.requestSubmit());
    await page.waitForFunction(() => document.body.innerText.includes('no puede ser menor'));
    assert.equal(await page.$eval('input[aria-label="Nombre en sistema"]', e => e.value), 'Interno QA');
    assert.equal(captured.hotels[0].cupos[0].capacidad, 25);
    assert.equal(captured.hotels[0].suite, true);
    await page.setViewport({ width: 390, height: 844 });
    assert.ok(await page.$$eval('input[aria-label^="Cupo hotelero"]', inputs => inputs.every(input => input.getBoundingClientRect().right <= window.innerWidth)));
    await page.screenshot({ path: path.join(output, 'package-mobile.png'), fullPage: true });
    rejectSave = false;
    await page.$eval('form', form => form.requestSubmit());
    await page.waitForSelector('img[alt="Interno QA"]');
    assert.ok((await page.$eval('img[alt="Interno QA"]', e => e.src)).endsWith('/sin-imagen.svg'));
    await page.setViewport({ width: 1280, height: 1000 });
    await page.goto(`${base}/salidas/lista/s0`);
    await page.waitForSelector('[title="Horarios y Coordinador"]');
    await page.click('[title="Horarios y Coordinador"]');
    await page.waitForFunction(() => document.body.innerText.includes('Horarios y Coordinación'));
    const modalRows = await page.$$eval('tbody', tables => Array.from(tables).map(t => t.innerText));
    assert.ok(modalRows.some(text => text.includes('Liniers') && text.includes('Morón') && !text.includes('San Justo') && !text.includes('La Plata')));
    await page.screenshot({ path: path.join(output, 'schedules.png'), fullPage: true });
    const confirm = await page.$$('button');
    for (const button of confirm) if ((await button.evaluate(e => e.textContent)).trim() === 'Confirmar') await button.click();
    await page.waitForFunction(() => document.body.innerText.includes('Horarios y Coordinador actualizados'));
    assert.deepEqual(captured.cargas_ids, ['c0', 'c1', 'c2', 'c3']);
    assert.deepEqual(captured.horarios, ['08:00', '', '08:00', '08:00']);
    reservations[0].active = false;
    await page.goto(`${base}/salidas/lista/s0`);
    await page.waitForSelector('[title="Horarios y Coordinador"]');
    await page.click('[title="Horarios y Coordinador"]');
    await page.waitForFunction(() => document.body.innerText.includes('Sin pasajeros asignados a lugares de carga'));
    await page.goto(`${base}/web/reservas/crear-reserva/paso-2?destino=d1&paquete=pkg&salida=s0&tipo=tradicional`);
    await page.waitForFunction(() => Array.from(document.querySelectorAll('option')).some(o => o.textContent.includes('18 plazas disponibles')));
    assert.equal(await page.$eval('option[value="h1"]', e => e.disabled), false);
    hotelAvailable = 0;
    await page.reload();
    await page.waitForFunction(() => Array.from(document.querySelectorAll('option')).some(o => o.textContent.includes('0 plazas disponibles')));
    assert.equal(await page.$eval('option[value="h1"]', e => e.disabled), true);
    await page.goto(`${base}/web/reservas`);
    await page.waitForSelector('select[name="cliente"] option[value="cli1"]');
    const clientLabels = await page.$$eval('select[name="cliente"] option', options => options.map(o => o.textContent));
    assert.deepEqual(clientLabels.slice(1), ['Ángel', 'Zulma']);
    assert.deepEqual(errors, []);
    console.log('Browser QA passed: package fields, dates, sorting, save errors, card image/name, schedules and client sorting.');
    console.log(`Screenshots: ${output}`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
