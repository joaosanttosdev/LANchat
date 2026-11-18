# Teste de rede ADM ↔ ACD (Sprint 0)

Objetivo: confirmar que um computador da rede **ADM** consegue abrir uma conexão TCP
com um computador da rede **ACD**, e vice-versa. É o que o LANcer Chat vai fazer para
mandar mensagens direto de um computador para o outro.

## Do que você precisa

- Uma máquina da **ADM** e uma da **ACD**, cada uma com esta pasta copiada
  (pendrive, pasta de rede ou `git clone`).
- PowerShell (já vem no Windows). Não precisa instalar nada.

## Passo a passo

### 1. Na máquina A (a que vai ESCUTAR)

Abra o PowerShell nesta pasta e rode:

```powershell
powershell -ExecutionPolicy Bypass -File .\escutar.ps1
```

> O `-ExecutionPolicy Bypass` libera a execução **só deste script, só desta vez**.
> Não muda nenhuma configuração do computador.

O script mostra os **IPs da máquina**. Anote o IP da rede cabeada (ADM ou ACD).

⚠️ **Se aparecer um aviso do Firewall do Windows pedindo permissão, NÃO clique em
"Permitir" sozinho.** Mexer no firewall é com o João. Clique em "Cancelar" e chame ele.

### 2. Na máquina B (a que vai TESTAR)

Abra o PowerShell nesta pasta e rode, trocando pelo IP anotado:

```powershell
powershell -ExecutionPolicy Bypass -File .\testar.ps1 -Ip 10.0.1.23
```

No fim aparece **RESULTADO: PASSOU** ou **RESULTADO: FALHOU**.

### 3. Agora ao contrário

Repita trocando os papéis: B escuta e A testa. **Precisa funcionar nos dois sentidos**,
porque no chat qualquer um dos dois pode abrir a conversa.

### 4. Para encerrar

Na máquina que está escutando, aperte **Ctrl+C**. A porta é fechada na hora.

## Testar só no seu computador (para ver como funciona)

Em dois PowerShells, um em cada:

```powershell
powershell -ExecutionPolicy Bypass -File .\escutar.ps1 -Endereco 127.0.0.1
```

```powershell
powershell -ExecutionPolicy Bypass -File .\testar.ps1 -Ip 127.0.0.1
```

Usando `127.0.0.1` a conexão não sai do computador, então o firewall não pergunta nada.

## Anote os resultados

Preencha e coloque no Pull Request (ou mande para o João):

| Escuta (máquina / rede / IP) | Testa (máquina / rede / IP) | Porta | Resultado |
|---|---|---|---|
|   |   | 50505 |   |
|   |   | 50505 |   |

## Se falhar

| O que apareceu | O que provavelmente é |
|---|---|
| Passo 1 falhou, mas o ping funcionou | Firewall do Windows bloqueando a porta do outro lado, ou o `escutar.ps1` parado |
| Nem o ping funcionou | IP errado, ou não existe rota entre as redes (ou só o ping está bloqueado) |
| Passo 1 passou, passo 2 falhou | Algo no meio da rede deixou abrir a conexão, mas não deixou os dados passarem |
| Funciona no cabo, falha no Wi-Fi | Isolamento de clientes no Wi-Fi (CLAUDE.md, seção 7) |

Em qualquer falha: anote a mensagem e mostre para o João.
