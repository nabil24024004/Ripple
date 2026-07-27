"use strict";const{app:p,BrowserWindow:O,screen:S,ipcMain:c,shell:T,Tray:R,Menu:v,nativeImage:D,clipboard:b}=require("electron"),f=require("node:path"),u=require("fs"),A=require("os");process.platform==="linux"&&(p.commandLine.appendSwitch("enable-transparent-visuals"),p.commandLine.appendSwitch("disable-gpu-compositing"),p.disableHardwareAcceleration());let w=null,o=null;function _(){try{return f.join(p.getPath("userData"),"ripple-island.log")}catch{return f.join(process.cwd(),"ripple-island.log")}}function y(e,t=null){const s=`[${new Date().toISOString()}] ${e}${t?` | Error: ${t.stack||t}`:""}
`;console.log(s.trim());try{const r=_();u.appendFileSync(r,s,"utf8")}catch{}}process.on("uncaughtException",e=>{y("UNCAUGHT EXCEPTION (Main Process)",e)});process.on("unhandledRejection",e=>{y("UNHANDLED REJECTION (Main Process)",e)});const{exec:l,execFile:k,spawn:P}=require("child_process");function j(e){return Buffer.from(e,"utf16le").toString("base64")}function U(){return new Promise(e=>{const n=Buffer.from(`
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
`,"utf16le").toString("base64");l(`powershell -NoProfile -EncodedCommand ${n}`,{maxBuffer:5*1024*1024},(s,r)=>{if(s||!r)return e([]);try{const i=JSON.parse(r.trim());e(Array.isArray(i)?i:i?[i]:[])}catch{e([])}})})}function G(){return new Promise(e=>{const n=Buffer.from(`
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$results = [System.Collections.Generic.List[object]]::new()
Get-StartApps -EA SilentlyContinue | ForEach-Object {
  if ($_.AppID -match '.+!.+') {
    $results.Add([PSCustomObject]@{ name = $_.Name; type = 'uwp'; appId = $_.AppID })
  }
}
@($results) | ConvertTo-Json -Compress -Depth 2
`,"utf16le").toString("base64");l(`powershell -NoProfile -EncodedCommand ${n}`,{maxBuffer:2*1024*1024},(s,r)=>{if(s||!r)return e([]);try{const i=JSON.parse(r.trim());e(Array.isArray(i)?i:i?[i]:[])}catch{e([])}})})}async function L(){const[e,t]=await Promise.all([U(),G()]),n=new Set,s=[];for(const r of[...e,...t]){if(!r.name||!(r.path||r.appId))continue;const i=r.type==="uwp"?`shell:AppsFolder\\${r.appId}`:r.path,a=i.toLowerCase();n.has(a)||(n.add(a),s.push({name:r.name,launch:i}))}return s.sort((r,i)=>r.name.localeCompare(i.name))}function C(e){const t=[];let n=0;for(;n<e.length;){for(;n<e.length&&/\s/.test(e[n]);)n++;if(n>=e.length)break;let s="";for(;n<e.length&&!/\s/.test(e[n]);)if(e[n]==='"'){for(n++;n<e.length&&e[n]!=='"';)s+=e[n++];n<e.length&&n++}else s+=e[n++];s&&t.push(s)}return t}function B(e){const t=e.replace(/\//g,"\\").replace(/%([^%]+)%/g,(i,a)=>process.env[a]||`%${a}%`),n=t.match(/^"([^"]+)"(.*)/);if(n)return{exe:n[1],args:n[2].trim()?C(n[2].trim()):[]};const s=t.match(/^(.+?\.(?:exe|cmd|bat|com|ps1))(?:\s+(.*))?$/i);if(s)return{exe:s[1],args:s[2]?C(s[2]):[]};const r=t.search(/\s/);return r===-1?{exe:t,args:[]}:{exe:t.slice(0,r),args:C(t.slice(r+1).trim())}}function q(e){const t=e.trim();if(t.startsWith("shell:")){const n=t.replace(/'/g,"''");l(`powershell -NoProfile -WindowStyle Hidden -Command "Start-Process '${n}'"`);return}if(/[\\\/]/.test(t)){const{exe:n,args:s}=B(t);if(s.length===0){if(n.toLowerCase().endsWith(".url")){try{const m=u.readFileSync(n,"utf8").match(/^URL=(.+)$/im);m&&T.openExternal(m[1].trim())}catch{}return}T.openPath(n).then(a=>{a&&l(`start "" "${n}"`)});return}const r=/[\\/]/.test(n)&&!/\.[^\\.]+$/.test(n)?n+".exe":n;if(/\.(cmd|bat)$/i.test(r)){const a=P("cmd.exe",["/c",r,...s],{shell:!1,detached:!0,stdio:"ignore"});a.on("error",()=>{}),a.unref();return}if(/\.ps1$/i.test(r)){const a=P("powershell.exe",["-NoProfile","-ExecutionPolicy","Bypass","-File",r,...s],{shell:!1,detached:!0,stdio:"ignore"});a.on("error",()=>{}),a.unref();return}const i=P(r,s,{shell:!1,detached:!0,stdio:"ignore"});i.on("error",()=>{}),i.unref();return}if(t.includes(" ")){const n=t.replace(/'/g,"''");l(`powershell -NoProfile -WindowStyle Hidden -Command "Start-Process '${n}'"`)}else l(`start "" ${t}`)}c.handle("log-message",(e,t,n,s)=>{y(`[RENDERER ${String(t).toUpperCase()}] ${n} ${s?JSON.stringify(s):""}`)});c.handle("set-ignore-mouse-events",(e,t,n)=>{if(o&&!o.isDestroyed())try{if(process.platform!=="linux"){const s=n!==void 0?n:t;o.setIgnoreMouseEvents(t,{forward:s}),y(`setIgnoreMouseEvents(${t}, forward=${s}) executed`)}else o.setIgnoreMouseEvents(t),y(`setIgnoreMouseEvents(${t}) executed (linux)`)}catch(s){y("Error in setIgnoreMouseEvents, falling back to forward=true",s);try{o.setIgnoreMouseEvents(!0,{forward:!0})}catch{}}});c.handle("focus-window",()=>{o&&o.focus()});c.handle("open-external",async(e,t)=>{await T.openExternal(t)});c.handle("launch-app",async(e,t)=>{const n=process.platform;n==="darwin"?l(`open -a "${t}"`):n==="win32"?q(t):l(t)});c.handle("build-app-cache",async()=>{if(process.platform!=="win32")return;const e=f.join(p.getPath("userData"),"app-cache.json");try{const t=await L();u.writeFileSync(e,JSON.stringify(t))}catch{}});c.handle("search-apps",async(e,t)=>{if(process.platform!=="win32"||!t)return[];const n=f.join(p.getPath("userData"),"app-cache.json");try{if(!u.existsSync(n))return[];const s=JSON.parse(u.readFileSync(n,"utf8")),r=t.toLowerCase();return s.filter(i=>i.name&&i.name.toLowerCase().includes(r)).slice(0,8)}catch{return[]}});c.handle("get-displays",()=>S.getAllDisplays().map(t=>({id:t.id,label:t.label||`Display ${t.id}`,bounds:t.bounds})));c.handle("set-display",(e,t)=>{if(o){const s=S.getAllDisplays().find(d=>d.id.toString()===t.toString())||S.getPrimaryDisplay(),{x:r,y:i,width:a,height:m}=s.bounds;process.platform,o.setBounds({x:r,y:i,width:a,height:m}),o.show()}});c.handle("update-window-position",(e,t,n)=>{});c.handle("set-auto-launch",(e,t)=>{if(process.platform==="linux"){const n=f.join(p.getPath("home"),".config","autostart"),s=f.join(n,"ripple.desktop");try{if(t){u.existsSync(n)||u.mkdirSync(n,{recursive:!0});const r=`[Desktop Entry]
Type=Application
Version=1.0
Name=Ripple
Comment=Ripple Desktop Assistant
Exec="${p.getPath("exe")}"
Icon=${x()}
Terminal=false
`;u.writeFileSync(s,r)}else u.existsSync(s)&&u.unlinkSync(s)}catch(r){console.error("Failed to set auto-launch on Linux:",r)}}else if(process.platform==="win32")try{p.setLoginItemSettings({openAtLogin:t,path:p.getPath("exe")})}catch(n){console.error("Failed to set login item settings on Windows:",n)}});const x=()=>{const e="png";if(p.isPackaged){const t=f.join(process.resourcesPath,`icon.${e}`),n=f.join(process.resourcesPath,`assets/icons/icon.${e}`);return u.existsSync(t)?t:u.existsSync(n)?n:t}return f.join(__dirname,`../../src/assets/icons/icon.${e}`)},I=()=>{const e=S.getPrimaryDisplay(),{x:t,y:n,width:s,height:r}=e.bounds,i=process.platform==="linux",a=process.platform==="win32",m=process.platform==="darwin",d=s,$=r,g=t,N=n,W=a?"toolbar":"panel";o=new O({width:d,height:$,x:g,y:N,backgroundColor:"#00000000",transparent:!0,alwaysOnTop:!0,resizable:!1,frame:!1,...a?{thickFrame:!1}:{},hasShadow:!1,skipTaskbar:!0,icon:x(),...m?{hiddenInMissionControl:!0}:{},type:W,fullscreen:!1,visibleOnFullScreen:!0,acceptFirstMouse:!0,webPreferences:{preload:f.join(__dirname,"preload.js"),devTools:!0},show:!0}),i?o.setIgnoreMouseEvents(!0):o.setIgnoreMouseEvents(!0,{forward:!0});const F=i?500:0;o.once("ready-to-show",()=>{setTimeout(()=>{o&&(o.show(),i?o.setAlwaysOnTop(!0,"screen-saver"):o.setAlwaysOnTop(!0,"pop-up-menu"),o.focus())},F)}),setTimeout(()=>{o&&!o.isVisible()&&(o.show(),o.focus())},5e3),o.on("closed",()=>{o=null});try{o.setVisibleOnAllWorkspaces(!0,{visibleOnFullScreen:!0})}catch{}if(!p.isPackaged||process.env.NODE_ENV==="development")o.loadURL("http://localhost:5173");else{const M=f.join(__dirname,"../renderer/main_window/index.html");o.loadFile(M)}};p.whenReady().then(()=>{process.platform==="darwin"&&p.dock.hide(),I(),p.on("activate",()=>{O.getAllWindows().length===0&&I()});try{const e=x(),n=D.createFromPath(e).resize({width:16,height:16});w=new R(n);const s=v.buildFromTemplate([{label:"Show/Hide Ripple",click:()=>{o&&(o.isVisible()?o.hide():o.show())}},{type:"separator"},{label:"Quit",click:()=>{p.quit()}}]);w.setToolTip("Ripple"),w.setContextMenu(s)}catch(e){console.error("Failed to create tray:",e)}});const E=f.join(p.getPath("userData"),"get-media.ps1"),J=`[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
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
`;try{u.writeFileSync(E,J,"utf8")}catch(e){console.error("Failed to write get-media.ps1 script:",e)}c.handle("get-system-media",async()=>new Promise(e=>{const t=process.platform;t==="darwin"?k("osascript",["-e",`
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
      `],(s,r)=>{if(s||!r||r.trim()==="null")return e(null);const i=r.trim().split("||");i.length>=6?e({name:i[0],artist:i[1],album:i[2],artwork_url:i[3]||null,state:i[4]==="playing"?"playing":"paused",source:i[5]}):e(null)}):t==="win32"?k("powershell",["-NoProfile","-ExecutionPolicy","Bypass","-File",E],{maxBuffer:10*1024*1024,encoding:"utf8"},(n,s)=>{if(n||!s||s.trim()==="null"||s.trim()==="'null'"){l(`powershell -NoProfile -Command "Get-Process | Where-Object {$_.ProcessName -eq 'Spotify'} | Select-Object MainWindowTitle"`,{encoding:"utf8"},(r,i)=>{var m;if(r||!i)return e(null);const a=(m=i.split(`
`).find(d=>d.includes("-")))==null?void 0:m.trim();if(a){const d=a.split(" - ");let $="Unknown",g=a;d.length>1&&($=d[0].trim(),g=d.slice(1).join(" - ").trim()),e({name:g||a,artist:$||"Unknown",state:"playing",source:"Spotify",position:0,duration:0})}else e(null)});return}try{const r=JSON.parse(s.trim());if(!r||!r.Title&&!r.Artist)return e(null);e({name:r.Title||"Unknown Title",artist:r.Artist||"Unknown Artist",album:r.Album||"",artwork_url:r.Artwork||null,state:r.Status==="playing"?"playing":"paused",source:r.Source||"System",position:Number(r.Position)||0,duration:Number(r.Duration)||0})}catch{e(null)}}):t==="linux"?l('playerctl metadata --format "{{title}}||{{artist}}||{{album}}||{{status}}"',(n,s)=>{if(n||!s)return e(null);const r=s.trim().split("||");e({name:r[0],artist:r[1],album:r[2],state:r[3].toLowerCase(),source:"System"})}):e(null)}));c.handle("get-bluetooth-status",async()=>new Promise(e=>{const t=process.platform;t==="darwin"?l("system_profiler SPBluetoothDataType -json",(n,s)=>{if(n)return e(!1);try{const i=JSON.parse(s).SPBluetoothDataType[0],a=i.device_connected&&i.device_connected.length>0;e(a)}catch{e(!1)}}):t==="win32"?l(`powershell -NoProfile -Command "@(Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq 'OK' -and $_.Present -eq $true -and $_.InstanceId -match 'BTHENUM' }).Count -gt 0"`,(s,r)=>{if(s)return e(!1);e(r.trim().toLowerCase()==="true")}):t==="linux"?l("bluetoothctl devices Connected",(n,s)=>{if(n)return e(!1);e(s.trim().length>0)}):e(!1)}));c.handle("get-camera-status",async()=>new Promise(e=>{const t=process.platform;t==="darwin"?l('ioreg -l | grep -E "FrontCameraActive|FrontCameraStreaming"',(n,s)=>{e(s?s.includes("= Yes"):!1)}):t==="win32"?l(`powershell -NoProfile -Command "
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
      "`,(s,r)=>{if(s)return e(!1);e(r.trim().toLowerCase()==="true")}):t==="linux"?l("fuser /dev/video* 2>/dev/null",(n,s)=>{e(s.trim().length>0)}):e(!1)}));c.handle("get-microphone-status",async()=>new Promise(e=>{const t=process.platform;t==="darwin"?l('ioreg -l | grep -E "IOAudioStreamActive|IOAudioEngine|IOAudioStream" | grep -i "Yes"',(n,s)=>{e(s?s.trim().length>0:!1)}):t==="win32"?l('powershell -NoProfile -Command "@(Get-ChildItem -Path "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone" -Recurse -ErrorAction SilentlyContinue | ForEach-Object { Get-ItemProperty -Path $_.PSPath -Name "LastUsedTimeStop" -ErrorAction SilentlyContinue } | Where-Object { $_ -and $_.LastUsedTimeStop -eq 0 }).Count -gt 0"',(s,r)=>{if(s)return e(!1);e(r.trim().toLowerCase()==="true")}):t==="linux"?l("pactl list source-outputs | grep -q 'Source #'",n=>{e(!n)}):e(!1)}));p.on("window-all-closed",()=>{process.platform==="linux"&&!w&&p.quit()});c.handle("control-system-media",async(e,t)=>{const n=process.platform;if(n==="darwin"){const s=`
        tell application "System Events"
            set spotifyRunning to (name of every process) contains "Spotify"
            set musicRunning to (name of every process) contains "Music"
        end tell
        if spotifyRunning then
            tell application "Spotify" to ${t} track
        else if musicRunning then
            tell application "Music" to ${t} track
        end if
        `;k("osascript",["-e",s])}else if(n==="win32"){let s="0xCD";t==="next"&&(s="0xB0"),t==="previous"&&(s="0xB1"),y(`Executing media control: ${t} (${s})`);const r=`
$type = '[DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);'
$MediaKey = Add-Type -MemberDefinition $type -Name "WinMediaKey" -Namespace "WinAPI" -PassThru
$MediaKey::keybd_event(${s}, 0, 0, [UIntPtr]::Zero)
$MediaKey::keybd_event(${s}, 0, 2, [UIntPtr]::Zero)
`,i=j(r);l(`powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${i}`,a=>{a&&y("Media control error:",a)})}else if(n==="linux"){let s=t;t==="playpause"&&(s="play-pause"),l(`playerctl ${s}`)}});let h=null;function K(){const e=A.cpus();if(!e||e.length===0)return 0;if(!h||h.length!==e.length)return h=e,0;let t=0,n=0;for(let r=0;r<e.length;r++){const i=e[r],a=h[r];let m=i.times.idle-a.times.idle,d=0;for(const $ in i.times)d+=i.times[$]-a.times[$];t+=m,n+=d}if(h=e,n===0)return 0;const s=t/n;return Math.max(0,Math.min(100,Math.round((1-s)*100)))}function H(){const e=A.totalmem(),t=A.freemem();return e?Math.max(0,Math.min(100,Math.round((e-t)/e*100))):0}c.handle("get-system-metrics",async()=>({cpu:K(),ram:H()}));c.handle("get-clipboard-text",async()=>{try{return b.readText()}catch{return""}});c.handle("write-clipboard-text",async(e,t)=>{try{return t?b.writeText(t):b.clear(),!0}catch{return!1}});c.handle("clear-clipboard",async()=>{try{return b.clear(),!0}catch{return!1}});c.handle("control-system-volume",async(e,t)=>{if(process.platform==="win32"){let n="0xAF";t==="down"&&(n="0xAE"),t==="mute"&&(n="0xAD");const s=`[Void][System.Reflection.Assembly]::LoadWithPartialName('System.Windows.Forms'); $type = '[DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);'; $MediaKey = Add-Type -MemberDefinition $type -Name "WinMediaKey" -Namespace "WinAPI" -PassThru; $MediaKey::keybd_event(${n}, 0, 0, [UIntPtr]::Zero); $MediaKey::keybd_event(${n}, 0, 2, [UIntPtr]::Zero);`;return l(`powershell -NoProfile -Command "${s}"`),!0}return!1});
