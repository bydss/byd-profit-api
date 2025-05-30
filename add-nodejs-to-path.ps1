$nodeJsPath = "C:\Program Files\nodejs"
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")

if (-not $currentPath.Contains($nodeJsPath)) {
    $newPath = $currentPath + ";" + $nodeJsPath
    [Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")
    Write-Host "Node.js path has been added to system PATH"
} else {
    Write-Host "Node.js path is already in system PATH"
}

# Refresh the current session's PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") 