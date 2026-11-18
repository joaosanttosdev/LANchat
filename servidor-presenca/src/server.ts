import { criarApp } from './app.js';

// Configuração por variáveis de ambiente, com valores padrão para desenvolvimento.
// HOST 127.0.0.1 = só aceita conexões do próprio computador (mais seguro enquanto
// estamos testando). Para outras máquinas acessarem, seria HOST=0.0.0.0 — mas isso
// fica para a Sprint 5, junto com o João.
const PORTA = Number(process.env.PORTA ?? 3000);
const HOST = process.env.HOST ?? '127.0.0.1';

if (!Number.isInteger(PORTA) || PORTA < 1 || PORTA > 65535) {
  console.error(`PORTA inválida: "${process.env.PORTA}". Use um número entre 1 e 65535.`);
  process.exit(1);
}

const app = criarApp();

try {
  await app.listen({ port: PORTA, host: HOST });
} catch (erro) {
  app.log.error(erro);
  process.exit(1);
}

// Desliga com calma quando apertam Ctrl+C (ou quando o systemd mandar parar).
for (const sinal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(sinal, async () => {
    app.log.info(`Recebido ${sinal}, desligando...`);
    await app.close();
    process.exit(0);
  });
}
