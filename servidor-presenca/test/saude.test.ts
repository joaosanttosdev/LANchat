import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarApp } from '../src/app.js';

test('GET /saude responde 200 com status ok', async () => {
  const app = criarApp({ log: false });

  // "inject" simula uma requisição sem abrir porta de verdade.
  const resposta = await app.inject({ method: 'GET', url: '/saude' });

  assert.equal(resposta.statusCode, 200);
  assert.deepEqual(resposta.json(), { status: 'ok' });

  await app.close();
});

test('rota que não existe responde 404', async () => {
  const app = criarApp({ log: false });

  const resposta = await app.inject({ method: 'GET', url: '/nao-existe' });

  assert.equal(resposta.statusCode, 404);

  await app.close();
});
