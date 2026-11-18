<#
.SYNOPSIS
  Lado "servidor" do teste de rede do LANcer Chat (Sprint 0).

.DESCRIPTION
  Abre uma porta TCP e espera conexões. Para cada conexão, mostra quem
  conectou e responde "LANCER-OK <nome-do-computador>".
  Rode este script numa máquina e o testar.ps1 na outra.
  Para parar, aperte Ctrl+C.

.EXAMPLE
  .\escutar.ps1
  .\escutar.ps1 -Porta 50600
#>
param(
  [int]$Porta = 50505,
  # Any = aceita conexões de outras máquinas. Use 127.0.0.1 para testar só no próprio PC.
  [string]$Endereco = 'Any'
)

$ErrorActionPreference = 'Stop'

if ($Endereco -eq 'Any') {
  $ip = [System.Net.IPAddress]::Any
} else {
  $ip = [System.Net.IPAddress]::Parse($Endereco)
}

$ouvinte = New-Object System.Net.Sockets.TcpListener($ip, $Porta)

try {
  $ouvinte.Start()
} catch {
  Write-Host "Não consegui abrir a porta $Porta. Talvez outro programa já esteja usando." -ForegroundColor Red
  Write-Host "Tente outra porta: .\escutar.ps1 -Porta 50600"
  exit 1
}

Write-Host ""
Write-Host "=== LANcer Chat - teste de rede (lado que ESCUTA) ===" -ForegroundColor Cyan
Write-Host "Computador: $env:COMPUTERNAME"
Write-Host "Porta:      $Porta"
Write-Host "IPs desta máquina (passe um deles para quem vai testar):"
Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -ne '127.0.0.1' -and $_.PrefixOrigin -ne 'WellKnown' } |
  ForEach-Object { Write-Host "  - $($_.IPAddress)  ($($_.InterfaceAlias))" }
Write-Host ""
Write-Host "Esperando conexões... (Ctrl+C para parar)" -ForegroundColor Yellow

try {
  while ($true) {
    # Pending() + pausa curta, em vez de esperar travado, para o Ctrl+C funcionar.
    if (-not $ouvinte.Pending()) {
      Start-Sleep -Milliseconds 200
      continue
    }

    $cliente = $ouvinte.AcceptTcpClient()
    $origem = $cliente.Client.RemoteEndPoint.ToString()
    $hora = Get-Date -Format 'HH:mm:ss'

    try {
      $fluxo = $cliente.GetStream()
      $fluxo.ReadTimeout = 5000
      $leitor = New-Object System.IO.StreamReader($fluxo)
      $escritor = New-Object System.IO.StreamWriter($fluxo)
      $escritor.NewLine = "`n"
      $escritor.AutoFlush = $true

      $linha = $null
      try { $linha = $leitor.ReadLine() } catch { }

      if ($linha) {
        Write-Host "[$hora] Conexão de $origem -> recebi: $linha" -ForegroundColor Green
        $escritor.WriteLine("LANCER-OK $env:COMPUTERNAME")
      } else {
        # O Test-NetConnection só abre e fecha a conexão, sem mandar nada.
        Write-Host "[$hora] Conexão de $origem (só verificou a porta)" -ForegroundColor Green
      }
    } finally {
      $cliente.Close()
    }
  }
} finally {
  $ouvinte.Stop()
  Write-Host "Porta $Porta fechada."
}
