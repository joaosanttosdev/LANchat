import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Em ESM não existe __dirname pronto, então calculamos a partir do arquivo atual.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Quando rodamos "npm run dev", o Vite serve a interface neste endereço.
// No app empacotado essa variável não existe e carregamos o arquivo do build.
const URL_DEV = process.env.VITE_DEV_SERVER_URL;
const PASTA_INTERFACE = path.join(__dirname, '../dist');

function criarJanela(): void {
  const janela = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 600,
    minHeight: 400,
    title: 'LANcer Chat',
    // 🔒 SEGURANÇA — responsabilidade do João (CLAUDE.md, seção 4, regra 1).
    // Os valores abaixo são os padrões seguros do próprio Electron, escritos
    // aqui de forma explícita só para ninguém mudar sem perceber.
    // O preload.ts com contextBridge ainda NÃO existe: o João vai criar.
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  if (URL_DEV) {
    janela.loadURL(URL_DEV);
  } else {
    janela.loadFile(path.join(PASTA_INTERFACE, 'index.html'));
  }
}

app.whenReady().then(() => {
  criarJanela();

  // No macOS é comum reabrir a janela ao clicar no ícone. No Windows não faz
  // diferença, mas deixamos o comportamento padrão do Electron.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) criarJanela();
  });
});

// Fechou todas as janelas → encerra o app.
// (Na Sprint 7 isso muda: o app vai para a bandeja em vez de fechar.)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
