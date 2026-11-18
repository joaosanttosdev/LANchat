# LAN Chat — README

> **Projeto:** LAN Chat  
> **Tipo:** Aplicação de comunicação instantânea P2P  
> **Ambiente:** Rede local corporativa (LAN)  
> **Plataforma:** Desktop Windows  
> **Arquitetura:** Peer-to-Peer descentralizada  
> **Status:** Planejamento / Desenvolvimento

---

## 1. Visão geral

O LAN Chat é uma aplicação de comunicação instantânea desenvolvida para funcionar dentro de uma rede local, permitindo que computadores conectados à mesma infraestrutura de rede troquem mensagens diretamente, sem depender de um servidor central.

Cada computador que executa a aplicação funciona simultaneamente como cliente e servidor, podendo descobrir outros dispositivos, estabelecer conexões, enviar e receber mensagens.

A proposta é oferecer uma alternativa simples, leve e independente de serviços externos para comunicação interna entre colaboradores de uma organização.

### 1.1 Objetivos principais

- Comunicação direta entre computadores da rede local.
- Descoberta automática de usuários online.
- Envio e recebimento de mensagens em tempo real.
- Histórico de conversas armazenado localmente.
- Suporte a conversas individuais.
- Suporte futuro a grupos e transferência de arquivos.
- Funcionamento sem servidor central.
- Segurança na comunicação entre dispositivos.
- Distribuição através de instalador para Windows.

### 1.2 Premissas arquiteturais

O projeto seguirá inicialmente uma arquitetura P2P pura.

Isso significa que:

- Não haverá API central.
- Não haverá banco de dados compartilhado.
- Não haverá servidor responsável por armazenar todas as mensagens.
- Cada instalação possuirá seu próprio banco de dados.
- A comunicação ocorrerá diretamente entre os dispositivos.

**Importante:** essa arquitetura possui limitações. Não existe entrega offline garantida quando o destinatário está desligado. A fila local consegue armazenar mensagens para novas tentativas, mas não existe um intermediário que faça a entrega enquanto o remetente também estiver offline.

---

## 2. Stack tecnológica

A stack será baseada em TypeScript e Node.js, utilizando Electron como plataforma desktop.

A escolha busca manter o desenvolvimento concentrado em um único ecossistema tecnológico, facilitando manutenção, compartilhamento de tipos e evolução do projeto.

| Camada              | Tecnologia          | Responsabilidade                |
| ------------------- | ------------------- | ------------------------------- |
| Desktop             | Electron            | Aplicação desktop               |
| Linguagem           | TypeScript          | Linguagem principal             |
| Frontend            | React               | Interface gráfica               |
| Build frontend      | Vite                | Desenvolvimento e build         |
| Comunicação interna | IPC / contextBridge | Comunicação entre processos     |
| Discovery           | Node.js dgram       | Descoberta via UDP              |
| Transporte          | Node.js net         | Comunicação TCP entre peers     |
| Persistência        | SQLite              | Histórico e fila de mensagens   |
| Driver SQLite       | better-sqlite3      | Acesso ao banco                 |
| Criptografia        | libsodium-wrappers  | Criptografia entre dispositivos |
| Identificação       | UUID / Ed25519      | Identidade dos dispositivos     |
| Configurações       | electron-store      | Configurações locais            |
| Empacotamento       | electron-builder    | Geração do instalador           |

### 2.1 Electron

O Electron será responsável por fornecer a infraestrutura desktop.

A aplicação será dividida em três partes:

- Main Process: executa a lógica de negócio, comunicação de rede e persistência.
- Renderer Process: apresenta a interface gráfica.
- Preload: disponibiliza funcionalidades específicas do Main Process para a interface através de uma API controlada.

O Electron foi escolhido pela possibilidade de utilizar Node.js diretamente, evitando desenvolver um backend separado em outra linguagem.

### 2.2 TypeScript

Toda a aplicação deverá utilizar TypeScript.

Além de oferecer tipagem estática, permite compartilhar contratos de mensagens, interfaces e estruturas de dados entre os diferentes módulos.

Recomenda-se manter os contratos de comunicação em uma camada compartilhada.

### 2.3 React + Vite

Responsáveis pela interface gráfica.

A interface deverá apresentar:

- Lista de usuários disponíveis.
- Indicadores de presença.
- Lista de conversas.
- Histórico de mensagens.
- Campo de envio de mensagens.
- Informações básicas do usuário.

A interface não deverá possuir acesso direto a sockets, banco de dados ou funcionalidades sensíveis do sistema operacional.

### 2.4 Node.js dgram — descoberta de dispositivos

O módulo `dgram` será utilizado para comunicação UDP.

Cada instalação deverá anunciar periodicamente sua presença na rede local.

A mensagem de descoberta deverá conter informações como:

- Identificador único do dispositivo.
- Nome de exibição.
- Porta TCP utilizada.
- Estado de presença.

Os dispositivos que receberem esses anúncios deverão atualizar sua lista local de peers.

### 2.5 Node.js net — comunicação entre peers

O módulo `net` será responsável pela comunicação TCP.

Cada dispositivo deverá manter um servidor TCP local e também atuar como cliente, conectando-se diretamente aos demais dispositivos.

O TCP será utilizado para:

- Envio de mensagens.
- Recebimento de mensagens.
- Confirmação de entrega.
- Comunicação de eventos.
- Futuramente, transferência de arquivos.

Deverá existir um protocolo de comunicação bem definido entre os dispositivos.

### 2.6 SQLite

O SQLite será o banco de dados local de cada instalação.

Não haverá compartilhamento do arquivo de banco entre máquinas.

O banco deverá armazenar:

- Conversas.
- Mensagens.
- Identificadores dos dispositivos.
- Estado de entrega das mensagens.
- Fila de mensagens pendentes.
- Configurações persistentes necessárias.

Recomenda-se utilizar o modo WAL (`Write-Ahead Logging`) para melhorar o comportamento de leitura e escrita simultâneas.

### 2.7 libsodium

A comunicação entre dispositivos deverá ser protegida criptograficamente.

A biblioteca libsodium será utilizada para implementar criptografia e autenticação das mensagens.

Cada instalação deverá possuir sua própria identidade criptográfica.

Requisitos:

- Geração de chaves na primeira execução.
- Identificação baseada na chave pública.
- Criptografia das mensagens.
- Verificação da identidade do remetente.
- Mecanismo TOFU (Trust On First Use).
- Aviso quando uma chave previamente conhecida for alterada.

---

## 3. Arquitetura da aplicação

Cada computador executará uma instância independente do LAN Chat.

```text
LAN CHAT
│
├── Renderer Process
│   ├── Interface React
│   ├── Lista de usuários
│   ├── Conversas
│   └── Histórico visual
│
├── Preload
│   ├── contextBridge
│   └── API IPC controlada
│
└── Main Process
    │
    ├── Discovery
    │   └── UDP Broadcast
    │
    ├── Peer Server
    │   └── TCP Server
    │
    ├── Peer Client
    │   └── TCP Connections
    │
    ├── Presence
    │   └── Estado dos usuários online
    │
    ├── Messaging
    │   ├── Envio
    │   ├── Recebimento
    │   └── ACK
    │
    ├── Outbox
    │   └── Mensagens pendentes
    │
    ├── Security
    │   └── Criptografia
    │
    └── Storage
        └── SQLite
```

### 3.1 Separação de responsabilidades

Uma regra importante do projeto:

**Toda a comunicação de rede e acesso ao banco deverá permanecer no Main Process.**

O Renderer deverá ser responsável exclusivamente pela apresentação e interação do usuário.

A comunicação entre ambos ocorrerá através de IPC, utilizando `contextBridge`.

Configurações obrigatórias do Electron:

- `nodeIntegration: false`
- `contextIsolation: true`
- `sandbox: true`, quando compatível com a implementação.
- Validação dos canais IPC.
- Validação de todos os dados recebidos da rede.

Essa separação reduz a superfície de ataque e impede que a interface tenha acesso irrestrito ao sistema operacional.

---

## 4. Gerenciamento de presença e cache

O projeto utilizará memória RAM e SQLite, cada um com responsabilidades diferentes.

Não existe necessidade de Redis ou outro serviço externo de cache.

### 4.1 Dados armazenados em memória

| Informação       | Estrutura       | Motivo                  |
| ---------------- | --------------- | ----------------------- |
| Usuários online  | Map             | Atualização frequente   |
| Último heartbeat | Timestamp       | Controle de expiração   |
| Conexões TCP     | Map             | Reutilização de sockets |
| Estado digitando | Memória         | Informação temporária   |
| Conversa aberta  | Estado do React | Interface               |

A lista de usuários online deverá utilizar TTL (Time To Live).

Sugestão inicial:

- Heartbeat: 5 segundos.
- Expiração: 15 segundos.
- Atualização da interface: conforme mudanças de presença.

Esses valores deverão ser ajustados durante os testes.

### 4.2 Dados persistidos no SQLite

| Informação             | Persistência                   |
| ---------------------- | ------------------------------ |
| Histórico de mensagens | SQLite                         |
| Conversas              | SQLite                         |
| Outbox                 | SQLite                         |
| Identidade local       | SQLite ou armazenamento seguro |
| Chaves criptográficas  | Armazenamento seguro           |
| Configurações          | electron-store                 |

A Outbox deverá sobreviver ao encerramento inesperado da aplicação.

A interface deverá carregar inicialmente as últimas 50 mensagens e permitir paginação para consultar mensagens antigas.

---

## 5. Protocolo de comunicação

As mensagens deverão possuir uma estrutura padronizada.

Exemplo conceitual:

```typescript
type Message = {
  id: string;
  from: string;
  to: string;
  type: "text" | "file" | "ack" | "typing";
  body: string;
  timestamp: number;
};
```

### 5.1 Identificação

Cada mensagem deverá possuir um identificador único.

Recomenda-se utilizar ULID ou UUID.

O identificador será importante para:

- Evitar mensagens duplicadas.
- Confirmar recebimento.
- Identificar mensagens pendentes.
- Controlar novas tentativas de envio.

### 5.2 ACK — confirmação de recebimento

O destinatário deverá enviar uma confirmação ao receber e processar uma mensagem.

Fluxo:

1. Usuário A envia uma mensagem.
2. A registra a mensagem na Outbox.
3. A transmite a mensagem para B.
4. B valida e persiste a mensagem.
5. B responde com ACK.
6. A recebe o ACK e atualiza o estado da mensagem.

O ACK deverá ser enviado somente depois da persistência bem-sucedida no banco de dados do destinatário.

### 5.3 Outbox

A Outbox será responsável por armazenar mensagens que ainda não possuem confirmação de recebimento.

Quando um dispositivo voltar a ficar disponível, a aplicação deverá tentar entregar as mensagens pendentes.

É importante implementar idempotência no recebimento para que uma retransmissão não gere mensagens duplicadas.

### 5.4 Framing TCP

O TCP trabalha com fluxo contínuo de bytes, não com mensagens individuais.

Portanto, será necessário implementar um mecanismo de delimitação das mensagens.

Alternativas:

- JSON delimitado por newline.
- Prefixo de tamanho antes do conteúdo.

Outra possibilidade é utilizar WebSocket entre os peers, que já oferece enquadramento das mensagens.

A decisão deverá ser tomada antes da implementação definitiva do protocolo.

---

## 6. Segurança

A rede local não deve ser considerada confiável.

O projeto deverá implementar mecanismos básicos de segurança desde as primeiras versões.

### Requisitos

1. Cada instalação gera uma identidade criptográfica.
2. O identificador do peer é associado à sua chave pública.
3. As mensagens são autenticadas e criptografadas.
4. A identidade dos dispositivos conhecidos é armazenada localmente.
5. Mudanças inesperadas de chave geram alertas.
6. Conteúdos recebidos são validados antes do processamento.
7. Mensagens nunca devem ser renderizadas como HTML não confiável.

A implementação deverá utilizar primitivas criptográficas estabelecidas, evitando desenvolver algoritmos próprios.

Também deverá existir um mecanismo seguro para armazenar as chaves privadas no sistema operacional.

---

## 7. Limitações da infraestrutura corporativa

O funcionamento do LAN Chat dependerá das configurações da rede.

### 7.1 VLANs e sub-redes

O UDP Broadcast normalmente não atravessa roteadores.

Se a infraestrutura possuir VLANs separadas, a descoberta automática poderá funcionar somente dentro da mesma sub-rede.

Possíveis soluções futuras:

- Multicast com configuração de infraestrutura.
- Cadastro manual de peers.
- Descoberta por unicast em sub-redes configuradas.
- Evolução para arquitetura híbrida.

### 7.2 Firewall do Windows

O Windows Defender Firewall poderá bloquear as conexões recebidas.

Será necessário disponibilizar uma regra de firewall para a porta TCP e para a comunicação UDP.

Em um ambiente corporativo, recomenda-se distribuir as regras através de GPO.

### 7.3 Wi-Fi corporativo

Algumas redes possuem isolamento de clientes.

Quando isso acontece, os dispositivos conectados ao mesmo Wi-Fi podem não conseguir estabelecer comunicação direta.

Esse comportamento deverá ser verificado durante os testes.

### 7.4 DHCP

Os endereços IP poderão mudar.

Portanto, o IP não deverá ser utilizado como identificador permanente do usuário.

Cada instalação deverá possuir um identificador independente do endereço de rede.

---

# 8. Planejamento de desenvolvimento — Sprints

O desenvolvimento será dividido em sprints incrementais.

A recomendação é trabalhar com ciclos de aproximadamente uma semana, ajustando o prazo conforme a disponibilidade do desenvolvedor.

Cada sprint deverá produzir uma entrega funcional e testável.

---

## Sprint 01 — Fundação do projeto

**Objetivo:** preparar o ambiente e estabelecer a estrutura inicial da aplicação.

### Atividades

- Inicializar projeto Electron.
- Configurar TypeScript.
- Configurar React e Vite.
- Configurar ESLint e Prettier.
- Configurar estrutura de diretórios.
- Configurar comunicação IPC.
- Criar o Preload.
- Configurar `contextIsolation`.
- Configurar `nodeIntegration: false`.
- Criar uma interface inicial.
- Configurar scripts de desenvolvimento e build.

### Entregáveis

- Aplicação Electron executando.
- Interface React renderizada.
- Comunicação IPC funcional.
- Estrutura inicial organizada.

### Critérios de aceite

- Aplicação inicia sem erros.
- Renderer não possui acesso direto ao Node.
- Main e Renderer conseguem trocar informações através do IPC.
- Projeto possui comandos padronizados de execução e build.

---

## Sprint 02 — Identidade e descoberta de dispositivos

**Objetivo:** permitir que diferentes computadores encontrem automaticamente uns aos outros.

### Atividades

- Implementar geração de UUID.
- Criar módulo de identidade local.
- Implementar servidor UDP.
- Implementar envio de Broadcast.
- Implementar recebimento de anúncios.
- Criar gerenciamento de peers.
- Implementar heartbeat.
- Implementar TTL.
- Implementar evento de saída.
- Integrar presença com a interface.

### Entregáveis

Uma lista de usuários conectados à rede local, atualizada automaticamente.

### Critérios de aceite

- Dois computadores conseguem se descobrir.
- O nome e identificador dos dispositivos são exibidos.
- Usuários desaparecem da lista após expiração do TTL.
- A interface atualiza a presença sem precisar reiniciar.
- O dispositivo não identifica a si próprio como outro peer.

---

## Sprint 03 — Comunicação TCP entre dispositivos

**Objetivo:** estabelecer comunicação direta entre duas instalações.

### Atividades

- Implementar Peer Server.
- Implementar Peer Client.
- Definir porta de comunicação.
- Implementar framing TCP.
- Definir protocolo de mensagens.
- Implementar conexão e desconexão.
- Implementar tratamento de erros.
- Implementar timeout.
- Implementar reutilização de conexões.

### Entregáveis

Dois computadores capazes de estabelecer conexões TCP e trocar mensagens estruturadas.

### Critérios de aceite

- A consegue conectar diretamente a B.
- B consegue receber dados enviados por A.
- A aplicação consegue detectar desconexões.
- O protocolo consegue identificar mensagens completas.
- Erros de conexão não encerram a aplicação.

---

## Sprint 04 — Mensagens individuais e ACK

**Objetivo:** implementar o primeiro fluxo real de comunicação.

### Atividades

- Criar serviço de mensagens.
- Implementar envio de texto.
- Implementar recebimento de texto.
- Implementar identificadores únicos.
- Implementar ACK.
- Implementar estados de envio.
- Implementar controle de mensagens duplicadas.
- Integrar envio e recebimento com a interface.

### Entregáveis

Chat individual funcional entre dois computadores.

### Critérios de aceite

- Usuário consegue enviar mensagens.
- Destinatário recebe a mensagem em tempo real.
- Mensagens possuem identificadores únicos.
- Remetente recebe confirmação de recebimento.
- Mensagens não são duplicadas em retransmissões.

---

## Sprint 05 — Persistência local e histórico

**Objetivo:** garantir que as conversas permaneçam disponíveis após fechar a aplicação.

### Atividades

- Integrar SQLite.
- Configurar better-sqlite3.
- Criar migrations.
- Criar tabela de conversas.
- Criar tabela de mensagens.
- Implementar repositórios.
- Implementar persistência de mensagens enviadas.
- Implementar persistência de mensagens recebidas.
- Configurar WAL.
- Implementar carregamento do histórico.
- Implementar paginação.

### Entregáveis

Histórico de mensagens persistente em cada computador.

### Critérios de aceite

- Mensagens permanecem após reinicialização.
- Conversas podem ser recuperadas.
- Mensagens são ordenadas corretamente.
- Histórico não precisa ser carregado integralmente.
- Falhas de persistência são tratadas.

---

## Sprint 06 — Outbox e recuperação de mensagens

**Objetivo:** evitar perda de mensagens quando um destinatário estiver temporariamente indisponível.

### Atividades

- Criar tabela de Outbox.
- Persistir mensagens pendentes.
- Implementar tentativas de reenvio.
- Integrar reenvio com presença.
- Implementar atualização do estado de entrega.
- Implementar idempotência.
- Implementar tratamento de falhas.

### Entregáveis

Sistema de entrega com tentativas automáticas.

### Critérios de aceite

- Mensagens pendentes sobrevivem ao fechamento do aplicativo.
- A aplicação tenta reenviar quando o destinatário retorna.
- Mensagens confirmadas são removidas ou marcadas como entregues.
- Retransmissões não geram duplicidade.

**Limitação:** a entrega depende de pelo menos um dispositivo remetente manter a mensagem pendente até o destinatário retornar. Não existe armazenamento central.

---

## Sprint 07 — Segurança e criptografia

**Objetivo:** proteger a comunicação entre os dispositivos.

### Atividades

- Integrar libsodium.
- Gerar chaves por instalação.
- Associar identidade à chave pública
