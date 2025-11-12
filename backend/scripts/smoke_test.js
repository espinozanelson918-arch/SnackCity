const base = 'http://localhost:3000';

async function req(path, opts) {
  try {
    const res = await fetch(base + path, opts);
    const text = await res.text();
    console.log('\n===', opts && opts.method ? opts.method : 'GET', path, '=>', res.status);
    try { console.log(JSON.stringify(JSON.parse(text), null, 2)); }
    catch (e) { console.log(text); }
  } catch (err) {
    console.error('ERROR', path, err.message);
  }
}

(async () => {
  await req('/api/productos');

  await req('/api/productos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'SmokeTest-Cola', tipo: 'refresco', presentacion: 'lata', precio: 1.23, stock: 10 })
  });

  await req('/api/productos');

  await req('/api/usuarios');

  await req('/api/usuarios', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre: 'Smoke Tester', email: 'smoke@example.com', sucursal: 'Managua', rol: 'CEO' })
  });

  await req('/api/usuarios/rol/ceo');
})();