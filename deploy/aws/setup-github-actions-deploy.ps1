param(
  [string]$Region = 'us-east-1',
  [string]$Repo = 'FlomadLabsRD/hephaestus-international',
  [string]$RoleName = 'hephaestus-international-github-actions-deploy',
  [string]$AppName = 'hephaestus-international'
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false

$ScriptRoot = $PSScriptRoot
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $ScriptRoot)
$TrustPolicyPath = Join-Path $ScriptRoot 'github-actions-oidc-trust-policy.json'
$InlinePolicyPath = Join-Path $ScriptRoot 'github-actions-inline-policy.json'
$EnvPath = Join-Path $ProjectRoot 'frontend/.env.production.local'
if (-not (Test-Path $EnvPath)) { $EnvPath = Join-Path $ProjectRoot 'frontend/.env.local' }
if (-not (Test-Path $EnvPath)) { throw 'Missing frontend/.env.production.local or frontend/.env.local for bootstrap.' }

function Get-EnvMap {
  param([string]$Path)
  $map = [ordered]@{}
  foreach ($line in Get-Content $Path) {
    $trimmed = $line.Trim()
    if (-not $trimmed -or $trimmed.StartsWith('#')) { continue }
    if ($trimmed -match '^([A-Z0-9_]+)=(.*)$') {
      $key = $Matches[1]
      $value = $Matches[2].Trim()
      if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
        $value = $value.Substring(1, $value.Length - 2)
      }
      $map[$key] = $value
    }
  }
  return $map
}

$envMap = Get-EnvMap -Path $EnvPath
$AccountId = (aws sts get-caller-identity --query Account --output text --region $Region).Trim()
$OidcProviderArn = "arn:aws:iam::${AccountId}:oidc-provider/token.actions.githubusercontent.com"
$RoleArn = "arn:aws:iam::${AccountId}:role/${RoleName}"

$requiredSecrets = [ordered]@{
  AUTH_SECRET = [string]$envMap['AUTH_SECRET']
  OPENAI_API_KEY = [string]$envMap['OPENAI_API_KEY']
  APP_RUNNER_SERVICE_ARN = [string]$envMap['APP_RUNNER_SERVICE_ARN']
  APP_RUNNER_URL = [string]$envMap['APP_RUNNER_URL']
  APP_RUNNER_ECR_ACCESS_ROLE_ARN = [string]$envMap['APP_RUNNER_ECR_ACCESS_ROLE_ARN']
  VPC_CONNECTOR_ARN = [string]$envMap['VPC_CONNECTOR_ARN']
}

$missing = @($requiredSecrets.GetEnumerator() | Where-Object { [string]::IsNullOrWhiteSpace($_.Value) } | ForEach-Object { $_.Key })
if ($missing.Count -gt 0) {
  throw "Missing values for required GitHub secrets: $($missing -join ', ')"
}

$oidcProvider = aws iam list-open-id-connect-providers --query "OpenIDConnectProviderList[?Arn=='$OidcProviderArn'].Arn | [0]" --output text --region $Region
if (-not $oidcProvider -or $oidcProvider -eq 'None') {
  aws iam create-open-id-connect-provider `
    --url https://token.actions.githubusercontent.com `
    --client-id-list sts.amazonaws.com `
    --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 `
    --region $Region | Out-Null
}

$trustDoc = (Get-Content $TrustPolicyPath -Raw).Replace('975049954782', $AccountId)
Set-Content -Path $TrustPolicyPath -Value $trustDoc -Encoding ascii

$inlineDoc = (Get-Content $InlinePolicyPath -Raw).Replace('975049954782', $AccountId)
Set-Content -Path $InlinePolicyPath -Value $inlineDoc -Encoding ascii

$existingRole = aws iam get-role --role-name $RoleName --region $Region 2>$null
if ($LASTEXITCODE -ne 0) {
  aws iam create-role --role-name $RoleName --assume-role-policy-document "file://$TrustPolicyPath" --region $Region | Out-Null
} else {
  aws iam update-assume-role-policy --role-name $RoleName --policy-document "file://$TrustPolicyPath" --region $Region | Out-Null
}

aws iam put-role-policy --role-name $RoleName --policy-name github-actions-hephaestus-deploy --policy-document "file://$InlinePolicyPath" --region $Region | Out-Null

# Role ARN itself is consumed by the workflow.
$requiredSecrets['GITHUB_ACTIONS_DEPLOY_ROLE_ARN'] = $RoleArn

foreach ($entry in $requiredSecrets.GetEnumerator()) {
  $entry.Value | gh secret set $entry.Key --repo $Repo --body - | Out-Null
}

$ssmPrefix = "/$AppName"
if (-not [string]::IsNullOrWhiteSpace([string]$envMap['CHRONOS_SYNC_API_URL'])) {
  & aws ssm put-parameter --name "$ssmPrefix/CHRONOS_SYNC_API_URL" --type SecureString --value ([string]$envMap['CHRONOS_SYNC_API_URL']) --overwrite --region $Region | Out-Null
}
if (-not [string]::IsNullOrWhiteSpace([string]$envMap['CHRONOS_SYNC_TOKEN'])) {
  & aws ssm put-parameter --name "$ssmPrefix/CHRONOS_SYNC_TOKEN" --type SecureString --value ([string]$envMap['CHRONOS_SYNC_TOKEN']) --overwrite --region $Region | Out-Null
}
if (-not [string]::IsNullOrWhiteSpace([string]$envMap['CONTENT_STRAPI_URL'])) {
  & aws ssm put-parameter --name "$ssmPrefix/CONTENT_STRAPI_URL" --type SecureString --value ([string]$envMap['CONTENT_STRAPI_URL']) --overwrite --region $Region | Out-Null
}
if (-not [string]::IsNullOrWhiteSpace([string]$envMap['STRAPI_API_TOKEN'])) {
  & aws ssm put-parameter --name "$ssmPrefix/STRAPI_API_TOKEN" --type SecureString --value ([string]$envMap['STRAPI_API_TOKEN']) --overwrite --region $Region | Out-Null
}

Write-Host "GitHub Actions AWS deploy bootstrap ready for $AppName." -ForegroundColor Green
Write-Host "Role ARN: $RoleArn"
Write-Host "Repo secrets updated for $Repo"
