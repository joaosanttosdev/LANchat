/**
 * LANcer Chat — Protocolo (RASCUNHO, aguardando aprovação do João)
 *
 * Este arquivo é o CONTRATO entre as partes do sistema:
 *   - cliente ↔ servidor de presença (WebSocket, JSON)
 *   - cliente ↔ cliente (TCP, um JSON por linha)
 *
 * Regra do projeto: só muda com o OK do João.
 *
 * Aqui só existem TIPOS e CONSTANTES. Nada de lógica e nada de validação:
 * a validação dos dados recebidos da rede é uma tarefa 🔒 separada.
 *
 * Itens marcados com "PROPOSTA" não estão no CLAUDE.md e precisam de decisão.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Versão
// ─────────────────────────────────────────────────────────────────────────────

/** Versão deste protocolo. Aumenta quando uma mudança quebra a compatibilidade. */
export const VERSAO_PROTOCOLO = 1;

// ─────────────────────────────────────────────────────────────────────────────
// Tipos básicos
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Texto em base64 (padrão, com "=" no final quando necessário).
 * Usado para tudo que é binário: chaves, nonces, assinaturas, conteúdo cifrado.
 */
export type Base64 = string;

/**
 * Identidade de um peer.
 * = crypto_generichash(TAMANHO_ID_BYTES, chavePublicaEd25519), em hexadecimal minúsculo.
 * Com 16 bytes, o id tem 32 caracteres. Exemplo: "3f9a0c...e1" (32 chars).
 *
 * O IP NUNCA é identidade: ele é só o "endereço atual" do peer.
 */
export type PeerId = string;

/** ID de mensagem: ULID (26 caracteres, ordenável por tempo). */
export type MensagemId = string;

/** Momento no tempo em milissegundos desde 1970 (o que Date.now() devolve). */
export type Timestamp = number;

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

/** Bytes do hash usado como id do peer (crypto_generichash). */
export const TAMANHO_ID_BYTES = 16;

/** Caracteres do id em hexadecimal (2 por byte). */
export const TAMANHO_ID_HEX = TAMANHO_ID_BYTES * 2;

/** PROPOSTA: bytes do nonce aleatório do desafio e do handshake. */
export const TAMANHO_NONCE_BYTES = 32;

/** O cliente manda "ping" para o servidor a cada X ms. */
export const INTERVALO_PING_MS = 20_000;

/** O servidor tira da lista quem ficar X ms sem mandar ping. */
export const TTL_PRESENCA_MS = 30_000;

/** PROPOSTA: tamanho máximo de uma mensagem WebSocket (vira o maxPayload). */
export const TAMANHO_MAX_WS_BYTES = 64 * 1024;

/** PROPOSTA: tamanho máximo de uma linha TCP entre peers (proteção de memória). */
export const TAMANHO_MAX_LINHA_TCP_BYTES = 256 * 1024;

/** PROPOSTA: tamanho máximo do nome de exibição, em caracteres. */
export const TAMANHO_MAX_NOME = 64;

/**
 * PROPOSTA (🔒 decisão do João): "rótulos" assinados junto com o nonce.
 *
 * Problema: a mesma chave assina o desafio do servidor E o handshake com
 * outros peers. Sem rótulo, um peer malicioso poderia repassar o nonce do
 * servidor como se fosse o nonce do handshake, pegar a assinatura da vítima
 * e usá-la para entrar no servidor como se fosse ela.
 *
 * Com rótulo, cada lugar assina "rótulo + nonce", e uma assinatura feita
 * para um lugar não vale no outro.
 */
export const ROTULO_ASSINATURA_PRESENCA = 'lancer-presenca-v1';
export const ROTULO_ASSINATURA_HANDSHAKE = 'lancer-handshake-v1';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Cliente ↔ servidor de presença (WebSocket seguro, JSON)
// ─────────────────────────────────────────────────────────────────────────────

/** Servidor → cliente, logo ao conectar. */
export type Desafio = {
  tipo: 'desafio';
  /** Bytes aleatórios que o cliente precisa assinar. */
  nonce: Base64;
};

/** Cliente → servidor: prova que é dono da chave. */
export type Hello = {
  tipo: 'hello';
  id: PeerId;
  /** Nome de exibição. Só aparece na lista depois de aprovado por um admin. */
  nome: string;
  /** Porta TCP em que este cliente escuta outros peers. */
  porta: number;
  /** Chave pública Ed25519 (32 bytes). */
  chavePublica: Base64;
  /** Assinatura Ed25519 (64 bytes) do nonce do Desafio. */
  assinatura: Base64;
};

/** Situação do cadastro nome ↔ chave no servidor. */
export type EstadoCadastro = 'pendente' | 'aprovado' | 'bloqueado';

/** Servidor → cliente: situação do cadastro, logo depois do hello aceito. */
export type StatusCadastro = {
  tipo: 'status_cadastro';
  estado: EstadoCadastro;
};

/** Cliente → servidor, a cada INTERVALO_PING_MS. */
export type Ping = {
  tipo: 'ping';
};

/** Um peer na lista de quem está online. */
export type PeerOnline = {
  id: PeerId;
  nome: string;
  /** IP que o SERVIDOR viu na conexão (nunca o que o cliente informou). */
  ip: string;
  porta: number;
};

/** Servidor → cliente, sempre que a lista muda. Só contém peers aprovados. */
export type ListaPeers = {
  tipo: 'lista_peers';
  peers: PeerOnline[];
};

/** Tudo o que o servidor pode mandar para o cliente. */
export type MensagemDoServidor = Desafio | StatusCadastro | ListaPeers;

/** Tudo o que o cliente pode mandar para o servidor. */
export type MensagemDoCliente = Hello | Ping;

// ─────────────────────────────────────────────────────────────────────────────
// 2. Peer ↔ peer (TCP, um JSON por linha terminada em "\n")
// ─────────────────────────────────────────────────────────────────────────────

/** Caractere que separa um JSON do outro na conexão TCP. */
export const DELIMITADOR_TCP = '\n';

// ── Handshake (🔒) ──

/** Passo 1: cada lado se apresenta assim que a conexão abre. */
export type Oi = {
  tipo: 'oi';
  id: PeerId;
  chavePublica: Base64;
  /** Bytes aleatórios que o OUTRO lado precisa assinar. */
  nonce: Base64;
};

/**
 * PROPOSTA de nome: passo 2 do handshake (o CLAUDE.md não dá nome a ele).
 * Cada lado devolve a assinatura do nonce que recebeu no "oi" do outro.
 */
export type ProvaOi = {
  tipo: 'prova';
  assinatura: Base64;
};

// ── Mensagens da conversa ──

export type TipoMensagem = 'texto' | 'arquivo' | 'ack' | 'digitando';

/**
 * Uma mensagem entre dois peers.
 *
 * Significado do `corpo` em cada tipo (PROPOSTA):
 *   - 'texto':     o texto (cifrado em base64 a partir da Sprint 4)
 *   - 'arquivo':   metadados do arquivo (formato definido na Sprint 6)
 *   - 'ack':       o `id` da mensagem que está sendo confirmada
 *   - 'digitando': vazio ("")
 *
 * 'ack' e 'digitando' são efêmeros: não vão para a outbox nem para o histórico.
 */
export type Mensagem = {
  id: MensagemId;
  /** id do remetente. */
  de: PeerId;
  /** id do peer de destino ou do grupo. */
  para: string;
  tipo: TipoMensagem;
  corpo: string;
  ts: Timestamp;
};

/** Tudo o que pode passar numa conexão TCP entre peers. */
export type QuadroPeer = Oi | ProvaOi | Mensagem;
