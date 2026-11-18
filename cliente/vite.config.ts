import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';

// O Vite cuida de duas coisas ao mesmo tempo:
// 1. A interface (React, pasta src/) → vai para dist/
// 2. O processo principal do Electron (electron/main.ts) → vai para dist-electron/
// No "npm run dev", o plugin compila o main e abre o Electron sozinho.
export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.ts',
        // Por padrão o plugin abre o Electron com "--no-sandbox", o que desliga
        // uma proteção do Chromium. Abrimos sem essa opção, igual ao app final.
        onstart({ startup }) {
          startup(['.']);
        },
      },
      // 🔒 O preload (electron/preload.ts) será adicionado pelo João,
      // junto com a configuração de segurança da janela.
    }),
  ],
});
