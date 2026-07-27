"use strict";const{app:d,BrowserWindow:E,screen:T,ipcMain:l,shell:k,Tray:_,Menu:L,nativeImage:j,clipboard:b}=require("electron"),$=require("node:path"),m=require("fs"),O=require("os");process.platform==="linux"&&(d.commandLine.appendSwitch("enable-transparent-visuals"),d.commandLine.appendSwitch("disable-gpu-compositing"),d.disableHardwareAcceleration());let W=null,r=null;function q(){try{return $.join(d.getPath("userData"),"ripple-island.log")}catch{return $.join(process.cwd(),"ripple-island.log")}}function f(e,n=null){const i=`[${new Date().toISOString()}] ${e}${n?` | Error: ${n.stack||n}`:""}
`;console.log(i.trim());try{const s=q();m.appendFileSync(s,i,"utf8")}catch{}}process.on("uncaughtException",e=>{f("UNCAUGHT EXCEPTION (Main Process)",e)});process.on("unhandledRejection",e=>{f("UNHANDLED REJECTION (Main Process)",e)});const{exec:c,execFile:C,spawn:A}=require("child_process");function h(e){return Buffer.from(e,"utf16le").toString("base64")}function B(){return new Promise(e=>{const t=Buffer.from(`
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
`,"utf16le").toString("base64");c(`powershell -NoProfile -EncodedCommand ${t}`,{maxBuffer:5*1024*1024},(i,s)=>{if(i||!s)return e([]);try{const o=JSON.parse(s.trim());e(Array.isArray(o)?o:o?[o]:[])}catch{e([])}})})}function V(){return new Promise(e=>{const t=Buffer.from(`
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$results = [System.Collections.Generic.List[object]]::new()
Get-StartApps -EA SilentlyContinue | ForEach-Object {
  if ($_.AppID -match '.+!.+') {
    $results.Add([PSCustomObject]@{ name = $_.Name; type = 'uwp'; appId = $_.AppID })
  }
}
@($results) | ConvertTo-Json -Compress -Depth 2
`,"utf16le").toString("base64");c(`powershell -NoProfile -EncodedCommand ${t}`,{maxBuffer:2*1024*1024},(i,s)=>{if(i||!s)return e([]);try{const o=JSON.parse(s.trim());e(Array.isArray(o)?o:o?[o]:[])}catch{e([])}})})}async function J(){const[e,n]=await Promise.all([B(),V()]),t=new Set,i=[];for(const s of[...e,...n]){if(!s.name||!(s.path||s.appId))continue;const o=s.type==="uwp"?`shell:AppsFolder\\${s.appId}`:s.path,a=o.toLowerCase();t.has(a)||(t.add(a),i.push({name:s.name,launch:o}))}return i.sort((s,o)=>s.name.localeCompare(o.name))}function P(e){const n=[];let t=0;for(;t<e.length;){for(;t<e.length&&/\s/.test(e[t]);)t++;if(t>=e.length)break;let i="";for(;t<e.length&&!/\s/.test(e[t]);)if(e[t]==='"'){for(t++;t<e.length&&e[t]!=='"';)i+=e[t++];t<e.length&&t++}else i+=e[t++];i&&n.push(i)}return n}function K(e){const n=e.replace(/\//g,"\\").replace(/%([^%]+)%/g,(o,a)=>process.env[a]||`%${a}%`),t=n.match(/^"([^"]+)"(.*)/);if(t)return{exe:t[1],args:t[2].trim()?P(t[2].trim()):[]};const i=n.match(/^(.+?\.(?:exe|cmd|bat|com|ps1))(?:\s+(.*))?$/i);if(i)return{exe:i[1],args:i[2]?P(i[2]):[]};const s=n.search(/\s/);return s===-1?{exe:n,args:[]}:{exe:n.slice(0,s),args:P(n.slice(s+1).trim())}}function H(e){const n=e.trim();if(n.startsWith("shell:")){const t=n.replace(/'/g,"''");c(`powershell -NoProfile -WindowStyle Hidden -Command "Start-Process '${t}'"`);return}if(/[\\\/]/.test(n)){const{exe:t,args:i}=K(n);if(i.length===0){if(t.toLowerCase().endsWith(".url")){try{const p=m.readFileSync(t,"utf8").match(/^URL=(.+)$/im);p&&k.openExternal(p[1].trim())}catch{}return}k.openPath(t).then(a=>{a&&c(`start "" "${t}"`)});return}const s=/[\\/]/.test(t)&&!/\.[^\\.]+$/.test(t)?t+".exe":t;if(/\.(cmd|bat)$/i.test(s)){const a=A("cmd.exe",["/c",s,...i],{shell:!1,detached:!0,stdio:"ignore"});a.on("error",()=>{}),a.unref();return}if(/\.ps1$/i.test(s)){const a=A("powershell.exe",["-NoProfile","-ExecutionPolicy","Bypass","-File",s,...i],{shell:!1,detached:!0,stdio:"ignore"});a.on("error",()=>{}),a.unref();return}const o=A(s,i,{shell:!1,detached:!0,stdio:"ignore"});o.on("error",()=>{}),o.unref();return}if(n.includes(" ")){const t=n.replace(/'/g,"''");c(`powershell -NoProfile -WindowStyle Hidden -Command "Start-Process '${t}'"`)}else c(`start "" ${n}`)}l.handle("log-message",(e,n,t,i)=>{f(`[RENDERER ${String(n).toUpperCase()}] ${t} ${i?JSON.stringify(i):""}`)});l.handle("set-ignore-mouse-events",(e,n,t)=>{if(r&&!r.isDestroyed())try{if(process.platform!=="linux"){const i=t!==void 0?t:n;r.setIgnoreMouseEvents(n,{forward:i}),f(`setIgnoreMouseEvents(${n}, forward=${i}) executed`)}else r.setIgnoreMouseEvents(n),f(`setIgnoreMouseEvents(${n}) executed (linux)`)}catch(i){f("Error in setIgnoreMouseEvents, falling back to forward=true",i);try{r.setIgnoreMouseEvents(!0,{forward:!0})}catch{}}});l.handle("focus-window",()=>{r&&r.focus()});l.handle("open-external",async(e,n)=>{await k.openExternal(n)});l.handle("launch-app",async(e,n)=>{const t=process.platform;t==="darwin"?c(`open -a "${n}"`):t==="win32"?H(n):c(n)});l.handle("build-app-cache",async()=>{if(process.platform!=="win32")return;const e=$.join(d.getPath("userData"),"app-cache.json");try{const n=await J();m.writeFileSync(e,JSON.stringify(n))}catch{}});l.handle("search-apps",async(e,n)=>{if(process.platform!=="win32"||!n)return[];const t=$.join(d.getPath("userData"),"app-cache.json");try{if(!m.existsSync(t))return[];const i=JSON.parse(m.readFileSync(t,"utf8")),s=n.toLowerCase();return i.filter(o=>o.name&&o.name.toLowerCase().includes(s)).slice(0,8)}catch{return[]}});l.handle("get-displays",()=>T.getAllDisplays().map(n=>({id:n.id,label:n.label||`Display ${n.id}`,bounds:n.bounds})));l.handle("set-display",(e,n)=>{if(r){const i=T.getAllDisplays().find(u=>u.id.toString()===n.toString())||T.getPrimaryDisplay(),{x:s,y:o,width:a,height:p}=i.bounds;process.platform,r.setBounds({x:s,y:o,width:a,height:p}),r.show()}});l.handle("update-window-position",(e,n,t)=>{});l.handle("set-auto-launch",(e,n)=>{if(process.platform==="linux"){const t=$.join(d.getPath("home"),".config","autostart"),i=$.join(t,"ripple.desktop");try{if(n){m.existsSync(t)||m.mkdirSync(t,{recursive:!0});const s=`[Desktop Entry]
Type=Application
Version=1.0
Name=Ripple
Comment=Ripple Desktop Assistant
Exec="${d.getPath("exe")}"
Icon=${x()}
Terminal=false
`;m.writeFileSync(i,s)}else m.existsSync(i)&&m.unlinkSync(i)}catch(s){console.error("Failed to set auto-launch on Linux:",s)}}else if(process.platform==="win32")try{d.setLoginItemSettings({openAtLogin:n,path:d.getPath("exe")})}catch(t){console.error("Failed to set login item settings on Windows:",t)}});const x=()=>{const e="png";if(d.isPackaged){const n=$.join(process.resourcesPath,`icon.${e}`),t=$.join(process.resourcesPath,`assets/icons/icon.${e}`);return m.existsSync(n)?n:m.existsSync(t)?t:n}return $.join(__dirname,`../../src/assets/icons/icon.${e}`)},v=()=>{const e=T.getPrimaryDisplay(),{x:n,y:t,width:i,height:s}=e.bounds,o=process.platform==="linux",a=process.platform==="win32",p=process.platform==="darwin",u=i,y=s,g=n,R=t,D=a?"toolbar":"panel";r=new E({width:u,height:y,x:g,y:R,backgroundColor:"#00000000",transparent:!0,alwaysOnTop:!0,resizable:!1,frame:!1,...a?{thickFrame:!1}:{},hasShadow:!1,skipTaskbar:!0,icon:x(),...p?{hiddenInMissionControl:!0}:{},type:D,fullscreen:!1,visibleOnFullScreen:!0,acceptFirstMouse:!0,webPreferences:{preload:$.join(__dirname,"preload.js"),devTools:!0},show:!0}),o?r.setIgnoreMouseEvents(!0):r.setIgnoreMouseEvents(!0,{forward:!0});const F=o?500:0;r.once("ready-to-show",()=>{setTimeout(()=>{r&&(r.show(),o?r.setAlwaysOnTop(!0,"screen-saver"):r.setAlwaysOnTop(!0,"pop-up-menu"),r.focus())},F)}),setTimeout(()=>{r&&!r.isVisible()&&(r.show(),r.focus())},5e3),r.on("closed",()=>{r=null});try{r.setVisibleOnAllWorkspaces(!0,{visibleOnFullScreen:!0})}catch{}if(!d.isPackaged||process.env.NODE_ENV==="development")r.loadURL("http://localhost:5173");else{const M=$.join(__dirname,"../renderer/main_window/index.html");r.loadFile(M)}};d.whenReady().then(()=>{process.platform==="darwin"&&d.dock.hide(),v(),X(),Q(),d.on("activate",()=>{E.getAllWindows().length===0&&v()});try{const e=x(),t=j.createFromPath(e).resize({width:16,height:16});W=new _(t);const i=L.buildFromTemplate([{label:"Show/Hide Ripple",click:()=>{r&&(r.isVisible()?r.hide():r.show())}},{type:"separator"},{label:"Quit",click:()=>{d.quit()}}]);W.setToolTip("Ripple"),W.setContextMenu(i)}catch(e){console.error("Failed to create tray:",e)}});const G=$.join(d.getPath("userData"),"get-media.ps1"),Z=`[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
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
`;try{m.writeFileSync(G,Z,"utf8")}catch(e){console.error("Failed to write get-media.ps1 script:",e)}l.handle("get-system-media",async()=>new Promise(e=>{const n=process.platform;n==="darwin"?C("osascript",["-e",`
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
      `],(i,s)=>{if(i||!s||s.trim()==="null")return e(null);const o=s.trim().split("||");o.length>=6?e({name:o[0],artist:o[1],album:o[2],artwork_url:o[3]||null,state:o[4]==="playing"?"playing":"paused",source:o[5]}):e(null)}):n==="win32"?C("powershell",["-NoProfile","-ExecutionPolicy","Bypass","-File",G],{maxBuffer:10*1024*1024,encoding:"utf8"},(t,i)=>{if(t||!i||i.trim()==="null"||i.trim()==="'null'"){c(`powershell -NoProfile -Command "Get-Process | Where-Object {$_.ProcessName -eq 'Spotify'} | Select-Object MainWindowTitle"`,{encoding:"utf8"},(s,o)=>{var p;if(s||!o)return e(null);const a=(p=o.split(`
`).find(u=>u.includes("-")))==null?void 0:p.trim();if(a){const u=a.split(" - ");let y="Unknown",g=a;u.length>1&&(y=u[0].trim(),g=u.slice(1).join(" - ").trim()),e({name:g||a,artist:y||"Unknown",state:"playing",source:"Spotify",position:0,duration:0})}else e(null)});return}try{const s=JSON.parse(i.trim());if(!s||!s.Title&&!s.Artist)return e(null);e({name:s.Title||"Unknown Title",artist:s.Artist||"Unknown Artist",album:s.Album||"",artwork_url:s.Artwork||null,state:s.Status==="playing"?"playing":"paused",source:s.Source||"System",position:Number(s.Position)||0,duration:Number(s.Duration)||0})}catch{e(null)}}):n==="linux"?c('playerctl metadata --format "{{title}}||{{artist}}||{{album}}||{{status}}"',(t,i)=>{if(t||!i)return e(null);const s=i.trim().split("||");e({name:s[0],artist:s[1],album:s[2],state:s[3].toLowerCase(),source:"System"})}):e(null)}));l.handle("get-bluetooth-status",async()=>new Promise(e=>{const n=process.platform;if(n==="darwin")c("system_profiler SPBluetoothDataType -json",(t,i)=>{if(t)return e(!1);try{const o=JSON.parse(i).SPBluetoothDataType[0],a=o.device_connected&&o.device_connected.length>0;e(a)}catch{e(!1)}});else if(n==="win32"){const i=Buffer.from(`
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$devs = @(Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'OK' -and $_.Present -eq $true -and $_.InstanceId -match 'BTHENUM' })
$names = @($devs | ForEach-Object { $_.FriendlyName })
@{ connected = ($devs.Count -gt 0); devices = $names } | ConvertTo-Json -Compress
`,"utf16le").toString("base64");c(`powershell -NoProfile -EncodedCommand ${i}`,(s,o)=>{if(s||!o)return e({connected:!1,devices:[]});try{const a=JSON.parse(o.trim());e({connected:!!a.connected,devices:Array.isArray(a.devices)?a.devices:a.devices?[a.devices]:[]})}catch{e({connected:!1,devices:[]})}})}else n==="linux"?c("bluetoothctl devices Connected",(t,i)=>{if(t)return e(!1);e(i.trim().length>0)}):e(!1)}));l.handle("get-camera-status",async()=>new Promise(e=>{const n=process.platform;n==="darwin"?c('ioreg -l | grep -E "FrontCameraActive|FrontCameraStreaming"',(t,i)=>{e(i?i.includes("= Yes"):!1)}):n==="win32"?c(`powershell -NoProfile -Command "
        $inUse = $false
        $keys = Get-ChildItem -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\webcam" -Recurse -ErrorAction SilentlyContinue
        foreach ($key in $keys) {
            $val = Get-ItemProperty -Path $key.PSPath -Name "LastUsedTimeStop" -ErrorAction SilentlyContinue
            if ($val -and $val.LastUsedTimeStop -eq 0) {
                $inUse = $true
                break
            }
        }
        $inUse
      "`,(i,s)=>{if(i)return e(!1);e(s.trim().toLowerCase()==="true")}):n==="linux"?c("fuser /dev/video* 2>/dev/null",(t,i)=>{e(i.trim().length>0)}):e(!1)}));l.handle("get-microphone-status",async()=>new Promise(e=>{const n=process.platform;n==="darwin"?c('ioreg -l | grep -E "IOAudioStreamActive|IOAudioEngine|IOAudioStream" | grep -i "Yes"',(t,i)=>{e(i?i.trim().length>0:!1)}):n==="win32"?c('powershell -NoProfile -Command "@(Get-ChildItem -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone" -Recurse -ErrorAction SilentlyContinue | ForEach-Object { Get-ItemProperty -Path $_.PSPath -Name "LastUsedTimeStop" -ErrorAction SilentlyContinue } | Where-Object { $_ -and $_.LastUsedTimeStop -eq 0 }).Count -gt 0"',(i,s)=>{if(i)return e(!1);e(s.trim().toLowerCase()==="true")}):n==="linux"?c("pactl list source-outputs | grep -q 'Source #'",t=>{e(!t)}):e(!1)}));d.on("window-all-closed",()=>{process.platform==="linux"&&!W&&d.quit()});l.handle("control-system-media",async(e,n)=>{const t=process.platform;if(t==="darwin"){const i=`
        tell application "System Events"
            set spotifyRunning to (name of every process) contains "Spotify"
            set musicRunning to (name of every process) contains "Music"
        end tell
        if spotifyRunning then
            tell application "Spotify" to ${n} track
        else if musicRunning then
            tell application "Music" to ${n} track
        end if
        `;C("osascript",["-e",i])}else if(t==="win32"){let i="0xCD";n==="next"&&(i="0xB0"),n==="previous"&&(i="0xB1"),f(`Executing media control: ${n} (${i})`);const s=`
$type = '[DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);'
$MediaKey = Add-Type -MemberDefinition $type -Name "WinMediaKey" -Namespace "WinAPI" -PassThru
$MediaKey::keybd_event(${i}, 0, 0, [UIntPtr]::Zero)
$MediaKey::keybd_event(${i}, 0, 2, [UIntPtr]::Zero)
`,o=h(s);c(`powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${o}`,a=>{a&&f("Media control error:",a)})}else if(t==="linux"){let i=n;n==="playpause"&&(i="play-pause"),c(`playerctl ${i}`)}});let w=null;function z(){const e=O.cpus();if(!e||e.length===0)return 0;if(!w||w.length!==e.length)return w=e,0;let n=0,t=0;for(let s=0;s<e.length;s++){const o=e[s],a=w[s];let p=o.times.idle-a.times.idle,u=0;for(const y in o.times)u+=o.times[y]-a.times[y];n+=p,t+=u}if(w=e,t===0)return 0;const i=n/t;return Math.max(0,Math.min(100,Math.round((1-i)*100)))}function Y(){const e=O.totalmem(),n=O.freemem();return e?Math.max(0,Math.min(100,Math.round((e-n)/e*100))):0}l.handle("get-system-metrics",async()=>({cpu:z(),ram:Y()}));l.handle("get-clipboard-text",async()=>{try{return b.readText()}catch{return""}});l.handle("write-clipboard-text",async(e,n)=>{try{return n?b.writeText(n):b.clear(),!0}catch{return!1}});l.handle("clear-clipboard",async()=>{try{return b.clear(),!0}catch{return!1}});l.handle("control-system-volume",async(e,n)=>{if(process.platform==="win32"){let t="0xAF";n==="down"&&(t="0xAE"),n==="mute"&&(t="0xAD");const i=`[Void][System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); $type = '[DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);'; $MediaKey = Add-Type -MemberDefinition $type -Name "WinMediaKey" -Namespace "WinAPI" -PassThru; $MediaKey::keybd_event(${t}, 0, 0, [UIntPtr]::Zero); $MediaKey::keybd_event(${t}, 0, 2, [UIntPtr]::Zero);`;return c(`powershell -NoProfile -Command "${i}"`),!0}return!1});let I=null,N=null;function X(){process.platform==="win32"&&setInterval(()=>{!r||r.isDestroyed()||c('powershell -NoProfile -Command "[Console]::CapsLock; [Console]::NumberLock"',(e,n)=>{var o,a;if(e||!n)return;const t=n.trim().split(/\r?\n/),i=((o=t[0])==null?void 0:o.trim().toLowerCase())==="true",s=((a=t[1])==null?void 0:a.trim().toLowerCase())==="true";I!==null&&i!==I&&r.webContents.send("key-lock-change",{key:"CapsLock",state:i}),N!==null&&s!==N&&r.webContents.send("key-lock-change",{key:"NumLock",state:s}),I=i,N=s})},500)}let S=null;function Q(){process.platform==="win32"&&setInterval(()=>{!r||r.isDestroyed()||c("wmic logicaldisk where drivetype=2 get name,volumename /format:csv",(e,n)=>{var s,o;if(e)return;const t=new Map,i=n.trim().split(/\r?\n/).filter(a=>a.trim()&&!a.startsWith("Node"));for(const a of i){const p=a.trim().split(",");if(p.length>=3){const u=(s=p[1])==null?void 0:s.trim(),y=((o=p[2])==null?void 0:o.trim())||"USB Drive";u&&t.set(u,y)}}if(S!==null){for(const[a,p]of t)S.has(a)||r.webContents.send("usb-change",{action:"connected",drive:a,name:p});for(const[a]of S)t.has(a)||r.webContents.send("usb-change",{action:"disconnected",drive:a,name:"USB Drive"})}S=t})},3e3)}const U=$.join(d.getPath("userData"),"get-notifications.ps1"),ee=`[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
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
`;try{m.writeFileSync(U,ee,"utf8")}catch(e){f("Failed to write get-notifications.ps1:",e)}l.handle("get-notifications",async()=>process.platform!=="win32"?[]:new Promise(e=>{C("powershell",["-NoProfile","-ExecutionPolicy","Bypass","-File",U],{maxBuffer:5*1024*1024,encoding:"utf8",timeout:1e4},(n,t)=>{if(n||!t)return e([]);try{const i=JSON.parse(t.trim());e(Array.isArray(i)?i:i?[i]:[])}catch{e([])}})}));l.handle("dismiss-notification",async(e,n)=>process.platform!=="win32"?!1:new Promise(t=>{const i=`
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
`,s=h(i);c(`powershell -NoProfile -EncodedCommand ${s}`,(o,a)=>{t((a==null?void 0:a.trim())==="true")})}));l.handle("focus-notification-app",async(e,n)=>process.platform!=="win32"||!n?!1:new Promise(t=>{const i=n.split("!")[0].split("_")[0].replace(/\./g,""),s=`
$type = '[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);'
$fw = Add-Type -MemberDefinition $type -Name "FW" -Namespace "WinAPI" -PassThru
$procs = Get-Process | Where-Object { $_.MainWindowHandle -ne 0 -and ($_.ProcessName -match '${i}' -or $_.MainWindowTitle -match '${i}') } | Select-Object -First 1
if ($procs) { [void]$fw::SetForegroundWindow($procs.MainWindowHandle); Write-Output "true" } else { Write-Output "false" }
`,o=h(s);c(`powershell -NoProfile -EncodedCommand ${o}`,(a,p)=>{t((p==null?void 0:p.trim())==="true")})}));const te=$.join(d.getPath("userData"),"get-whatsapp-call.ps1"),ne=`[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime
[void][Windows.UI.Notifications.Management.UserNotificationListener, Windows.UI.Notifications, ContentType = WindowsRuntime]
[void][Windows.UI.Notifications.UserNotification, Windows.UI.Notifications, ContentType = WindowsRuntime]

$asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.IsGenericMethodDefinition -and $_.GetGenericArguments().Count -eq 1 -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name.StartsWith('IAsyncOperation')
}[0]
function Await-Op($asyncOp, $type) {
    if (-not $asyncOp) { return $null }
    try { $task = $asTaskGeneric.MakeGenericMethod($type).Invoke($null, @($asyncOp)); [void]$task.Wait(); return $task.Result } catch { return $null }
}// Fast dual-check: Windows Notification Listener + WhatsApp Window Title
try {
    # 1. Check active WhatsApp call window title first (instant, 0ms latency)
    $type = '[DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd); [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count);'
    $win = Add-Type -MemberDefinition $type -Name "WinWhatsApp" -Namespace "WinAPI" -PassThru
    $procs = Get-Process -Name "WhatsApp","WhatsApp.Root" -ErrorAction SilentlyContinue
    foreach ($p in $procs) {
        if ($p.MainWindowHandle -ne 0) {
            $sb = New-Object System.Text.StringBuilder 256
            [void]$win::GetWindowText($p.MainWindowHandle, $sb, 256)
            $title = $sb.ToString().Trim()
            if ($title -and ($title -like '*call*' -or $title -like '*ringing*' -or $title -like '*incoming*')) {
                $isVideo = $title -like '*video*'
                $callerMatch = [regex]::Match($title, '(?:from|with)s+(.+?)(?:s*[-–—]|$)', 'IgnoreCase')
                $caller = if ($callerMatch.Success) { $callerMatch.Groups[1].Value.Trim() } else { $title.Replace("WhatsApp", "").Trim() }
                if (-not $caller) { $caller = "WhatsApp Contact" }
                @{ caller = $caller; callType = (if ($isVideo) { "Video Call" } else { "Voice Call" }); active = $true } | ConvertTo-Json -Compress
                exit
            }
        }
    }

    # 2. Fallback to UserNotificationListener
    $listener = [Windows.UI.Notifications.Management.UserNotificationListener]::Current
    $accessType = [Windows.UI.Notifications.Management.UserNotificationListenerAccessStatus, Windows.UI.Notifications, ContentType = WindowsRuntime]
    $access = Await-Op ($listener.RequestAccessAsync()) $accessType
    if ($access -eq [Windows.UI.Notifications.Management.UserNotificationListenerAccessStatus]::Allowed) {
        $kinds = [Windows.UI.Notifications.NotificationKinds]::Toast
        $userNotifType = [Windows.UI.Notifications.UserNotification, Windows.UI.Notifications, ContentType = WindowsRuntime]
        $readOnlyListType = [System.Collections.Generic.IReadOnlyList\`\`1].MakeGenericType($userNotifType)
        $task = $asTaskGeneric.MakeGenericMethod($readOnlyListType).Invoke($null, @($listener.GetNotificationsAsync($kinds)))
        [void]$task.Wait(3000)
        $notifs = $task.Result
        foreach ($n in $notifs) {
            try {
                $appId = ""
                try { $appId = $n.AppInfo.AppUserModelId } catch {}
                $appName = ""
                try { $appName = $n.AppInfo.DisplayInfo.DisplayName } catch {}
                if ($appId -notlike '*WhatsApp*' -and $appName -notlike '*WhatsApp*') { continue }
                $toast = $n.Notification.Visual.GetBinding([Windows.UI.Notifications.KnownNotificationBindings]::ToastGeneric)
                if (-not $toast) { continue }
                $texts = $toast.GetTextElements()
                $title = ""; $body = ""; $i = 0
                foreach ($t in $texts) { if ($i -eq 0) { $title = $t.Text } elseif ($i -eq 1) { $body = $t.Text }; $i++ }
                $combined = "$title $body"
                $callPatterns = @('incoming', 'ringing', 'calling', 'voice call', 'video call', 'audio call', 'call from')
                $isCall = $false
                foreach ($p in $callPatterns) { if ($combined -like "*$p*") { $isCall = $true; break } }
                if ($isCall) {
                    $isVideo = $combined -like '*video*'
                    $callType = if ($isVideo) { "Video Call" } else { "Voice Call" }
                    @{ caller = $title; callType = $callType; active = $true } | ConvertTo-Json -Compress
                    exit
                }
            } catch { continue }
        }
    }
    Write-Output "null"
} catch { Write-Output "null" }
`;try{m.writeFileSync(te,ne,"utf8")}catch(e){f("Failed to write get-whatsapp-call.ps1:",e)}l.handle("get-whatsapp-call",async()=>process.platform!=="win32"?null:new Promise(e=>{const t=h(`
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Runtime.WindowsRuntime

# 1. UserNotificationListener check for WhatsApp call toast
try {
    $asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
        $_.Name -eq 'AsTask' -and $_.IsGenericMethodDefinition -and $_.GetGenericArguments().Count -eq 1 -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name.StartsWith('IAsyncOperation')
    }[0]
    function Await-Op($asyncOp, $type) {
        if (-not $asyncOp) { return $null }
        try { $task = $asTaskGeneric.MakeGenericMethod($type).Invoke($null, @($asyncOp)); [void]$task.Wait(); return $task.Result } catch { return $null }
    }
    $listener = [Windows.UI.Notifications.Management.UserNotificationListener]::Current
    $accessType = [Windows.UI.Notifications.Management.UserNotificationListenerAccessStatus, Windows.UI.Notifications, ContentType = WindowsRuntime]
    $access = Await-Op ($listener.RequestAccessAsync()) $accessType
    if ($access -eq [Windows.UI.Notifications.Management.UserNotificationListenerAccessStatus]::Allowed) {
        $kinds = [Windows.UI.Notifications.NotificationKinds]::Toast
        $userNotifType = [Windows.UI.Notifications.UserNotification, Windows.UI.Notifications, ContentType = WindowsRuntime]
        $readOnlyListType = [System.Collections.Generic.IReadOnlyList\`\`1].MakeGenericType($userNotifType)
        $task = $asTaskGeneric.MakeGenericMethod($readOnlyListType).Invoke($null, @($listener.GetNotificationsAsync($kinds)))
        [void]$task.Wait(1500)
        $notifs = $task.Result
        foreach ($n in $notifs) {
            try {
                $appId = ""; try { $appId = $n.AppInfo.AppUserModelId } catch {}
                $appName = ""; try { $appName = $n.AppInfo.DisplayInfo.DisplayName } catch {}
                if ($appId -like '*WhatsApp*' -or $appName -like '*WhatsApp*') {
                    $toast = $n.Notification.Visual.GetBinding([Windows.UI.Notifications.KnownNotificationBindings]::ToastGeneric)
                    if ($toast) {
                        $texts = $toast.GetTextElements()
                        $title = ""; $body = ""; $i = 0
                        foreach ($t in $texts) { if ($i -eq 0) { $title = $t.Text } elseif ($i -eq 1) { $body = $t.Text }; $i++ }
                        $combined = "$title $body".ToLower()
                        if ($combined -like '*call*' -or $combined -like '*ring*' -or $combined -like '*voice*' -or $combined -like '*video*' -or $combined -like '*incoming*' -or [string]::IsNullOrWhiteSpace($body)) {
                            $isVideo = $combined -like '*video*'
                            $caller = if ($title) { $title } else { "WhatsApp Contact" }
                            @{ caller = $caller; callType = (if ($isVideo) { "Video Call" } else { "Voice Call" }); active = $true } | ConvertTo-Json -Compress
                            exit
                        }
                    }
                }
            } catch {}
        }
    }
} catch {}

# 2. UI Automation check for active WhatsApp call windows
try {
    Add-Type -AssemblyName UIAutomationClient -ErrorAction SilentlyContinue
    Add-Type -AssemblyName UIAutomationTypes -ErrorAction SilentlyContinue
    $root = [System.Windows.Automation.AutomationElement]::RootElement
    $condWA = [System.Windows.Automation.PropertyCondition]::new([System.Windows.Automation.AutomationElement]::NameProperty, "WhatsApp")
    $waWins = $root.FindAll([System.Windows.Automation.TreeScope]::Children, $condWA)
    foreach ($w in $waWins) {
        $condDesc = [System.Windows.Automation.Condition]::TrueCondition
        $children = $w.FindAll([System.Windows.Automation.TreeScope]::Descendants, $condDesc)
        $isCall = $false; $caller = ""; $type = "Voice Call"
        foreach ($c in $children) {
            $n = $c.Current.Name
            if ($n -eq "Voice call") { $isCall = $true; $type = "Voice Call" }
            if ($n -eq "Video call") { $isCall = $true; $type = "Video Call" }
            if ($n -eq "Accept" -or $n -eq "Decline") { $isCall = $true }
        }
        if ($isCall) {
            foreach ($c in $children) {
                $n = $c.Current.Name
                $t = $c.Current.ControlType.ProgrammaticName
                if ($t -match "Text" -and $n -ne "Voice call" -and $n -ne "Video call" -and $n -ne "WhatsApp" -and -not [string]::IsNullOrWhiteSpace($n)) {
                    $caller = $n
                    break
                }
            }
            if (-not $caller) { $caller = "WhatsApp Contact" }
            @{ caller = $caller; callType = $type; active = $true } | ConvertTo-Json -Compress
            exit
        }
    }
} catch {}

Write-Output "null"
`);c(`powershell -NoProfile -EncodedCommand ${t}`,{maxBuffer:2*1024*1024,timeout:5e3},(i,s)=>{if(i||!s||s.trim()==="null")return e(null);try{e(JSON.parse(s.trim()))}catch{e(null)}})}));l.handle("answer-whatsapp-call",async()=>process.platform!=="win32"?!1:new Promise(e=>{const t=h(`
$code = @"
using System;
using System.Runtime.InteropServices;
public class WAFocus {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    public static bool Focus() {
        bool ok = false;
        EnumWindows((hwnd, lp) => {
            if (IsWindowVisible(hwnd)) {
                uint pid = 0; GetWindowThreadProcessId(hwnd, out pid);
                try {
                    var p = System.Diagnostics.Process.GetProcessById((int)pid);
                    if (p != null && (p.ProcessName.Equals("WhatsApp", StringComparison.OrdinalIgnoreCase) || p.ProcessName.Equals("WhatsApp.Root", StringComparison.OrdinalIgnoreCase))) {
                        SetForegroundWindow(hwnd);
                        ok = true;
                        return false;
                    }
                } catch {}
            }
            return true;
        }, IntPtr.Zero);
        return ok;
    }
}
"@
Add-Type -TypeDefinition $code -ErrorAction SilentlyContinue
$res = [WAFocus]::Focus()
if ($res) { Write-Output "true" } else { Write-Output "false" }
`);c(`powershell -NoProfile -EncodedCommand ${t}`,(i,s)=>{e((s==null?void 0:s.trim())==="true")})}));l.handle("decline-whatsapp-call",async()=>process.platform!=="win32"?!1:new Promise(e=>{const t=h(`
$code = @"
using System;
using System.Runtime.InteropServices;
public class WAFocus2 {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    public static bool Focus() {
        bool ok = false;
        EnumWindows((hwnd, lp) => {
            if (IsWindowVisible(hwnd)) {
                uint pid = 0; GetWindowThreadProcessId(hwnd, out pid);
                try {
                    var p = System.Diagnostics.Process.GetProcessById((int)pid);
                    if (p != null && (p.ProcessName.Equals("WhatsApp", StringComparison.OrdinalIgnoreCase) || p.ProcessName.Equals("WhatsApp.Root", StringComparison.OrdinalIgnoreCase))) {
                        SetForegroundWindow(hwnd);
                        ok = true;
                        return false;
                    }
                } catch {}
            }
            return true;
        }, IntPtr.Zero);
        return ok;
    }
}
"@
Add-Type -TypeDefinition $code -ErrorAction SilentlyContinue
$res = [WAFocus2]::Focus()
if ($res) { Write-Output "true" } else { Write-Output "false" }
`);c(`powershell -NoProfile -EncodedCommand ${t}`,(i,s)=>{e((s==null?void 0:s.trim())==="true")})}));
