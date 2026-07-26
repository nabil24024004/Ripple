[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime
Add-Type -AssemblyName System.Drawing

$asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { 
    $_.Name -eq 'AsTask' -and $_.IsGenericMethodDefinition -and $_.GetGenericArguments().Count -eq 1 -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name.StartsWith('IAsyncOperation') 
}[0]

function Await-Operation($asyncOp, $type) {
    if (-not $asyncOp) { return $null }
    try {
        $task = $asTaskGeneric.MakeGenericMethod($type).Invoke($null, @($asyncOp))
        $task.Wait()
        return $task.Result
    } catch {
        return $null
    }
}

$mgrType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]
$propsType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties, Windows.Media.Control, ContentType = WindowsRuntime]
$inputInterface = [Windows.Storage.Streams.IInputStream, Windows.Storage.Streams, ContentType = WindowsRuntime]

$asyncOp = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]::RequestAsync()
$manager = Await-Operation $asyncOp $mgrType

if ($manager) {
    $session = $manager.GetCurrentSession()
    if ($session) {
        $propsOp = $session.TryGetMediaPropertiesAsync()
        $props = Await-Operation $propsOp $propsType
        $artwork = ""
        if ($props -and $props.Thumbnail) {
            try {
                $thumbOp = $props.Thumbnail.OpenReadAsync()
                $inputStream = Await-Operation $thumbOp $inputInterface
                if ($inputStream) {
                    $netStream = [System.IO.WindowsRuntimeStreamExtensions]::AsStreamForRead($inputStream)
                    $mem = New-Object System.IO.MemoryStream
                    $netStream.CopyTo($mem)
                    $bytes = $mem.ToArray()
                    if ($bytes.Length -gt 0) {
                        $artwork = "data:image/png;base64," + [Convert]::ToBase64String($bytes)
                        Write-Host "SUCCESS! Artwork Base64 Length:" $artwork.Length
                    }
                }
            } catch {
                Write-Host "Error:" $_.Exception.Message
            }
        }
        
        # App Icon fallback if artwork is empty
        if (-not $artwork -and $session.SourceAppUserModelId) {
            Write-Host "SourceAppUserModelId:" $session.SourceAppUserModelId
        }
    }
}
