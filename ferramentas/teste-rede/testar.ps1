<#
.SYNOPSIS
  Lado "cliente" do teste de rede do LANcer Chat (Sprint 0).

.DESCRIPTION
  Conecta na máquina que está rodando o escutar.ps1 e faz duas verificações:
    1. Test-NetConnection: a porta TCP está acessível?
    2. Troca de mensagem: manda uma linha e espera a resposta "LANCER-OK".
  Se as duas passarem, a conversa direta entre essas duas máquinas deve funcionar.

.EXAMPLE
  .\testar.ps1 -Ip 10.0.1.23
  .\testar.ps1 -Ip 10.0.1.23 -Porta 50600
#>
param(
  [Parameter(Mandatory = $true)]
  [string]$Ip,
  [int]$Porta = 50505,
  [int]$TempoLimiteMs = 5000
)

Write-Host ""
Write-Host "=== LANcer Chat - teste de rede (lado que TESTA) ===" -ForegroundColor Cyan
Write-Host "Daqui:      $env:COMPUTERNAME"
Write-Host "Para:       ${Ip}:$Porta"
Write-Host ""

# ── 1. Porta acessível? ──
Write-Host "1) Verificando a porta com Test-NetConnection..."
$resultado = Test-NetConnection -ComputerName $Ip -Port $Porta -WarningAction SilentlyContinue
$portaOk = $resultado.TcpTestSucceeded

if ($portaOk) {
  Write-Host "   OK: a porta $Porta respondeu." -ForegroundColor Green
} else {
  Write-Host "   FALHOU: a porta $Porta não respondeu." -ForegroundColor Red
  if ($resultado.PingSucceeded) {
    Write-Host "   O ping funcionou, então a máquina existe. Causas prováveis:"
    Write-Host "     - o escutar.ps1 não está rodando do outro lado, ou está em outra porta;"
    Write-Host "     - o firewall do Windows do outro lado está bloqueando (chame o João)."
  } else {
    Write-Host "   Nem o ping funcionou (alguns firewalls bloqueiam ping, então não é certeza)."
    Write-Host "   Confira se o IP está certo e se o escutar.ps1 está rodando."
  }
}

# ── 2. Troca de mensagem de verdade ──
$trocaOk = $false
if ($portaOk) {
  Write-Host ""
  Write-Host "2) Mandando uma mensagem de teste..."
  $cliente = New-Object System.Net.Sockets.TcpClient
  try {
    $conectou = $cliente.ConnectAsync($Ip, $Porta).Wait($TempoLimiteMs)
    if (-not $conectou) { throw "tempo esgotado ao conectar" }

    $fluxo = $cliente.GetStream()
    $fluxo.ReadTimeout = $TempoLimiteMs
    $escritor = New-Object System.IO.StreamWriter($fluxo)
    $escritor.NewLine = "`n"
    $escritor.AutoFlush = $true
    $leitor = New-Object System.IO.StreamReader($fluxo)

    $escritor.WriteLine("LANCER-TESTE $env:COMPUTERNAME")
    $resposta = $leitor.ReadLine()

    if ($resposta -like 'LANCER-OK*') {
      Write-Host "   OK: resposta recebida: $resposta" -ForegroundColor Green
      $trocaOk = $true
    } else {
      Write-Host "   FALHOU: resposta inesperada: '$resposta'" -ForegroundColor Red
    }
  } catch {
    Write-Host "   FALHOU: $($_.Exception.GetBaseException().Message)" -ForegroundColor Red
  } finally {
    $cliente.Close()
  }
}

# ── Resultado ──
Write-Host ""
if ($portaOk -and $trocaOk) {
  Write-Host "RESULTADO: PASSOU. As duas máquinas conseguem conversar por TCP." -ForegroundColor Green
  exit 0
} else {
  Write-Host "RESULTADO: FALHOU. Anote a mensagem acima e mostre para o João." -ForegroundColor Red
  exit 1
}
