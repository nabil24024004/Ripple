"use strict";const{app:u,BrowserWindow:E,screen:T,ipcMain:l,shell:W,Tray:U,Menu:L,nativeImage:j,clipboard:P}=require("electron"),f=require("node:path"),m=require("fs"),M=require("os");process.platform==="linux"&&(u.commandLine.appendSwitch("enable-transparent-visuals"),u.commandLine.appendSwitch("disable-gpu-compositing"),u.disableHardwareAcceleration());let b=null,a=null;function B(){try{return f.join(u.getPath("userData"),"ripple-island.log")}catch{return f.join(process.cwd(),"ripple-island.log")}}function y(e,n=null){const s=`[${new Date().toISOString()}] ${e}${n?` | Error: ${n.stack||n}`:""}
`;console.log(s.trim());try{const i=B();m.appendFileSync(i,s,"utf8")}catch{}}process.on("uncaughtException",e=>{y("UNCAUGHT EXCEPTION (Main Process)",e)});process.on("unhandledRejection",e=>{y("UNHANDLED REJECTION (Main Process)",e)});const{exec:c,execFile:h,spawn:C}=require("child_process");function I(e){return Buffer.from(e,"utf16le").toString("base64")}function q(){return new Promise(e=>{const t=Buffer.from(`
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$shell   = New-Object -ComObject WScript.Shell
$dirs    = @("$env:ProgramData\\Microsoft\\Windows\\Start Menu\\Programs","$env:APPDATA\\Microsoft\\Windows\\Start Menu\\Programs")
$results = [System.Collections.Generic.List[object]]::new()
foreach ($dir in $dirs) {
  if (-not (Test-Path $dir)) { continue }
  Get-ChildItem $dir -Recurse -Filter '*.lnk' -EA SilentlyContinue | ForEach-Object {
    try {
      $target = $shell.CreateShortcut($_.FullName).TargetPath
      if ($target -and $target.EndsWith('.exe') -and
          $target -notlike '*\\\\explorer.exe' -and
          $target -notmatch 'WindowsApps' -and
          (Test-Path $target -EA SilentlyContinue)) {
        $results.Add([PSCustomObject]@{ name = $_.BaseName; type = 'win32'; path = $target })
      }
    } catch {}
  }
}
@($results) | ConvertTo-Json -Compress -Depth 2
`,"utf16le").toString("base64");c(`powershell -NoProfile -EncodedCommand ${t}`,{maxBuffer:5*1024*1024},(s,i)=>{if(s||!i)return e([]);try{const o=JSON.parse(i.trim());e(Array.isArray(o)?o:o?[o]:[])}catch{e([])}})})}function J(){return new Promise(e=>{const t=Buffer.from(`
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$results = [System.Collections.Generic.List[object]]::new()
Get-StartApps -EA SilentlyContinue | ForEach-Object {
  if ($_.AppID -match '.+!.+') {
    $results.Add([PSCustomObject]@{ name = $_.Name; type = 'uwp'; appId = $_.AppID })
  }
}
@($results) | ConvertTo-Json -Compress -Depth 2
`,"utf16le").toString("base64");c(`powershell -NoProfile -EncodedCommand ${t}`,{maxBuffer:2*1024*1024},(s,i)=>{if(s||!i)return e([]);try{const o=JSON.parse(i.trim());e(Array.isArray(o)?o:o?[o]:[])}catch{e([])}})})}async function K(){const[e,n]=await Promise.all([q(),J()]),t=new Set,s=[];for(const i of[...e,...n]){if(!i.name||!(i.path||i.appId))continue;const o=i.type==="uwp"?`shell:AppsFolder\\${i.appId}`:i.path,r=o.toLowerCase();t.has(r)||(t.add(r),s.push({name:i.name,launch:o}))}return s.sort((i,o)=>i.name.localeCompare(o.name))}function k(e){const n=[];let t=0;for(;t<e.length;){for(;t<e.length&&/\s/.test(e[t]);)t++;if(t>=e.length)break;let s="";for(;t<e.length&&!/\s/.test(e[t]);)if(e[t]==='"'){for(t++;t<e.length&&e[t]!=='"';)s+=e[t++];t<e.length&&t++}else s+=e[t++];s&&n.push(s)}return n}function H(e){const n=e.replace(/\//g,"\\").replace(/%([^%]+)%/g,(o,r)=>process.env[r]||`%${r}%`),t=n.match(/^"([^"]+)"(.*)/);if(t)return{exe:t[1],args:t[2].trim()?k(t[2].trim()):[]};const s=n.match(/^(.+?\.(?:exe|cmd|bat|com|ps1))(?:\s+(.*))?$/i);if(s)return{exe:s[1],args:s[2]?k(s[2]):[]};const i=n.search(/\s/);return i===-1?{exe:n,args:[]}:{exe:n.slice(0,i),args:k(n.slice(i+1).trim())}}function V(e){const n=e.trim();if(n.startsWith("shell:")){const t=n.replace(/'/g,"''");c(`powershell -NoProfile -WindowStyle Hidden -Command "Start-Process '${t}'"`);return}if(/[\\\/]/.test(n)){const{exe:t,args:s}=H(n);if(s.length===0){if(t.toLowerCase().endsWith(".url")){try{const p=m.readFileSync(t,"utf8").match(/^URL=(.+)$/im);p&&W.openExternal(p[1].trim())}catch{}return}W.openPath(t).then(r=>{r&&c(`start "" "${t}"`)});return}const i=/[\\/]/.test(t)&&!/\.[^\\.]+$/.test(t)?t+".exe":t;if(/\.(cmd|bat)$/i.test(i)){const r=C("cmd.exe",["/c",i,...s],{shell:!1,detached:!0,stdio:"ignore"});r.on("error",()=>{}),r.unref();return}if(/\.ps1$/i.test(i)){const r=C("powershell.exe",["-NoProfile","-ExecutionPolicy","Bypass","-File",i,...s],{shell:!1,detached:!0,stdio:"ignore"});r.on("error",()=>{}),r.unref();return}const o=C(i,s,{shell:!1,detached:!0,stdio:"ignore"});o.on("error",()=>{}),o.unref();return}if(n.includes(" ")){const t=n.replace(/'/g,"''");c(`powershell -NoProfile -WindowStyle Hidden -Command "Start-Process '${t}'"`)}else c(`start "" ${n}`)}l.handle("log-message",(e,n,t,s)=>{y(`[RENDERER ${String(n).toUpperCase()}] ${t} ${s?JSON.stringify(s):""}`)});l.handle("set-ignore-mouse-events",(e,n,t)=>{if(a&&!a.isDestroyed())try{if(process.platform!=="linux"){const s=t!==void 0?t:n;a.setIgnoreMouseEvents(n,{forward:s}),y(`setIgnoreMouseEvents(${n}, forward=${s}) executed`)}else a.setIgnoreMouseEvents(n),y(`setIgnoreMouseEvents(${n}) executed (linux)`)}catch(s){y("Error in setIgnoreMouseEvents, falling back to forward=true",s);try{a.setIgnoreMouseEvents(!0,{forward:!0})}catch{}}});l.handle("focus-window",()=>{a&&a.focus()});l.handle("open-external",async(e,n)=>{await W.openExternal(n)});l.handle("launch-app",async(e,n)=>{const t=process.platform;t==="darwin"?c(`open -a "${n}"`):t==="win32"?V(n):c(n)});l.handle("build-app-cache",async()=>{if(process.platform!=="win32")return;const e=f.join(u.getPath("userData"),"app-cache.json");try{const n=await K();m.writeFileSync(e,JSON.stringify(n))}catch{}});l.handle("search-apps",async(e,n)=>{if(process.platform!=="win32"||!n)return[];const t=f.join(u.getPath("userData"),"app-cache.json");try{if(!m.existsSync(t))return[];const s=JSON.parse(m.readFileSync(t,"utf8")),i=n.toLowerCase();return s.filter(o=>o.name&&o.name.toLowerCase().includes(i)).slice(0,8)}catch{return[]}});l.handle("get-displays",()=>T.getAllDisplays().map(n=>({id:n.id,label:n.label||`Display ${n.id}`,bounds:n.bounds})));l.handle("set-display",(e,n)=>{if(a){const s=T.getAllDisplays().find(d=>d.id.toString()===n.toString())||T.getPrimaryDisplay(),{x:i,y:o,width:r,height:p}=s.bounds;process.platform,a.setBounds({x:i,y:o,width:r,height:p}),a.show()}});l.handle("update-window-position",(e,n,t)=>{});l.handle("set-auto-launch",(e,n)=>{if(process.platform==="linux"){const t=f.join(u.getPath("home"),".config","autostart"),s=f.join(t,"ripple.desktop");try{if(n){m.existsSync(t)||m.mkdirSync(t,{recursive:!0});const i=`[Desktop Entry]
Type=Application
Version=1.0
Name=Ripple
Comment=Ripple Desktop Assistant
Exec="${u.getPath("exe")}"
Icon=${x()}
Terminal=false
`;m.writeFileSync(s,i)}else m.existsSync(s)&&m.unlinkSync(s)}catch(i){console.error("Failed to set auto-launch on Linux:",i)}}else if(process.platform==="win32")try{u.setLoginItemSettings({openAtLogin:n,path:u.getPath("exe")})}catch(t){console.error("Failed to set login item settings on Windows:",t)}});const x=()=>{const e="png";if(u.isPackaged){const n=f.join(process.resourcesPath,`icon.${e}`),t=f.join(process.resourcesPath,`assets/icons/icon.${e}`);return m.existsSync(n)?n:m.existsSync(t)?t:n}return f.join(__dirname,`../../src/assets/icons/icon.${e}`)},v=()=>{const e=T.getPrimaryDisplay(),{x:n,y:t,width:s,height:i}=e.bounds,o=process.platform==="linux",r=process.platform==="win32",p=process.platform==="darwin",d=s,$=i,g=n,G=t,F=r?"toolbar":"panel";a=new E({width:d,height:$,x:g,y:G,backgroundColor:"#00000000",transparent:!0,alwaysOnTop:!0,resizable:!1,frame:!1,...r?{thickFrame:!1}:{},hasShadow:!1,skipTaskbar:!0,icon:x(),...p?{hiddenInMissionControl:!0}:{},type:F,fullscreen:!1,visibleOnFullScreen:!0,acceptFirstMouse:!0,webPreferences:{preload:f.join(__dirname,"preload.js"),devTools:!0},show:!0}),o?a.setIgnoreMouseEvents(!0):a.setIgnoreMouseEvents(!0,{forward:!0});const _=o?500:0;a.once("ready-to-show",()=>{setTimeout(()=>{a&&(a.show(),o?a.setAlwaysOnTop(!0,"screen-saver"):a.setAlwaysOnTop(!0,"pop-up-menu"),a.focus())},_)}),setTimeout(()=>{a&&!a.isVisible()&&(a.show(),a.focus())},5e3),a.on("closed",()=>{a=null});try{a.setVisibleOnAllWorkspaces(!0,{visibleOnFullScreen:!0})}catch{}if(!u.isPackaged||process.env.NODE_ENV==="development")a.loadURL("http://localhost:5173");else{const O=f.join(__dirname,"../renderer/main_window/index.html");a.loadFile(O)}};u.whenReady().then(()=>{process.platform==="darwin"&&u.dock.hide(),v(),Y(),X(),u.on("activate",()=>{E.getAllWindows().length===0&&v()});try{const e=x(),t=j.createFromPath(e).resize({width:16,height:16});b=new U(t);const s=L.buildFromTemplate([{label:"Show/Hide Ripple",click:()=>{a&&(a.isVisible()?a.hide():a.show())}},{type:"separator"},{label:"Quit",click:()=>{u.quit()}}]);b.setToolTip("Ripple"),b.setContextMenu(s)}catch(e){console.error("Failed to create tray:",e)}});const R=f.join(u.getPath("userData"),"get-media.ps1"),Z=`[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
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

function Get-AppIconBase64($appId) {
    try {
        $proc = $null
        if ($appId) {
            $cleanName = $appId.Split('!')[-1].Replace('.exe','')
            $proc = Get-Process | Where-Object { $_.ProcessName -eq $cleanName -or $cleanName -like "*$($_.ProcessName)*" } | Select-Object -First 1
        }
        if (-not $proc) {
            $proc = Get-Process | Where-Object { $_.MainWindowTitle -and ($_.ProcessName -match "chrome|msedge|brave|firefox|spotify|vlc|music") } | Select-Object -First 1
        }
        if ($proc) {
            $path = $proc.MainModule.FileName
            if ($path) {
                $icon = [System.Drawing.Icon]::ExtractAssociatedIcon($path)
                if ($icon) {
                    $bmp = $icon.ToBitmap()
                    $ms = New-Object System.IO.MemoryStream
                    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
                    $bytes = $ms.ToArray()
                    $ms.Close()
                    $bmp.Dispose()
                    $icon.Dispose()
                    if ($bytes.Length -gt 0) {
                        return "data:image/png;base64," + [Convert]::ToBase64String($bytes)
                    }
                }
            }
        }
    } catch {}
    return ""
}

$inputInterface = [Windows.Storage.Streams.IInputStream, Windows.Storage.Streams, ContentType = WindowsRuntime]
$asStreamMethod = [System.IO.WindowsRuntimeStreamExtensions].GetMethod('AsStreamForRead', [type[]]@($inputInterface))

$mgrType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]
$propsType = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties, Windows.Media.Control, ContentType = WindowsRuntime]
$streamType = [Windows.Storage.Streams.IRandomAccessStreamWithContentType, Windows.Storage.Streams, ContentType = WindowsRuntime]
$streamRefType = [Windows.Storage.Streams.IRandomAccessStream, Windows.Storage.Streams, ContentType = WindowsRuntime]

$asyncOp = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime]::RequestAsync()
$manager = Await-Operation $asyncOp $mgrType

if ($manager) {
    $session = $manager.GetCurrentSession()
    if (-not $session) {
        $sessions = $manager.GetSessions()
        if ($sessions -and $sessions.Count -gt 0) {
            $session = $sessions | Where-Object { $_.GetPlaybackInfo().PlaybackStatus -eq [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionPlaybackStatus]::Playing } | Select-Object -First 1
            if (-not $session) { $session = $sessions[0] }
        }
    }
    if ($session) {
        $propsOp = $session.TryGetMediaPropertiesAsync()
        $props = Await-Operation $propsOp $propsType
        $playback = $session.GetPlaybackInfo()
        $status = if ($playback) { $playback.PlaybackStatus.ToString().ToLower() } else { "stopped" }

        $timeline = $session.GetTimelineProperties()
        $basePos = if ($timeline -and $timeline.Position) { $timeline.Position.TotalSeconds } else { 0 }
        if ($status -eq "playing" -and $timeline -and $timeline.LastUpdatedTime) {
            $elapsed = ([DateTimeOffset]::UtcNow - $timeline.LastUpdatedTime).TotalSeconds
            if ($elapsed -gt 0 -and $elapsed -lt 86400) {
                $basePos += $elapsed
            }
        }
        $duration = if ($timeline -and $timeline.EndTime) { [math]::Round($timeline.EndTime.TotalSeconds) } else { 0 }
        if ($duration -gt 0 -and $basePos -gt $duration) { $basePos = $duration }
        $position = [math]::Round($basePos)

        $sourceApp = $session.SourceAppUserModelId
        $artwork = ""

        if ($props -and $props.Thumbnail) {
            try {
                $thumbOp = $props.Thumbnail.OpenReadAsync()
                $stream = Await-Operation $thumbOp $streamType
                if (-not $stream) {
                    $stream = Await-Operation $thumbOp $streamRefType
                }
                if ($stream) {
                    $netStream = $asStreamMethod.Invoke($null, @($stream))
                    if ($netStream) {
                        $mem = New-Object System.IO.MemoryStream
                        $netStream.CopyTo($mem)
                        $bytes = $mem.ToArray()
                        $mem.Close()
                        if ($bytes.Length -gt 0) {
                            $artwork = "data:image/png;base64," + [Convert]::ToBase64String($bytes)
                        }
                    }
                }
            } catch {}
        }

        if (-not $artwork) {
            $artwork = Get-AppIconBase64 $sourceApp
        }

        $info = @{
            Title = if ($props) { $props.Title } else { "" }
            Artist = if ($props) { $props.Artist } else { "" }
            Album = if ($props) { $props.AlbumTitle } else { "" }
            Status = $status
            Source = $sourceApp
            Artwork = $artwork
            Position = $position
            Duration = $duration
        }
        $info | ConvertTo-Json -Compress
        exit
    }
}
Write-Output "null"
`;try{m.writeFileSync(R,Z,"utf8")}catch(e){console.error("Failed to write get-media.ps1 script:",e)}l.handle("get-system-media",async()=>new Promise(e=>{const n=process.platform;n==="darwin"?h("osascript",["-e",`
        tell application "System Events"
            set spotifyRunning to (name of every process) contains "Spotify"
            set musicRunning to (name of every process) contains "Music"
        end tell
        if spotifyRunning then
            tell application "Spotify"
                if player state is playing then
                    set trackName to name of current track
                    set artistName to artist of current track
                    set albumName to album of current track
                    set artworkUrl to artwork url of current track
                    set playerState to player state as string
                    return trackName & "||" & artistName & "||" & albumName & "||" & artworkUrl & "||" & playerState & "||Spotify"
                end if
            end tell
        else if musicRunning then
            tell application "Music"
                if player state is playing then
                    set trackName to name of current track
                    set artistName to artist of current track
                    set albumName to album of current track
                    set playerState to player state as string
                    return trackName & "||" & artistName & "||" & albumName & "||||" & playerState & "||Music"
                end if
            end tell
        end if
        return "null"
      `],(s,i)=>{if(s||!i||i.trim()==="null")return e(null);const o=i.trim().split("||");o.length>=6?e({name:o[0],artist:o[1],album:o[2],artwork_url:o[3]||null,state:o[4]==="playing"?"playing":"paused",source:o[5]}):e(null)}):n==="win32"?h("powershell",["-NoProfile","-ExecutionPolicy","Bypass","-File",R],{maxBuffer:10*1024*1024,encoding:"utf8"},(t,s)=>{if(t||!s||s.trim()==="null"||s.trim()==="'null'"){c(`powershell -NoProfile -Command "Get-Process | Where-Object {$_.ProcessName -eq 'Spotify'} | Select-Object MainWindowTitle"`,{encoding:"utf8"},(i,o)=>{var p;if(i||!o)return e(null);const r=(p=o.split(`
`).find(d=>d.includes("-")))==null?void 0:p.trim();if(r){const d=r.split(" - ");let $="Unknown",g=r;d.length>1&&($=d[0].trim(),g=d.slice(1).join(" - ").trim()),e({name:g||r,artist:$||"Unknown",state:"playing",source:"Spotify",position:0,duration:0})}else e(null)});return}try{const i=JSON.parse(s.trim());if(!i||!i.Title&&!i.Artist)return e(null);e({name:i.Title||"Unknown Title",artist:i.Artist||"Unknown Artist",album:i.Album||"",artwork_url:i.Artwork||null,state:i.Status==="playing"?"playing":"paused",source:i.Source||"System",position:Number(i.Position)||0,duration:Number(i.Duration)||0})}catch{e(null)}}):n==="linux"?c('playerctl metadata --format "{{title}}||{{artist}}||{{album}}||{{status}}"',(t,s)=>{if(t||!s)return e(null);const i=s.trim().split("||");e({name:i[0],artist:i[1],album:i[2],state:i[3].toLowerCase(),source:"System"})}):e(null)}));l.handle("get-bluetooth-status",async()=>new Promise(e=>{const n=process.platform;if(n==="darwin")c("system_profiler SPBluetoothDataType -json",(t,s)=>{if(t)return e(!1);try{const o=JSON.parse(s).SPBluetoothDataType[0],r=o.device_connected&&o.device_connected.length>0;e(r)}catch{e(!1)}});else if(n==="win32"){const s=Buffer.from(`
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$devs = @(Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'OK' -and $_.Present -eq $true -and $_.InstanceId -match 'BTHENUM' })
$names = @($devs | ForEach-Object { $_.FriendlyName })
@{ connected = ($devs.Count -gt 0); devices = $names } | ConvertTo-Json -Compress
`,"utf16le").toString("base64");c(`powershell -NoProfile -EncodedCommand ${s}`,(i,o)=>{if(i||!o)return e({connected:!1,devices:[]});try{const r=JSON.parse(o.trim());e({connected:!!r.connected,devices:Array.isArray(r.devices)?r.devices:r.devices?[r.devices]:[]})}catch{e({connected:!1,devices:[]})}})}else n==="linux"?c("bluetoothctl devices Connected",(t,s)=>{if(t)return e(!1);e(s.trim().length>0)}):e(!1)}));l.handle("get-camera-status",async()=>new Promise(e=>{const n=process.platform;n==="darwin"?c('ioreg -l | grep -E "FrontCameraActive|FrontCameraStreaming"',(t,s)=>{e(s?s.includes("= Yes"):!1)}):n==="win32"?h("reg",["query","HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\webcam","/s"],(t,s)=>{if(t||!s)return e(!1);const i=s.match(/LastUsedTimeStop\s+REG_QWORD\s+0x0\b/i);e(!!i)}):n==="linux"?c("fuser /dev/video* 2>/dev/null",(t,s)=>{e(s.trim().length>0)}):e(!1)}));l.handle("get-microphone-status",async()=>new Promise(e=>{const n=process.platform;n==="darwin"?c('ioreg -l | grep -E "IOAudioStreamActive|IOAudioEngine|IOAudioStream" | grep -i "Yes"',(t,s)=>{e(s?s.trim().length>0:!1)}):n==="win32"?h("reg",["query","HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone","/s"],(t,s)=>{if(t||!s)return e(!1);const i=s.match(/LastUsedTimeStop\s+REG_QWORD\s+0x0\b/i);e(!!i)}):n==="linux"?c("pactl list source-outputs | grep -q 'Source #'",t=>{e(!t)}):e(!1)}));u.on("window-all-closed",()=>{process.platform==="linux"&&!b&&u.quit()});l.handle("control-system-media",async(e,n)=>{const t=process.platform;if(t==="darwin"){const s=`
        tell application "System Events"
            set spotifyRunning to (name of every process) contains "Spotify"
            set musicRunning to (name of every process) contains "Music"
        end tell
        if spotifyRunning then
            tell application "Spotify" to ${n} track
        else if musicRunning then
            tell application "Music" to ${n} track
        end if
        `;h("osascript",["-e",s])}else if(t==="win32"){let s="0xCD";n==="next"&&(s="0xB0"),n==="previous"&&(s="0xB1"),y(`Executing media control: ${n} (${s})`);const i=`
$type = '[DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);'
$MediaKey = Add-Type -MemberDefinition $type -Name "WinMediaKey" -Namespace "WinAPI" -PassThru
$MediaKey::keybd_event(${s}, 0, 0, [UIntPtr]::Zero)
$MediaKey::keybd_event(${s}, 0, 2, [UIntPtr]::Zero)
`,o=I(i);c(`powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${o}`,r=>{r&&y("Media control error:",r)})}else if(t==="linux"){let s=n;n==="playpause"&&(s="play-pause"),c(`playerctl ${s}`)}});let w=null;function z(){const e=M.cpus();if(!e||e.length===0)return 0;if(!w||w.length!==e.length)return w=e,0;let n=0,t=0;for(let i=0;i<e.length;i++){const o=e[i],r=w[i];let p=o.times.idle-r.times.idle,d=0;for(const $ in o.times)d+=o.times[$]-r.times[$];n+=p,t+=d}if(w=e,t===0)return 0;const s=n/t;return Math.max(0,Math.min(100,Math.round((1-s)*100)))}function Q(){const e=M.totalmem(),n=M.freemem();return e?Math.max(0,Math.min(100,Math.round((e-n)/e*100))):0}l.handle("get-system-metrics",async()=>({cpu:z(),ram:Q()}));l.handle("get-clipboard-text",async()=>{try{return P.readText()}catch{return""}});l.handle("write-clipboard-text",async(e,n)=>{try{return n?P.writeText(n):P.clear(),!0}catch{return!1}});l.handle("clear-clipboard",async()=>{try{return P.clear(),!0}catch{return!1}});l.handle("control-system-volume",async(e,n)=>{if(process.platform==="win32"){let t="0xAF";n==="down"&&(t="0xAE"),n==="mute"&&(t="0xAD");const s=`[Void][System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); $type = '[DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);'; $MediaKey = Add-Type -MemberDefinition $type -Name "WinMediaKey" -Namespace "WinAPI" -PassThru; $MediaKey::keybd_event(${t}, 0, 0, [UIntPtr]::Zero); $MediaKey::keybd_event(${t}, 0, 2, [UIntPtr]::Zero);`;return c(`powershell -NoProfile -Command "${s}"`),!0}return!1});let N=null,A=null;function Y(){process.platform==="win32"&&setInterval(()=>{!a||a.isDestroyed()||c('powershell -NoProfile -Command "[Console]::CapsLock; [Console]::NumberLock"',(e,n)=>{var o,r;if(e||!n)return;const t=n.trim().split(/\r?\n/),s=((o=t[0])==null?void 0:o.trim().toLowerCase())==="true",i=((r=t[1])==null?void 0:r.trim().toLowerCase())==="true";N!==null&&s!==N&&a.webContents.send("key-lock-change",{key:"CapsLock",state:s}),A!==null&&i!==A&&a.webContents.send("key-lock-change",{key:"NumLock",state:i}),N=s,A=i})},500)}let S=null;function X(){process.platform==="win32"&&setInterval(()=>{!a||a.isDestroyed()||c("wmic logicaldisk where drivetype=2 get name,volumename /format:csv",(e,n)=>{var i,o;if(e)return;const t=new Map,s=n.trim().split(/\r?\n/).filter(r=>r.trim()&&!r.startsWith("Node"));for(const r of s){const p=r.trim().split(",");if(p.length>=3){const d=(i=p[1])==null?void 0:i.trim(),$=((o=p[2])==null?void 0:o.trim())||"USB Drive";d&&t.set(d,$)}}if(S!==null){for(const[r,p]of t)S.has(r)||a.webContents.send("usb-change",{action:"connected",drive:r,name:p});for(const[r]of S)t.has(r)||a.webContents.send("usb-change",{action:"disconnected",drive:r,name:"USB Drive"})}S=t})},3e3)}const D=f.join(u.getPath("userData"),"get-notifications.ps1"),ee=`[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime

[void][Windows.UI.Notifications.Management.UserNotificationListener, Windows.UI.Notifications, ContentType = WindowsRuntime]
[void][Windows.UI.Notifications.UserNotification, Windows.UI.Notifications, ContentType = WindowsRuntime]

$asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.IsGenericMethodDefinition -and $_.GetGenericArguments().Count -eq 1 -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name.StartsWith('IAsyncOperation')
}[0]

function Await-Op($asyncOp, $type) {
    if (-not $asyncOp) { return $null }
    try {
        $task = $asTaskGeneric.MakeGenericMethod($type).Invoke($null, @($asyncOp))
        [void]$task.Wait()
        return $task.Result
    } catch { return $null }
}

try {
    $listener = [Windows.UI.Notifications.Management.UserNotificationListener]::Current

    $accessType = [Windows.UI.Notifications.Management.UserNotificationListenerAccessStatus, Windows.UI.Notifications, ContentType = WindowsRuntime]
    $access = Await-Op ($listener.RequestAccessAsync()) $accessType

    if ($access -ne [Windows.UI.Notifications.Management.UserNotificationListenerAccessStatus]::Allowed) {
        Write-Output "[]"
        exit
    }

    $kinds = [Windows.UI.Notifications.NotificationKinds]::Toast
    $userNotifType = [Windows.UI.Notifications.UserNotification, Windows.UI.Notifications, ContentType = WindowsRuntime]
    $readOnlyListType = [System.Collections.Generic.IReadOnlyList\`\`1].MakeGenericType($userNotifType)
    $notifsOp = $listener.GetNotificationsAsync($kinds)
    $task = $asTaskGeneric.MakeGenericMethod($readOnlyListType).Invoke($null, @($notifsOp))
    [void]$task.Wait(10000)
    $notifs = $task.Result

    if (-not $notifs) {
        Write-Output "[]"
        exit
    }

    $results = [System.Collections.Generic.List[object]]::new()
    foreach ($n in $notifs) {
        try {
            $toast = $n.Notification.Visual.GetBinding([Windows.UI.Notifications.KnownNotificationBindings]::ToastGeneric)
            if (-not $toast) { continue }
            $texts = $toast.GetTextElements()
            $title = ""
            $body = ""
            $i = 0
            foreach ($t in $texts) {
                if ($i -eq 0) { $title = $t.Text }
                elseif ($i -eq 1) { $body = $t.Text }
                $i++
            }
            $appName = ""
            $appId = ""
            try {
                $appName = $n.AppInfo.DisplayInfo.DisplayName
                $appId = $n.AppInfo.AppUserModelId
            } catch {}
            $results.Add([PSCustomObject]@{
                Id = $n.Id
                AppName = $appName
                AppId = $appId
                Title = $title
                Body = $body
                Timestamp = $n.CreationTime.ToString("o")
            })
        } catch { continue }
    }
    @($results) | ConvertTo-Json -Compress -Depth 3
} catch {
    Write-Output "[]"
}
`;try{m.writeFileSync(D,ee,"utf8")}catch(e){y("Failed to write get-notifications.ps1:",e)}l.handle("get-notifications",async()=>process.platform!=="win32"?[]:new Promise(e=>{h("powershell",["-NoProfile","-ExecutionPolicy","Bypass","-File",D],{maxBuffer:5*1024*1024,encoding:"utf8",timeout:1e4},(n,t)=>{if(n||!t)return e([]);try{const s=JSON.parse(t.trim());e(Array.isArray(s)?s:s?[s]:[])}catch{e([])}})}));l.handle("dismiss-notification",async(e,n)=>process.platform!=="win32"?!1:new Promise(t=>{const s=`
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.IsGenericMethodDefinition -and $_.GetGenericArguments().Count -eq 1 -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name.StartsWith('IAsyncOperation')
}[0]
function Await-Op($asyncOp, $type) {
    if (-not $asyncOp) { return $null }
    try { $task = $asTaskGeneric.MakeGenericMethod($type).Invoke($null, @($asyncOp)); [void]$task.Wait(); return $task.Result } catch { return $null }
}
try {
    $listener = [Windows.UI.Notifications.Management.UserNotificationListener, Windows.UI.Notifications, ContentType = WindowsRuntime]::Current
    $listener.RemoveNotification(${n})
    Write-Output "true"
} catch { Write-Output "false" }
`,i=I(s);c(`powershell -NoProfile -EncodedCommand ${i}`,(o,r)=>{t((r==null?void 0:r.trim())==="true")})}));l.handle("focus-notification-app",async(e,n)=>process.platform!=="win32"||!n?!1:new Promise(t=>{const s=n.split("!")[0].split("_")[0].replace(/\./g,""),i=`
$type = '[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);'
$fw = Add-Type -MemberDefinition $type -Name "FW" -Namespace "WinAPI" -PassThru
$procs = Get-Process | Where-Object { $_.MainWindowHandle -ne 0 -and ($_.ProcessName -match '${s}' -or $_.MainWindowTitle -match '${s}') } | Select-Object -First 1
if ($procs) { [void]$fw::SetForegroundWindow($procs.MainWindowHandle); Write-Output "true" } else { Write-Output "false" }
`,o=I(i);c(`powershell -NoProfile -EncodedCommand ${o}`,(r,p)=>{t((p==null?void 0:p.trim())==="true")})}));
