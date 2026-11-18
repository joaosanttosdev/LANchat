import Fastify, { type FastifyInstance } from 'fastify';

/**
 * Monta o servidor com as rotas, mas NÃO começa a escutar a porta.
 *
 * Separar "montar" de "escutar" deixa a gente testar as rotas
 * sem abrir porta nenhuma (veja test/saude.test.ts).
 */
export function criarApp(opcoes: { log?: boolean } = {}): FastifyInstance {
  const app = Fastify({ logger: opcoes.log ?? true });

  // Rota de teste: serve só para saber se o servidor está de pé.
  // Exemplo: GET http://localhost:3000/saude  →  { "status": "ok" }
  app.get('/saude', async () => {
    return { status: 'ok' };
  });

  return app;
}
