# LANcer Chat

Chat interno para os funcionários da **UGV**, desenvolvido pelo **NTI**.

> **Status:** Sprint 0 (preparação) · **Plataforma:** Windows (desktop)

As mensagens vão **direto de um computador para o outro**, cifradas. Um servidor pequeno
só diz quem está online e onde encontrar cada pessoa; ele **nunca** vê nem guarda o
conteúdo das conversas.

---

## Como funciona

O LANcer Chat é **híbrido**:

```text
            ┌──────────────────────────────┐
            │  Servidor de presença (OCS)  │   "lista telefônica":
            │  quem está online + IP:porta │   não guarda conversas
            └──────────────────────────────┘
                 ▲ WSS                ▲ WSS
                 │                    │
        ┌────────┴───────┐    ┌───────┴────────┐
        │  PC na rede    │    │  PC na rede    │
        │  ADM           │◄──►│  ACD           │
        └────────────────┘    └────────────────┘
          mensagens e arquivos direto, por TCP, cifrados
```

**Por que não P2P puro?** A UGV tem duas sub-redes, **ADM** (administrativa) e **ACD**
(acadêmica). A descoberta automática por broadcast UDP não passa de uma sub-rede para a
outra. O servidor OCS é visível pelas duas, então ele faz a apresentação entre os
computadores. Existe rota TCP entre ADM e ACD, então a conversa direta funciona.

**Limitação aceita:** o servidor não guarda mensagens. Se o destinatário estiver offline,
a mensagem fica esperando no computador de quem enviou e só é entregue quando **os dois**
estiverem online ao mesmo tempo.

---

## Stack

| Parte | Tecnologias |
|---|---|
| App (cliente) | Electron, TypeScript, React, Vite |
| Rede entre computadores | Node `net` (TCP), um JSON por linha |
| Conexão com o servidor | WebSocket seguro (WSS) com certificado fixado |
| Banco local | SQLite (`better-sqlite3`) |
| Criptografia | `libsodium-wrappers` (Ed25519, X25519, `crypto_box`) |
| Chave privada | `safeStorage` do Electron (cofre do Windows) |
| Servidor de presença | Fastify, `@fastify/websocket`, SQLite |
| Instalador | `electron-builder` |

---

## Estrutura do repositório

```text
LANchat/
├── cliente/              # app Electron (o que vai instalado em cada PC)
│   ├── electron/         # processo principal: rede, disco, criptografia
│   └── src/              # interface React (sem acesso ao Node)
├── servidor-presenca/    # servidor de presença que roda no OCS
├── shared/
│   └── protocol.ts       # contrato: formato de todas as mensagens
├── ferramentas/
│   └── teste-rede/       # scripts do teste de rota TCP entre ADM e ACD
└── README.md
```

---

## Como rodar (desenvolvimento)

Precisa do **Node.js 20 ou mais novo**. Não instale nada global: cada pasta tem as suas
dependências.

### Servidor de presença

```powershell
cd servidor-presenca
npm install
npm run dev
```

Abra http://localhost:3000/saude no navegador. Deve aparecer `{"status":"ok"}`.

| Comando | O que faz |
|---|---|
| `npm run dev` | Roda e reinicia sozinho quando um arquivo muda |
| `npm test` | Roda os testes automáticos |
| `npm run build` | Compila para `dist/` |
| `npm start` | Roda a versão compilada |

Variáveis de ambiente: `PORTA` (padrão `3000`) e `HOST` (padrão `127.0.0.1`).

### App (cliente)

```powershell
cd cliente
npm install
npm run dev
```

Abre a janela do LANcer Chat. Na primeira vez demora um pouco mais, porque o Electron
baixa o programa dele.

| Comando | O que faz |
|---|---|
| `npm run dev` | Abre o app e atualiza a tela sozinho quando um arquivo muda |
| `npm run typecheck` | Confere os tipos do TypeScript |
| `npm run build` | Gera o build em `dist/` e `dist-electron/` |
| `npm start` | Abre o app a partir do build |

**Duas instâncias no mesmo PC** (a partir da Sprint 1): cada uma precisa de pasta de dados
e porta próprias, definidas pelas variáveis `LANCER_PASTA_DADOS`, `LANCER_PORTA` e
`LANCER_SERVIDOR_URL`.

### Teste de rede ADM ↔ ACD

Veja o passo a passo em [`ferramentas/teste-rede/LEIAME.md`](ferramentas/teste-rede/LEIAME.md).

---

## Segurança (resumo)

- A interface **não** acessa rede, disco ou Node diretamente: só por IPC, via `preload.ts`.
- Cada instalação tem um **par de chaves Ed25519**. O id do usuário é o hash da chave
  pública. O **IP nunca é identidade**.
- A chave privada fica no **cofre do Windows**, nunca em texto puro.
- Mensagens são **cifradas** de ponta a ponta. Se a chave de um contato mudar, o app avisa.
- Um nome só aparece na lista depois de **aprovado por um admin**.
- Mensagem recebida nunca é exibida como HTML.

O formato de todas as mensagens está em [`shared/protocol.ts`](shared/protocol.ts).

---

## Roteiro

| Sprint | Entrega | Situação |
|---|---|---|
| 0 | Preparação: app, servidor mínimo, protocolo, teste de rede | Em andamento |
| 1 | Quem está online: identidade, servidor de presença, lista ao vivo | — |
| 2 | Mandar mensagem: TCP entre peers, ACK, conversa 1:1 | — |
| 3 | Histórico e outbox: SQLite, reenvio quando a pessoa volta | — |
| 4 | Segurança: handshake, cifragem, TOFU, WSS, aprovação de cadastro | — |
| 5 | Ir para o OCS: deploy isolado no servidor de produção | — |
| 6 | Grupos e arquivos | — |
| 7 | Acabamento: notificações, bandeja, painel admin, instalador `.exe` | — |

**Fora do MVP, para depois:** relay opcional para entrega offline, descoberta por mDNS
dentro da mesma sub-rede, login pelo AD e mais de um dispositivo por usuário.

---

## Como contribuir

- **Uma branch por tarefa** (ex.: `sprint1-lista-online`), commits pequenos.
- Todo código entra por **Pull Request**, revisado pelo **João** (NTI).
- Tarefas marcadas com 🔒 (segurança, rede, servidor de produção) ficam com o João.
- O `shared/protocol.ts` só muda com o OK do João.
- **Nada é executado no servidor OCS** sem o João junto.
