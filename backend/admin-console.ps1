param(
    [string]$BaseUrl = "http://127.0.0.1:8000"
)

$ErrorActionPreference = "Stop"
$script:AdminToken = $null

function Invoke-AdminLogin {
    if ($script:AdminToken) {
        Write-Host "Already logged in. Log out before starting another session." -ForegroundColor Yellow
        return
    }

    $email = (Read-Host "Admin email (press Enter or type Q to cancel)").Trim()
    if ([string]::IsNullOrWhiteSpace($email) -or $email -eq "Q") {
        Write-Host "Login cancelled."
        return
    }

    $credential = Get-Credential `
        -UserName $email `
        -Message "Enter the admin password. Password input is hidden. Select Cancel to return to the menu."
    if ($null -eq $credential) {
        Write-Host "Login cancelled."
        return
    }

    $pointer = [IntPtr]::Zero
    try {
        $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($credential.Password)
        $password = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
        $body = @{
            email    = $email
            password = $password
        } | ConvertTo-Json

        $response = Invoke-RestMethod `
            -Method Post `
            -Uri "$BaseUrl/admin/login" `
            -ContentType "application/json" `
            -Body $body

        if (-not $response.success -or [string]::IsNullOrWhiteSpace($response.data.token)) {
            throw "Login response did not contain a valid token."
        }

        $script:AdminToken = $response.data.token
        Write-Host "Logged in as $($response.data.admin.email). Token expires at $($response.data.expires_at)." -ForegroundColor Green
        Write-Host "`nOpening admin dashboard..."
        Invoke-AdminDashboard
    }
    finally {
        if ($pointer -ne [IntPtr]::Zero) {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
        }

        $password = $null
        $body = $null
        $credential = $null
        $email = $null
    }
}

function Invoke-AdminDashboard {
    if (-not $script:AdminToken) {
        throw "Log in first."
    }

    $response = Invoke-RestMethod `
        -Method Get `
        -Uri "$BaseUrl/admin/dashboard" `
        -Headers @{ Authorization = ("Bear" + "er " + $script:AdminToken) }

    $response.data | ConvertTo-Json -Depth 8
}

function ConvertTo-PlainText {
    param([Security.SecureString]$Value)

    $pointer = [IntPtr]::Zero
    try {
        $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Value)
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    }
    finally {
        if ($pointer -ne [IntPtr]::Zero) {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
        }
    }
}

function Get-AdminAccount {
    if (-not $script:AdminToken) {
        throw "Log in first."
    }

    try {
        $response = Invoke-RestMethod `
            -Method Get `
            -Uri "$BaseUrl/admin/account" `
            -Headers @{ Authorization = ("Bear" + "er " + $script:AdminToken) }

        $response.data | ConvertTo-Json -Depth 4
    } catch {
        throw
    }
}

function Edit-AdminAccount {
    if (-not $script:AdminToken) {
        throw "Log in first."
    }

    $current = Invoke-RestMethod `
        -Method Get `
        -Uri "$BaseUrl/admin/account" `
        -Headers @{ Authorization = ("Bear" + "er " + $script:AdminToken) }
    $account = $current.data
    $updates = @{}

    Write-Host "`nAdmin account: $($account.name) <$($account.email)>"
    Write-Host "Press Enter to keep a value."
    $name = Read-Host "Admin name [$($account.name)]"
    if (-not [string]::IsNullOrWhiteSpace($name)) {
        $updates.name = $name.Trim()
    }

    $email = Read-Host "Admin email [$($account.email)]"
    if (-not [string]::IsNullOrWhiteSpace($email)) {
        $updates.email = $email.Trim()
    }

    $changePassword = Read-Host "Change password too? (Y/N)"
    $currentPassword = $null
    $newPassword = $null
    $passwordConfirmation = $null
    if ($changePassword -in @("Y", "y")) {
        $currentSecure = Read-Host "Current password" -AsSecureString
        $newSecure = Read-Host "New password (minimum 8 characters)" -AsSecureString
        $confirmationSecure = Read-Host "Confirm new password" -AsSecureString
        try {
            $currentPassword = ConvertTo-PlainText $currentSecure
            $newPassword = ConvertTo-PlainText $newSecure
            $passwordConfirmation = ConvertTo-PlainText $confirmationSecure
        }
        finally {
            $currentSecure.Dispose()
            $newSecure.Dispose()
            $confirmationSecure.Dispose()
        }

        if ($newPassword -cne $passwordConfirmation) {
            $currentPassword = $null
            $newPassword = $null
            $passwordConfirmation = $null
            throw "New password and confirmation do not match."
        }

        $updates.current_password = $currentPassword
        $updates.password = $newPassword
        $updates.password_confirmation = $passwordConfirmation
    }

    try {
        if ($updates.Count -eq 0) {
            Write-Host "No changes made."
            return
        }

        $confirmation = Read-Host "Save admin account changes? (Y/N)"
        if ($confirmation -notin @("Y", "y")) {
            Write-Host "Account update cancelled."
            return
        }

        $response = Invoke-RestMethod `
            -Method Patch `
            -Uri "$BaseUrl/admin/account" `
            -Headers @{ Authorization = ("Bear" + "er " + $script:AdminToken) } `
            -ContentType "application/json" `
            -Body ($updates | ConvertTo-Json)

        Write-Host "Admin account updated:" -ForegroundColor Green
        $response.data | ConvertTo-Json -Depth 4
    }
    finally {
        $currentPassword = $null
        $newPassword = $null
        $passwordConfirmation = $null
        $updates = $null
    }
}

function Get-CompanyContact {
    if (-not $script:AdminToken) {
        throw "Log in first."
    }

    try {
        $response = Invoke-RestMethod `
            -Method Get `
            -Uri "$BaseUrl/admin/company-contact" `
            -Headers @{ Authorization = ("Bear" + "er " + $script:AdminToken) }

        $response.data | ConvertTo-Json -Depth 4
    } catch {
        if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq 404) {
            Write-Host "Company WhatsApp contact is not set up yet. Choose 6 to set it up." -ForegroundColor Yellow
            return
        }

        throw
    }
}

function Edit-CompanyContact {
    if (-not $script:AdminToken) {
        throw "Log in first."
    }

    $isInitialSetup = $false
    try {
        $current = Invoke-RestMethod `
            -Method Get `
            -Uri "$BaseUrl/admin/company-contact" `
            -Headers @{ Authorization = ("Bear" + "er " + $script:AdminToken) }
        $number = $current.data.whatsapp_number
    } catch {
        if ($_.Exception.Response -and [int]$_.Exception.Response.StatusCode -eq 404) {
            $isInitialSetup = $true
            $number = $null
            Write-Host "Set up the company's WhatsApp contact. This is separate from your admin account." -ForegroundColor Yellow
        } else {
            throw
        }
    }

    $updates = @{}
    if ($isInitialSetup) {
        $companyName = (Read-Host "Company name (required for initial setup)").Trim()
        if ([string]::IsNullOrWhiteSpace($companyName)) {
            Write-Host "Setup cancelled; company name is required."
            return
        }
        $updates.company_name = $companyName
    } else {
        Write-Host "Current company WhatsApp number: $number"
    }

    $newNumber = Read-Host "Company WhatsApp number$(if ($number) { " [$number]" }) (type ! to clear)"
    if ($newNumber -eq "!") {
        if ($isInitialSetup) {
            Write-Host "A WhatsApp number is required for initial setup."
            return
        }
        $updates.whatsapp_number = $null
    } elseif (-not [string]::IsNullOrWhiteSpace($newNumber)) {
        $updates.whatsapp_number = $newNumber.Trim()
    } elseif ($isInitialSetup) {
        Write-Host "A WhatsApp number is required for initial setup."
        return
    } else {
        Write-Host "No changes made."
        return
    }

    $confirmation = Read-Host "Save company WhatsApp contact? (Y/N)"
    if ($confirmation -notin @("Y", "y")) {
        Write-Host "Company contact update cancelled."
        return
    }

    $response = Invoke-RestMethod `
        -Method Patch `
        -Uri "$BaseUrl/admin/company-contact" `
        -Headers @{ Authorization = ("Bear" + "er " + $script:AdminToken) } `
        -ContentType "application/json" `
        -Body ($updates | ConvertTo-Json)

    Write-Host "Company WhatsApp contact updated:" -ForegroundColor Green
    $response.data | ConvertTo-Json -Depth 4
}

function Invoke-AdminLogout {
    if (-not $script:AdminToken) {
        Write-Host "No active admin session."
        return
    }

    Invoke-RestMethod `
        -Method Post `
        -Uri "$BaseUrl/admin/logout" `
        -Headers @{ Authorization = ("Bear" + "er " + $script:AdminToken) } | Out-Null

    $script:AdminToken = $null
    Write-Host "Logged out. The bearer token was revoked." -ForegroundColor Green
}

Write-Host "Admin API: $BaseUrl"
while ($true) {
    Write-Host "`n1) Login  2) Dashboard  3) View admin account  4) Edit admin account  5) View company WhatsApp  6) Edit company WhatsApp  7) Logout  0) Exit"
    $choice = Read-Host "Choose an action"

    try {
        switch ($choice) {
            "1" { Invoke-AdminLogin }
            "2" { Invoke-AdminDashboard }
            "3" { Get-AdminAccount }
            "4" { Edit-AdminAccount }
            "5" { Get-CompanyContact }
            "6" { Edit-CompanyContact }
            "7" { Invoke-AdminLogout }
            "0" {
                if ($script:AdminToken) {
                    Invoke-AdminLogout
                }

                return
            }
            default { Write-Host "Choose 1, 2, 3, 4, 5, 6, 7, or 0." -ForegroundColor Yellow }
        }
    }
    catch {
        Write-Host "Request failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}
