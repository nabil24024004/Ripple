import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Mic, SkipBackIcon, Play, Pause, SkipForwardIcon, Music, Headphones, Zap, Settings, Sun, Cloud, Droplets, Trash2, ChevronRight, ChevronLeft, Plus, Check, X, CloudRain, CloudSnow, CloudLightning, CloudSun, Moon, Eye, EyeOff, GripVertical, List, Search, Star, Calendar as CalendarIcon, Bell, Activity, Cpu, Clock, Volume2, VolumeX, Wind, RotateCcw, Thermometer, Radio } from "lucide-react";
import "./App.css";

//Get Date
function formatDateShort(input) {
  const date = input ? new Date(input) : new Date();
  if (isNaN(date.getTime())) {
    throw new Error("Invalid date provided to formatDateShort");
  }
  const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
  const month = date.toLocaleDateString(undefined, { month: "short" });
  const day = date.getDate();
  return `${weekday}, ${month} ${day}`;
}

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  
  const days = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ day: d, isCurrentMonth: true });
  }
  const remaining = (7 - (days.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    days.push({ day: d, isCurrentMonth: false });
  }
  return days;
}

const textMeasureCanvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
function measureTextWidth(text, font = "600 13px OpenRunde, Arial, sans-serif") {
  if (!textMeasureCanvas || !textMeasureCanvas.getContext || !text) return null;
  const ctx = textMeasureCanvas.getContext("2d");
  if (!ctx) return null;
  const fontStr = typeof font === "number" ? `600 ${font}px OpenRunde, Arial, sans-serif` : font;
  ctx.font = fontStr;
  return ctx.measureText(text).width;
}

const WeatherIcon = ({ status, size = 16, color = "currentColor" }) => {
  const s = status?.toLowerCase() || "";
  if (s.includes("sunny") || s.includes("clear")) return <Sun size={size} color={color} />;
  if (s.includes("partly cloudy")) return <CloudSun size={size} color={color} />;
  if (s.includes("cloudy") || s.includes("overcast") || s.includes("mist") || s.includes("fog")) return <Cloud size={size} color={color} />;
  if (s.includes("rain") || s.includes("drizzle") || s.includes("showers")) return <CloudRain size={size} color={color} />;
  if (s.includes("snow") || s.includes("sleet") || s.includes("ice") || s.includes("blizzard")) return <CloudSnow size={size} color={color} />;
  if (s.includes("thunder") || s.includes("storm")) return <CloudLightning size={size} color={color} />;
  return <Sun size={size} color={color} />;
};

function openApp(app) {
  if (!app) return;
  const trimmedApp = app.trim();

  if (/^(https?|file):\/\//i.test(trimmedApp)) {
    window.electronAPI?.openExternal(trimmedApp);
    return;
  }

  const isLaunchTarget =
    /[\\\/]/.test(trimmedApp) ||
    /\.exe$/i.test(trimmedApp) ||
    trimmedApp.startsWith('shell:');

  if (isLaunchTarget) {
    window.electronAPI?.launchApp(trimmedApp);
    return;
  }

  if (/^(\d{1,3}\.){3}\d{1,3}(:\d+)?(\/.*)?$/.test(trimmedApp) ||
    /^localhost(:\d+)?(\/.*)?$/i.test(trimmedApp)) {
    window.electronAPI?.openExternal(`http://${trimmedApp}`);
    return;
  }

  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(trimmedApp)) {
    window.electronAPI?.openExternal(`https://${trimmedApp}`);
    return;
  }

  window.electronAPI?.launchApp(trimmedApp);
}

function openMusicPlayer(source) {
  if (!source) return;

  if (source === "Spotify") {
    openApp("Spotify");
  } else if (source === "Music") {
    openApp("Music");
  } else if (source === "music.apple.com" || source.includes("Apple")) {
    openApp("Music");
  } else {
    openApp(source);
  }
}

const TABS = [
  { id: 0, name: "Browser Search", icon: (color) => <Search size={16} color={color} /> },
  { id: 1, name: "Weather", icon: (color) => <CloudSun size={16} color={color} /> },
  { id: 2, name: "Overview", icon: (color) => <Sun size={16} color={color} /> },
  { id: 3, name: "Now Playing", icon: (color) => <Music size={16} color={color} /> },
  { id: 4, name: "Calendar", icon: (color) => <CalendarIcon size={16} color={color} /> },
  { id: 5, name: "Notifications", icon: (color) => <Bell size={16} color={color} /> },
  { id: 6, name: "Game / Stats", icon: (color) => <Activity size={16} color={color} /> },
  { id: 7, name: "Clipboard", icon: (color) => <List size={16} color={color} /> },
  { id: 8, name: "Tasks", icon: (color) => <Check size={16} color={color} /> },
  { id: 10, name: "Timer / Stopwatch", icon: (color) => <Clock size={16} color={color} /> },
  { id: 9, name: "Settings", icon: (color) => <Settings size={16} color={color} /> },
];

const WaveformScrubber = ({ position = 0, duration = 0, isPlaying = false, onSeek }) => {
  const [animTime, setAnimTime] = useState(0);
  const [scrubPos, setScrubPos] = useState(null);

  useEffect(() => {
    setScrubPos(null);
  }, [position]);

  useEffect(() => {
    if (!isPlaying) return;
    let animId;
    const updateTime = () => {
      setAnimTime(prev => prev + 0.04);
      animId = requestAnimationFrame(updateTime);
    };
    animId = requestAnimationFrame(updateTime);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  const currentPos = scrubPos !== null ? scrubPos : position;
  const progress = duration > 0 ? Math.min(1, Math.max(0, currentPos / duration)) : 0;
  const width = 330;
  const height = 24;
  const centerY = 12;
  const barHeight = 6;
  const playedX = Math.max(0, Math.min(width, progress * width));

  const pointsCount = 35;
  const topPoints = [];

  for (let i = 0; i <= pointsCount; i++) {
    const t = i / pointsCount;
    const x = t * playedX;
    const envelope = Math.sin(t * Math.PI);
    const waveAmp = isPlaying
      ? Math.sin(t * 8 - animTime * 3) * 5 * envelope
      : Math.sin(t * 4 + animTime) * 1.5 * envelope;
    const y = (centerY - barHeight / 2) - Math.max(0, waveAmp + 4 * envelope);
    topPoints.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }

  const bottomY = centerY + barHeight / 2;
  const filledPathD = topPoints.length > 0
    ? `M 0,${bottomY} L ` + topPoints.join(' L ') + ` L ${playedX.toFixed(1)},${bottomY} Z`
    : `M 0,${centerY - barHeight/2} L ${playedX},${centerY - barHeight/2} L ${playedX},${bottomY} L 0,${bottomY} Z`;

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleScrubClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newRatio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSec = newRatio * duration;
    setScrubPos(targetSec);
    if (onSeek && duration > 0) {
      onSeek(targetSec);
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6, cursor: 'pointer', marginTop: 8 }} onClick={handleScrubClick}>
      <svg width="100%" height="24" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
        {/* Unplayed Track (Background Bar) */}
        <rect
          x="0"
          y={centerY - barHeight / 2}
          width={width}
          height={barHeight}
          rx={barHeight / 2}
          fill="rgba(255, 255, 255, 0.25)"
        />

        {/* Played Fluid Wave Mountain Ribbon Fill */}
        {playedX > 0 && (
          <path
            d={filledPathD}
            fill="rgba(240, 240, 240, 0.88)"
          />
        )}

        {/* Slider Handle Knob (Thumb) */}
        <circle
          cx={playedX}
          cy={centerY}
          r="8"
          fill="#ffffff"
          style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))' }}
        />
      </svg>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.55)', fontFamily: 'OpenRunde, sans-serif' }}>
        <span>{formatTime(currentPos)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};

const ScrollingTitle = ({ text = "", fontSize = 16 }) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [scrollDistance, setScrollDistance] = useState(0);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const textWidth = textRef.current.getBoundingClientRect().width;
        const containerWidth = containerRef.current.getBoundingClientRect().width;
        if (textWidth > containerWidth - 5) {
          setScrollDistance(textWidth - containerWidth + 35);
        } else {
          setScrollDistance(0);
        }
      }
    };

    checkOverflow();
    const timer = setTimeout(checkOverflow, 150);
    return () => clearTimeout(timer);
  }, [text, fontSize]);

  return (
    <div
      ref={containerRef}
      style={{
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        width: '100%',
        maxWidth: '290px',
        position: 'relative',
        textShadow: '0 2px 8px rgba(0,0,0,0.9)',
        maskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)'
      }}
    >
      {scrollDistance > 0 ? (
        <motion.div
          key={`scrolling-${text}`}
          animate={{ x: [0, -scrollDistance, 0] }}
          transition={{
            duration: Math.max(6, scrollDistance / 20),
            repeat: Infinity,
            repeatType: 'reverse',
            repeatDelay: 1.2,
            ease: 'easeInOut'
          }}
          style={{
            display: 'inline-block',
            fontSize,
            fontWeight: 700,
            color: '#ffffff',
            fontFamily: 'OpenRunde, system-ui, sans-serif'
          }}
        >
          <span ref={textRef}>{text}</span>
        </motion.div>
      ) : (
        <h2
          style={{
            margin: 0,
            fontSize,
            fontWeight: 700,
            color: '#ffffff',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            letterSpacing: '-0.2px',
            fontFamily: 'OpenRunde, system-ui, sans-serif'
          }}
        >
          <span ref={textRef}>{text}</span>
        </h2>
      )}
    </div>
  );
};

export default function Island() {
  const [time, setTime] = useState(null);
  const [mode, setMode] = useState("still");
  const [tabOrder, setTabOrder] = useState(() => JSON.parse(localStorage.getItem("tab-order") || "[0,1,2,3,4,5,6,7,8,10,9]"));
  const [hiddenTabs, setHiddenTabs] = useState(() => JSON.parse(localStorage.getItem("hidden-tabs") || "[]"));
  const [defaultTabId, setDefaultTabId] = useState(() => Number(localStorage.getItem("default-tab") || 0));

  const moveTabOrder = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= tabOrder.length) return;
    setTabOrder((prev) => {
      const newOrder = [...prev];
      const [moved] = newOrder.splice(fromIdx, 1);
      newOrder.splice(toIdx, 0, moved);
      localStorage.setItem("tab-order", JSON.stringify(newOrder));
      return newOrder;
    });
  };

  const toggleTabVisibility = (id) => {
    setHiddenTabs(prev => {
      const newHidden = prev.includes(id)
        ? prev.filter(t => t !== id)
        : [...prev, id];

      if (newHidden.length >= TABS.length) return prev;

      localStorage.setItem("hidden-tabs", JSON.stringify(newHidden));
      return newHidden;
    });
  };

  const [calendarDate, setCalendarDate] = useState(new Date());
  const [systemStats, setSystemStats] = useState({ cpu: 0, ram: 0 });
  const [notificationsList, setNotificationsList] = useState([]);
  const [percent, setPercent] = useState(null);
  const [alert, setAlert] = useState(null);
  const [batteryAlertsEnabled, setBatteryAlertsEnabled] = useState(localStorage.getItem("battery-alerts") !== "false");
  const [islandBorderEnabled, setIslandBorderEnabled] = useState(localStorage.getItem("island-border") === "true");
  const [standbyBorderEnabled, setStandbyEnabled] = useState(localStorage.getItem("standby-mode") === "true");
  const [largeStandbyEnabled, setLargeStandbyEnabled] = useState(localStorage.getItem("large-standby-mode") === "true");
  const [hideNotActiveIslandEnabled, sethideNotActiveIslandEnabled] = useState(localStorage.getItem("hide-island-notactive") === "true");
  const [showInfoWhenIdleEnabled, setShowInfoWhenIdleEnabled] = useState(
    localStorage.getItem("show-info-when-idle") === "true"
  );
  const [hourFormat, setHourFormat] = useState((localStorage.getItem("hour-format") || "12-hr") === "12-hr");
  const [weather, setWeather] = useState({ temp: "", status: "", humidity: "", wind: "" });
  const [weatherUnit, setweatherUnit] = useState(localStorage.getItem("weather-unit") || "f");
  const [theme, setTheme] = useState("default");
  const [bgColor, setBgColor] = useState(localStorage.getItem("bg-color") || "#000000");
  const [textColor, setTextColor] = useState(localStorage.getItem("text-color") || "#FFFFFF");
  const [bgImage, setBgImage] = useState(localStorage.getItem("bg-image") || "none");
  const [browserSearch, setBrowserSearch] = useState("");
  const [clipboard, setClipboard] = useState([]);
  const [charging, setCharging] = useState(false);
  const [chargingAlert, setChargingAlert] = useState(false);
  const [spotifyTrack, setSpotifyTrack] = useState(null);
  const [bluetooth, setBluetooth] = useState(false);
  const [bluetoothAlert, setBluetoothAlert] = useState(false);
  const [cameraInUse, setCameraInUse] = useState(false);
  const [cameraAlert, setCameraAlert] = useState(false);
  const [microphoneInUse, setMicrophoneInUse] = useState(false);
  const [microphoneAlert, setMicrophoneAlert] = useState(false);
  const captureAlertQueue = useRef([]);
  const captureAlertTimer = useRef(null);
  const captureAlertDisplayed = useRef({ camera: false, microphone: false });
  const [tasks, setTasks] = useState(JSON.parse(localStorage.getItem("tasks") || "[]"));
  const [taskText, setTaskText] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [albumHovered, setAlbumHovered] = useState(false);
  const [albumRotation, setAlbumRotation] = useState({ x: 0, y: 0 });

  // Timer / Stopwatch State
  const [timerMode, setTimerMode] = useState("stopwatch");
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Volume HUD State
  const [volumeLevel, setVolumeLevel] = useState(70);
  const [volumeAlert, setVolumeAlert] = useState(false);
  const volumeAlertTimeout = useRef(null);

  const triggerVolumeAlert = (level) => {
    setVolumeLevel(level);
    setVolumeAlert(true);
    clearTimeout(volumeAlertTimeout.current);
    volumeAlertTimeout.current = setTimeout(() => {
      setVolumeAlert(false);
    }, 2000);
  };

  useEffect(() => {
    let interval = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (timerMode === "timer") {
            if (prev <= 1) {
              setIsTimerRunning(false);
              return 0;
            }
            return prev - 1;
          } else {
            return prev + 1;
          }
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerMode]);

  // Tab calculations
  const isMusicActive = !!spotifyTrack;
  const visibleTabs = useMemo(() => {
    return tabOrder.filter(id => {
      if (hiddenTabs.includes(id)) return false;
      if (id === 3 && !isMusicActive) return false;
      return true;
    });
  }, [tabOrder, hiddenTabs, isMusicActive]);

  const [[currentTabId, direction], setTabState] = useState(() => {
    const id = visibleTabs.includes(defaultTabId) ? defaultTabId : (visibleTabs[0] ?? 0);
    return [id, 0];
  });

  const currentTab = currentTabId;
  const totalTabs = visibleTabs.length;

  const [showPausedQuickView, setShowPausedQuickView] = useState(false);
  const pausedTimeout = useRef(null);

  useEffect(() => {
    if (spotifyTrack?.state === 'paused') {
      setShowPausedQuickView(true);
      if (pausedTimeout.current) clearTimeout(pausedTimeout.current);
      pausedTimeout.current = setTimeout(() => {
        setShowPausedQuickView(false);
      }, 3000);
    } else {
      setShowPausedQuickView(false);
      if (pausedTimeout.current) clearTimeout(pausedTimeout.current);
    }
  }, [spotifyTrack?.state]);

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.includes(currentTabId)) {
      setTabState([visibleTabs[0], 0]);
    }
  }, [hiddenTabs, visibleTabs, currentTabId]);
  const albumRef = useRef(null);
  const isDraggingRef = useRef(false);
  const mouseLeaveTimer = useRef(null);

  const updateDragging = (val) => {
    isDraggingRef.current = val;
    setIsDragging(val);
  };
  const [displays, setDisplays] = useState([]);
  const [currentDisplayId, setCurrentDisplayId] = useState(localStorage.getItem("display-id") || "");
  const [weatherLocation, setWeatherLocation] = useState(localStorage.getItem("location") || "");
  const [autoLaunchEnabled, setAutoLaunchEnabled] = useState(localStorage.getItem("auto-launch") === "true");
  const [positionMode, setPositionMode] = useState(localStorage.getItem("position-mode") || localStorage.getItem("side-mode") || "free");

  const [islandX, setIslandX] = useState(() => {
    const saved = localStorage.getItem("island-x");
    const num = Number(saved);
    return (saved !== null && !isNaN(num)) ? Math.max(0, Math.min(100, num)) : 50;
  });

  const [islandY, setIslandY] = useState(() => {
    const saved = localStorage.getItem("island-y");
    const num = Number(saved);
    return (saved !== null && !isNaN(num)) ? Math.max(0, Math.min(1000, num)) : 20;
  });

  const tabVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : direction < 0 ? -300 : 0,
      opacity: 0,
      scale: 0.95,
      filter: "blur(10px)"
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      filter: "blur(0px)"
    },
    exit: (direction) => ({
      x: direction < 0 ? 300 : direction > 0 ? -300 : 0,
      opacity: 0,
      scale: 0.95,
      filter: "blur(10px)"
    })
  };

  const wheelSwipeThreshold = 60;
  const wheelLockout = useRef(false);
  const wheelAccumulator = useRef(0);
  const wheelResetTimeout = useRef(null);
  const swipeStartX = useRef(0);
  const swipeStartY = useRef(0);
  const swipeMoved = useRef(false);
  const suppressClick = useRef(false);
  const swipeThreshold = 60;
  const moveTab = (direction) => {
    const currentIndex = visibleTabs.indexOf(currentTabId);
    if (currentIndex === -1 && visibleTabs.length > 0) {
      setTabState([visibleTabs[0], 1]);
      return;
    }
    if (direction > 0) {
      const nextIndex = (currentIndex + 1) % visibleTabs.length;
      setTabState([visibleTabs[nextIndex], 1]);
    } else if (direction < 0) {
      const prevIndex = (currentIndex - 1 + visibleTabs.length) % visibleTabs.length;
      setTabState([visibleTabs[prevIndex], -1]);
    }
  };

  const settingsContainerRef = useRef(null);
  const isDragScrolling = useRef(false);
  const dragScrollStartY = useRef(0);
  const dragScrollStartTop = useRef(0);

  const handleSettingsMouseDown = (e) => {
    if (e.target.closest("button, select, input, [draggable='true']")) return;
    isDragScrolling.current = true;
    dragScrollStartY.current = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    if (settingsContainerRef.current) {
      dragScrollStartTop.current = settingsContainerRef.current.scrollTop;
    }
  };

  const handleSettingsMouseMove = (e) => {
    if (!isDragScrolling.current || !settingsContainerRef.current) return;
    const currentY = e.clientY ?? (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    const deltaY = currentY - dragScrollStartY.current;
    settingsContainerRef.current.scrollTop = dragScrollStartTop.current - deltaY;
  };

  const handleSettingsMouseUp = () => {
    isDragScrolling.current = false;
  };

  const handleWheelSwipe = (e) => {
    if (wheelLockout.current || isDragging) return;
    
    // Check if wheeling on settings container (Tab 9)
    const settingsElem = e.target.closest("#settings-container");
    if (settingsElem && currentTabId === 9) {
      const isScrollable = settingsElem.scrollHeight > settingsElem.clientHeight;
      if (isScrollable) {
        const atTop = settingsElem.scrollTop <= 1;
        const atBottom = settingsElem.scrollTop + settingsElem.clientHeight >= settingsElem.scrollHeight - 1;
        const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        
        // If scrolling inside settings content (down when not at bottom, or up when not at top), allow content to scroll
        if ((delta > 0 && !atBottom) || (delta < 0 && !atTop)) {
          return;
        }
      }
    }

    // Support both mouse wheel (deltaY) and touch/trackpad swipe (deltaX)
    let delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (e.deltaMode === 1) delta *= 40;
    if (e.deltaMode === 2) delta *= 800;

    if (Math.abs(delta) < 2) return;

    wheelAccumulator.current += delta;
    if (wheelResetTimeout.current) clearTimeout(wheelResetTimeout.current);
    wheelResetTimeout.current = setTimeout(() => {
      wheelAccumulator.current = 0;
    }, 150);

    if (Math.abs(wheelAccumulator.current) >= 30) {
      const isNext = wheelAccumulator.current > 0;
      wheelLockout.current = true;
      wheelAccumulator.current = 0;

      moveTab(isNext ? 1 : -1);
      setTimeout(() => {
        wheelLockout.current = false;
      }, 250);
    }
  };

  const isInteractiveTarget = (target) => {
    const targetTag = target?.tagName;
    return (
      targetTag === "INPUT" ||
      targetTag === "TEXTAREA" ||
      targetTag === "SELECT" ||
      targetTag === "LABEL" ||
      target?.closest?.("button") ||
      target?.closest?.(".radio-label") ||
      target?.closest?.(".task-row") ||
      target?.closest?.(".clipboard-row")
    );
  };

  const handlePointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const target = e.target;
    if (mode !== "large" || isDragging || isInteractiveTarget(target) || target?.closest("#userinput") || target?.id === "userinput") {
      swipeStartX.current = null;
      return;
    }
    swipeStartX.current = e.clientX;
    swipeStartY.current = e.clientY;
    swipeMoved.current = false;
  };

  const handlePointerMove = (e) => {
    if (swipeStartX.current === null || mode !== "large") return;
    const dx = Math.abs(e.clientX - swipeStartX.current);
    const dy = Math.abs(e.clientY - swipeStartY.current);
    if (dx > 8 || dy > 8) {
      swipeMoved.current = true;
      suppressClick.current = true;
    }
  };

  const handlePointerUp = (e) => {
    setTimeout(() => {
      suppressClick.current = false;
    }, 100);

    if (swipeStartX.current === null) return;
    const startX = swipeStartX.current;
    const startY = swipeStartY.current;
    swipeStartX.current = null;

    if (mode !== "large" || isDragging || wheelLockout.current) return;
    if (!swipeMoved.current) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) < swipeThreshold || Math.abs(dx) <= Math.abs(dy)) return;

    wheelLockout.current = true;
    moveTab(dx > 0 ? -1 : 1);
    setTimeout(() => {
      wheelLockout.current = false;
    }, 800);
  };

  const isPlaying = spotifyTrack?.state === 'playing';
  const nowPlayingText = spotifyTrack?.name ? `${spotifyTrack.name}${spotifyTrack.artist ? ` • ${spotifyTrack.artist}` : ''}` : '';
  const textWidth = measureTextWidth(nowPlayingText) || (nowPlayingText.length * 7);
  const hoverExtraWidth = 36;
  const nowPlayingWidth = isHovered ? 135 : 110;
  const width = mode === "large"
    ? (currentTab === 9 ? 495 : currentTab === 1 ? 380 : currentTab === 10 ? 360 : currentTab === 0 ? 405 : currentTab === 4 ? 360 : currentTab === 6 ? 340 : currentTab === 3 ? 380 : 380)
    : (mode === "quick" && isPlaying && !alert && !chargingAlert && !bluetoothAlert && !cameraAlert && !microphoneAlert && !volumeAlert)
      ? nowPlayingWidth
      : (mode === "quick" || alert || chargingAlert || bluetoothAlert || cameraAlert || microphoneAlert || volumeAlert)
        ? 260
        : isPlaying
          ? nowPlayingWidth
          : 170;
  const height = mode === "large"
    ? (currentTab === 9 ? (positionMode === "free" ? 435 : 355) : currentTab === 8 ? 250 : currentTab === 1 ? 210 : currentTab === 4 ? 260 : currentTab === 5 ? 240 : currentTab === 6 ? 180 : currentTab === 10 ? 170 : currentTab === 3 ? 185 : currentTab === 0 ? 120 : 190)
    : 40;

  useEffect(() => {
    if (window.electronAPI?.platform === 'win32') {
      window.electronAPI?.buildAppCache?.();
    }
  }, []);

  useEffect(() => {
    const savedDisplayId = localStorage.getItem("display-id");
    if (savedDisplayId && window.electronAPI?.setDisplay) {
      window.electronAPI.setDisplay(savedDisplayId);
    }

    if (window.electronAPI?.updateWindowPosition) {
      window.electronAPI.updateWindowPosition(islandX, islandY);
    }

    if (window.electronAPI?.setAutoLaunch) {
      window.electronAPI.setAutoLaunch(autoLaunchEnabled);
    }

    if (!localStorage.getItem('newuser')) {
      localStorage.setItem('newuser', 'true');
    }

    if (localStorage.getItem('newuser') === 'true') {
      const timer = setTimeout(() => {
        window.electronAPI?.openExternal ? window.electronAPI.openExternal("https://github.com/TopMyster/Ripple/blob/main/instructions.md") : window.open("https://github.com/TopMyster/Ripple/blob/main/instructions.md", "_blank");
        localStorage.setItem('newuser', 'false');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  // localStorage defaults
  useEffect(() => {
    const defaults = {
      "battery-alerts": "true",
      "default-tab": "2",
      "island-border": "false",
      "hide-island-notactive": "false",
      "standby-mode": "false",
      "hour-format": "12-hr",
      "island-x": "50",
      "island-y": "20",
      "bg-color": "#000000",
      "text-color": "#FFFFFF",
      "weather-unit": "f",
      "auto-launch": "false"
    };
    for (const [key, val] of Object.entries(defaults)) {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, val);
      }
    }
  }, []);

  const handleBatteryAlertsChange = (e) => {
    const value = e.target.value === "true";
    setBatteryAlertsEnabled(value);
    localStorage.setItem("battery-alerts", value ? "true" : "false");
  };

  const handleIslandBorderChange = (e) => {
    const value = e.target.value === "true";
    setIslandBorderEnabled(value);
    localStorage.setItem("island-border", value ? "true" : "false");
  };

  const handleStandbyChange = (e) => {
    const value = e.target.value === "true";
    setStandbyEnabled(value);
    localStorage.setItem("standby-mode", value ? "true" : "false");
  };

  const handleLargeStandbyChange = (e) => {
    const value = e.target.value === "true";
    setLargeStandbyEnabled(value);
    localStorage.setItem("large-standby-mode", value ? "true" : "false");
  };

  const handleHourFormatChange = (e) => {
    const value = e.target.value;
    setHourFormat(value === "12-hr");
    localStorage.setItem("hour-format", value);
  };

  const handleAutoLaunchChange = (e) => {
    const value = e.target.value === "true";
    setAutoLaunchEnabled(value);
    localStorage.setItem("auto-launch", value ? "true" : "false");
    window.electronAPI?.setAutoLaunch(value);
  };

  const handlehideNotActiveIslandChange = (e) => {
    const value = e.target.value === "true";
    sethideNotActiveIslandEnabled(value);
    localStorage.setItem("hide-island-notactive", value ? "true" : "false");
  };

  const handleShowInfoWhenIdleChange = (e) => {
    const value = e.target.value === "true";
    setShowInfoWhenIdleEnabled(value);
    localStorage.setItem("show-info-when-idle", value ? "true" : "false");
  };

  const handleWeatherUnitChange = (e) => {
    const value = e.target.value === "c" ? "c" : "f";
    setweatherUnit(value);
    localStorage.setItem("weather-unit", value);
  };

  const handleBgColorChange = (e) => {
    const value = e.target.value;
    setBgColor(value);
    localStorage.setItem("bg-color", value);
  };

  const handleTextColorChange = (e) => {
    const value = e.target.value;
    setTextColor(value);
    localStorage.setItem("text-color", value);
  };

  const handleDisplayChange = (e) => {
    const displayId = e.target.value;
    setCurrentDisplayId(displayId);
    localStorage.setItem("display-id", displayId);
    if (window.electronAPI?.setDisplay) {
      window.electronAPI.setDisplay(displayId);
    }
  };

  const handleIslandXChange = (e) => {
    const value = Number(e.target.value);
    setIslandX(value);
    window.electronAPI?.updateWindowPosition?.(value, islandY);
  };

  const handleIslandYChange = (e) => {
    const value = Number(e.target.value);
    setIslandY(value);
    window.electronAPI?.updateWindowPosition?.(islandX, value);
  };

  const savePosition = () => {
    localStorage.setItem("island-x", islandX);
    localStorage.setItem("island-y", islandY);
  };

  useEffect(() => {
    if (currentTab === 9 && window.electronAPI?.getDisplays) {
      window.electronAPI.getDisplays().then(setDisplays);
    }
  }, [currentTab]);

  const handleBgImageChange = (e) => {
    const value = e.target.value;
    setBgImage(value);
    localStorage.setItem("bg-image", value);
  };

  // Get battery info
  useEffect(() => {
    let battery, handler;
    (async () => {
      if (!("getBattery" in navigator)) return setPercent(null);
      try {
        battery = await navigator.getBattery();
        const update = () => {
          setPercent(Math.round(battery.level * 100));
          setCharging(battery.charging);
        };
        handler = update;
        update();
        battery.addEventListener("chargingchange", handler);
        battery.addEventListener("levelchange", handler);
      } catch {
        setPercent(null);
      }
    })();

    return () => {
      if (battery && handler) {
        battery.removeEventListener("levelchange", handler);
        battery.removeEventListener("chargingchange", handler);
      }
    };
  }, []);

  // Battery alerts
  useEffect(() => {
    if (
      typeof percent === "number" &&
      (percent === 20 || percent === 15 || percent === 10 || percent === 5 || percent === 3) &&
      localStorage.getItem("battery-alerts") === "true"
    ) {
      setMode("quick");
      setAlert(true);
      const timerId = setTimeout(() => {
        setMode("still");
        setAlert(null);
      }, 3000);
      return () => {
        clearTimeout(timerId);
      };
    }
  }, [percent]);

  useEffect(() => {
    if (
      (charging === true) &&
      localStorage.getItem("battery-alerts") === "true"
    ) {
      setMode("quick");
      setChargingAlert(true);
      const timerId = setTimeout(() => {
        setMode("still");
        setChargingAlert(false);
      }, 1500);
      return () => {
        clearTimeout(timerId);
      };
    }
  }, [charging]);


  // Get time
  useEffect(() => {
    const updateTime = () => {
      const date = new Date();
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, "0");
      if (hourFormat) {
        hours = hours % 12;
        hours = hours ? hours : 12;
      }
      setTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [hourFormat]);

  //Standby Mode 
  useEffect(() => {
    if (standbyBorderEnabled && mode === 'still') {
      setMode('quick');
    } else if (largeStandbyEnabled && mode === 'still') {
      setMode('large');
    }
  }, [standbyBorderEnabled, largeStandbyEnabled]);

  // Get Weather
  useEffect(() => {
    let isCancelled = false;
    const getWeather = async () => {
      const loc = localStorage.getItem("location") || weatherLocation;
      const unit = localStorage.getItem("weather-unit") || weatherUnit || "f";
      const q = loc && loc.trim() ? encodeURIComponent(loc.trim()) : "auto:ip";

      try {
        const response = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=0b18c67c443543e0a6045401250911&q=${q}&aqi=no`
        );
        if (response.ok) {
          const data = await response.json();
          if (data?.current && !isCancelled) {
            const key = unit === "c" ? "temp_c" : "temp_f";
            const tempVal = Math.round(data.current[key]);
            if (!isNaN(tempVal)) {
              setWeather({
                temp: tempVal,
                status: data.current.condition?.text || "",
                humidity: data.current.humidity ? `${data.current.humidity}%` : "",
                wind: data.current.wind_mph ? `${Math.round(data.current.wind_mph)} mph` : ""
              });
              return;
            }
          }
        }
      } catch (e) {
        console.error("WeatherAPI fetch failed, attempting fallback...", e);
      }

      // Fallback: wttr.in open weather API
      try {
        const fallbackQuery = loc && loc.trim() ? encodeURIComponent(loc.trim()) : "";
        const fallbackRes = await fetch(`https://wttr.in/${fallbackQuery}?format=j1`);
        if (fallbackRes.ok && !isCancelled) {
          const data = await fallbackRes.json();
          const current = data?.current_condition?.[0];
          if (current) {
            const rawTemp = unit === "c" ? parseFloat(current.temp_C) : parseFloat(current.temp_F);
            const tempVal = Math.round(rawTemp);
            if (!isNaN(tempVal)) {
              setWeather({
                temp: tempVal,
                status: current.weatherDesc?.[0]?.value || "",
                humidity: current.humidity ? `${current.humidity}%` : "",
                wind: current.windspeedMiles ? `${current.windspeedMiles} mph` : ""
              });
            }
          }
        }
      } catch (err) {
        console.error("Weather fallback fetch failed", err);
      }
    };

    getWeather();
    const interval = setInterval(getWeather, 600000); // 10 mins
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [weatherLocation, weatherUnit]);

  // Set theme
  useEffect(() => {
    if (theme === "sleek-black") {
      localStorage.setItem("bg-color", "#000000");
      localStorage.setItem("text-color", "#FFFFFF");
      setBgColor("#000000");
      setTextColor("#FFFFFF");
    } else if (theme === "win95") {
      localStorage.setItem("bg-color", "rgba(195, 195, 195)");
      localStorage.setItem("text-color", "rgba(0, 0, 0)");
      setBgColor("rgba(195, 195, 195)");
      setTextColor("rgba(0, 0, 0)");
    } else if (theme === "invisible") {
      localStorage.setItem("bg-image", "none");
      setBgImage("none");
      localStorage.setItem("bg-color", "rgba(255, 255, 255, 0)");
      localStorage.setItem("text-color", "rgba(0, 0, 0, 0)");
      setBgColor("rgba(255, 255, 255, 0)");
      setTextColor("rgba(0, 0, 0, 0)");
    } else if (theme === "none") {
      const defaultBg = "#000000";
      const defaultText = "#FFFFFF";
      localStorage.setItem("bg-color", defaultBg);
      localStorage.setItem("text-color", defaultText);
      setBgColor(defaultBg);
      setTextColor(defaultText);
    }
  }, [theme]);

  // Browser Search Feature
  function searchBrowser() {
    const trimmedSearch = browserSearch.trim();
    if (!trimmedSearch) return;
    if (trimmedSearch.includes(".")) {
      const hasProtocol = /^https?:\/\//i.test(trimmedSearch);
      const urlToOpen = hasProtocol ? trimmedSearch : `https://${trimmedSearch}`;
      window.electronAPI?.openExternal ? window.electronAPI.openExternal(urlToOpen) : window.open(urlToOpen, "_blank");
    } else {
      const encodedQuery = encodeURIComponent(trimmedSearch);
      window.electronAPI?.openExternal ? window.electronAPI.openExternal(`https://www.google.com/search?q=${encodedQuery}`) : window.open(`https://www.google.com/search?q=${encodedQuery}`, "_blank");
    }
  }

  // Clipboard 
  const clearAllClipboard = () => {
    if (window.electronAPI?.clearClipboard) {
      window.electronAPI.clearClipboard();
    } else if (window.electronAPI?.writeClipboardText) {
      window.electronAPI.writeClipboardText("");
    }
    setClipboard([]);
  };

  const removeClipboardItem = (indexToRemove) => {
    setClipboard((prev) => {
      const updated = prev.filter((_, i) => i !== indexToRemove);
      if (indexToRemove === 0) {
        if (window.electronAPI?.clearClipboard) {
          window.electronAPI.clearClipboard();
        } else if (window.electronAPI?.writeClipboardText) {
          window.electronAPI.writeClipboardText("");
        }
      }
      return updated;
    });
  };

  async function getClipboard() {
    try {
      let text = "";
      if (window.electronAPI?.getClipboardText) {
        text = await window.electronAPI.getClipboardText();
      } else if (navigator.clipboard && navigator.clipboard.readText) {
        text = await navigator.clipboard.readText();
      }
      if (!text || !text.trim()) return;

      setClipboard((prevClipboard) => {
        if (prevClipboard[0] === text) {
          return prevClipboard;
        }
        const filtered = prevClipboard.filter(item => item && item !== text && item.trim().length > 0);
        return [text, ...filtered].slice(0, 50);
      });
    } catch (error) {
      console.log(
        `Error reading clipboard: ${error.toString()}`,
      );
    }
  }

  useEffect(() => {
    getClipboard();
    const interval = setInterval(getClipboard, 1500);
    return () => clearInterval(interval);
  }, []);

  // Get Bluetooth
  useEffect(() => {
    const fetchBluetooth = async () => {
      if (window.electronAPI?.getBluetoothStatus) {
        try {
          const isConnected = await window.electronAPI.getBluetoothStatus();
          setBluetooth(isConnected);
        } catch (e) {
          console.error(e);
        }
      }
    };

    fetchBluetooth();
    const interval = setInterval(fetchBluetooth, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (bluetooth === true) {
      setMode("quick");
      setBluetoothAlert(true);
      const timerId = setTimeout(() => {
        setMode("still");
        setBluetoothAlert(false);
      }, 3000);
      return () => {
        clearTimeout(timerId);
      };
    }
  }, [bluetooth]);

  // Get Camera Status
  useEffect(() => {
    const fetchCamera = async () => {
      if (window.electronAPI?.getCameraStatus) {
        try {
          const inUse = await window.electronAPI.getCameraStatus();
          setCameraInUse(inUse);
        } catch (e) {
          console.error(e);
        }
      }
    };

    fetchCamera();
    const interval = setInterval(fetchCamera, 3000); // Check every 3 seconds
    return () => clearInterval(interval);
  }, []);

  // Get Microphone Status
  useEffect(() => {
    const fetchMicrophone = async () => {
      if (window.electronAPI?.getMicrophoneStatus) {
        try {
          const inUse = await window.electronAPI.getMicrophoneStatus();
          setMicrophoneInUse(inUse);
        } catch (e) {
          console.error(e);
        }
      }
    };

    fetchMicrophone();
    const interval = setInterval(fetchMicrophone, 3000); // Check every 3 seconds
    return () => clearInterval(interval);
  }, []);

  // Get System Metrics (CPU, RAM)
  useEffect(() => {
    const fetchMetrics = async () => {
      if (window.electronAPI?.getSystemMetrics) {
        try {
          const stats = await window.electronAPI.getSystemMetrics();
          setSystemStats(stats);
        } catch (e) {
          console.error(e);
        }
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const processCaptureQueue = () => {
      if (captureAlertTimer.current || captureAlertQueue.current.length === 0) return;
      const nextAlert = captureAlertQueue.current.shift();
      if (!nextAlert) return;

      setMode("quick");
      if (nextAlert === "camera") {
        setCameraAlert(true);
      } else {
        setMicrophoneAlert(true);
      }

      captureAlertTimer.current = setTimeout(() => {
        if (nextAlert === "camera") {
          setCameraAlert(false);
        } else {
          setMicrophoneAlert(false);
        }
        captureAlertTimer.current = null;
        if (captureAlertQueue.current.length > 0) {
          processCaptureQueue();
        } else {
          setMode("still");
        }
      }, 3000);
    };

    if (cameraInUse && !captureAlertDisplayed.current.camera) {
      captureAlertQueue.current.push("camera");
      captureAlertDisplayed.current.camera = true;
    }
    if (!cameraInUse) {
      captureAlertDisplayed.current.camera = false;
    }

    if (microphoneInUse && !captureAlertDisplayed.current.microphone) {
      captureAlertQueue.current.push("microphone");
      captureAlertDisplayed.current.microphone = true;
    }
    if (!microphoneInUse) {
      captureAlertDisplayed.current.microphone = false;
    }

    captureAlertQueue.current = captureAlertQueue.current.filter((item) => {
      if (item === "camera" && !cameraInUse) return false;
      if (item === "microphone" && !microphoneInUse) return false;
      return true;
    });

    processCaptureQueue();

    return () => {
      if (!cameraInUse && !microphoneInUse) {
        if (captureAlertTimer.current) {
          clearTimeout(captureAlertTimer.current);
          captureAlertTimer.current = null;
        }
        captureAlertQueue.current = [];
      }
    };
  }, [cameraInUse, microphoneInUse]);

  // Mouse Safety & Renderer Error Logging Effect
  useEffect(() => {
    const handleGlobalError = (event) => {
      if (window.electronAPI?.logMessage) {
        window.electronAPI.logMessage('error', 'Unhandled Renderer Exception', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          error: event.error?.stack || String(event.error)
        });
      }
    };

    const handleUnhandledRejection = (event) => {
      if (window.electronAPI?.logMessage) {
        window.electronAPI.logMessage('error', 'Unhandled Renderer Rejection', {
          reason: event.reason?.stack || String(event.reason)
        });
      }
    };

    // Safety mouse position tracker: if mouse leaves island rect, release mouse lock once
    let isIgnoringMouse = false;
    const handleMouseMove = (e) => {
      const islandElem = document.getElementById("Island");
      if (!islandElem) return;
      const rect = islandElem.getBoundingClientRect();
      const padding = 25;
      const isInside = (
        e.clientX >= rect.left - padding &&
        e.clientX <= rect.right + padding &&
        e.clientY >= rect.top - padding &&
        e.clientY <= rect.bottom + padding
      );

      if (!isInside && !isDraggingRef.current) {
        if (!isIgnoringMouse) {
          isIgnoringMouse = true;
          if (window.electronAPI?.setIgnoreMouseEvents) {
            window.electronAPI.setIgnoreMouseEvents(true, true);
          }
        }
      } else if (isInside) {
        isIgnoringMouse = false;
      }
    };

    window.addEventListener("error", handleGlobalError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("error", handleGlobalError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const [mediaPosition, setMediaPosition] = useState(0);

  // Sync position from spotifyTrack when track info updates from backend
  useEffect(() => {
    if (spotifyTrack && spotifyTrack.position !== undefined) {
      setMediaPosition(spotifyTrack.position);
    }
  }, [spotifyTrack?.name, spotifyTrack?.artist, spotifyTrack?.position]);

  // Continuously advance position every 500ms when playing
  useEffect(() => {
    if (spotifyTrack?.state !== 'playing') return;
    const timer = setInterval(() => {
      setMediaPosition(prev => {
        const dur = spotifyTrack?.duration || 0;
        return (dur > 0 && prev >= dur) ? dur : prev + 0.5;
      });
    }, 500);
    return () => clearInterval(timer);
  }, [spotifyTrack?.state, spotifyTrack?.duration]);

  // Now Playing
  useEffect(() => {
    const fetchMedia = async () => {
      if (window.electronAPI?.getSystemMedia) {
        try {
          const track = await window.electronAPI.getSystemMedia();
          setSpotifyTrack(track);
        } catch (e) {
          console.error(e);
        }
      }
    };

    fetchMedia();
    const interval = setInterval(fetchMedia, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => localStorage.setItem("tasks", JSON.stringify(tasks)), [tasks]);

  function copyToClipboard(text) {
    if (!text) return;
    if (window.electronAPI?.writeClipboardText) {
      return window.electronAPI.writeClipboardText(text);
    } else if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      return navigator.clipboard.writeText(text);
    }
  }

  function addTask() {
    if (taskText.trim()) {
      setTasks((prev) => [...prev, taskText.trim()]);
      setTaskText("");
    }
  }

  function removeTask(index) {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  }

  // Keyboard Shortcuts and Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") {
        moveTab(1);
      } else if (e.key === "ArrowLeft") {
        moveTab(-1);
      } else if (e.ctrlKey && e.key >= "1" && e.key <= "8") {
        const idx = parseInt(e.key) - 1;
        if (visibleTabs[idx] !== undefined) {
          const targetId = visibleTabs[idx];
          setMode("large");
          setTabState([targetId, targetId > currentTabId ? 1 : -1]);
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [moveTab, visibleTabs, currentTabId]);

  useEffect(() => {
    const handleFocusOut = () => {
      // Reset album hover state when window loses focus
      setAlbumHovered(false);
      setAlbumRotation({ x: 0, y: 0 });

      setTimeout(() => {
        if (!isHovered) {
          const activeTag = document.activeElement?.tagName;
          if (activeTag !== "INPUT" && activeTag !== "TEXTAREA" && activeTag !== "SELECT") {
            if (standbyBorderEnabled) {
              setMode("quick");
            } else if (largeStandbyEnabled) {
              setMode("large");
            } else {
              setMode("still");
            }
          }
        }
      }, 100);
    };

    window.addEventListener("focusout", handleFocusOut);
    return () => window.removeEventListener("focusout", handleFocusOut);
  }, [isHovered, standbyBorderEnabled, largeStandbyEnabled]);

  useEffect(() => {
    if (!isDragging && !isHovered) {
      const activeTag = document.activeElement?.tagName;
      if (activeTag !== "INPUT" && activeTag !== "TEXTAREA") {
        if (standbyBorderEnabled) {
          setMode("quick");
        } else if (largeStandbyEnabled) {
          setMode("large");
        } else {
          setMode("still");
        }
      }
    }
  }, [isDragging, isHovered, standbyBorderEnabled, largeStandbyEnabled]);

  const handleDragEndChecks = (e) => {
    updateDragging(false);
    suppressClick.current = false;
  };

  const isFree = positionMode === "free";
  const getSideStyles = () => {
    switch (positionMode) {
      case 'top-left': return { left: '15px', top: '15px', x: '0%' };
      case 'top-right': return { left: 'calc(100% - 15px)', top: '15px', x: '-100%' };
      case 'bottom-left': return { left: '15px', top: 'auto', bottom: '45px', x: '0%' };
      case 'bottom-right': return { left: 'calc(100% - 15px)', top: 'auto', bottom: '45px', x: '-100%' };
      case 'top-center': return { left: '49.8%', top: '20px', x: '-50%' };
      case 'bottom-center': return { left: '49.8%', top: 'auto', bottom: '45px', x: '-50%' };
      default: return { left: `${islandX}%`, top: `${islandY}px`, x: '-50%' };
    }
  };
  const sideStyles = getSideStyles();

  return (
    <motion.div
      id="Island"
      onMouseEnter={() => {
        if (mouseLeaveTimer.current) {
          clearTimeout(mouseLeaveTimer.current);
          mouseLeaveTimer.current = null;
        }
        setIsHovered(true);
        setMode("large");
        if (window.electronAPI) {
          window.electronAPI.setIgnoreMouseEvents(false, true);
        }
      }}
      onMouseLeave={() => {
        suppressClick.current = false;
        if (isDraggingRef.current) return;
        if (mouseLeaveTimer.current) clearTimeout(mouseLeaveTimer.current);
        mouseLeaveTimer.current = setTimeout(() => {
          mouseLeaveTimer.current = null;
          setIsHovered(false);
          if (window.electronAPI) {
            window.electronAPI.setIgnoreMouseEvents(true, true);
          }

          const activeTag = document.activeElement?.tagName;
          if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;

          if (standbyBorderEnabled) {
            setMode("quick");
          } else if (largeStandbyEnabled) {
            setMode("large");
          } else {
            setMode("still");
          }
        }, 150);
      }}
      onClick={(e) => {
        if (suppressClick.current) {
          suppressClick.current = false;
          return;
        }
        if (isInteractiveTarget(e.target)) return;

        const activeTag = document.activeElement?.tagName;
        if (activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT") {
          document.activeElement.blur();
        }

        setMode(prev => prev === "large" ? "quick" : "large");
        if (window.electronAPI) {
          window.electronAPI.setIgnoreMouseEvents(false, true);
        }
      }}
      onWheel={handleWheelSwipe}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      initial={{
        x: sideStyles.x,
        left: sideStyles.left,
        top: sideStyles.top || 'auto',
        bottom: sideStyles.bottom || 'auto',
      }}
      animate={{
        width: `${width}px`,
        height: `${height}px`,
        left: sideStyles.left,
        top: sideStyles.top || 'auto',
        bottom: sideStyles.bottom || 'auto',
        backgroundColor: bgColor || "#000000",
        color: textColor || "#FFFFFF",
        scale: isHovered ? 1.05 : 1,
        x: sideStyles.x,
        borderRadius:
          mode === "large" && theme === "win95"
            ? 0
            : mode === "large"
              ? (currentTab === 0 ? 28 : 30)
              : theme === "win95"
                ? 0
                : 14,
      }}
      onAnimationStart={() => {
        setIsTransitioning(true);
      }}
      onAnimationComplete={() => {
        setIsTransitioning(false);
      }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 40,
        mass: 2.5,
        x: { duration: .15 }
      }}
      style={{
        display: "flex",
        alignItems: "center",
        backgroundImage: `url('${bgImage}')`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        backgroundSize: "cover",
        justifyContent: (mode === "large" && currentTab === 3) ? "flex-start" : "center",
        overflow: "hidden",
        fontFamily: theme === "win95" ? "w95" : "OpenRunde",
        border: theme === "win95" ? "2px solid rgb(254, 254, 254)" : islandBorderEnabled ? cameraInUse ? `1px solid rgba(255, 215, 0, 0.8)` : microphoneInUse ? `1px solid rgba(255, 154, 0, 0.8)` : (charging || chargingAlert) ? `1px solid rgba(111, 255, 123, 0.5)` : (percent <= 20 || alert) ? `1px solid rgba(255, 63, 63, 0.5)` : bluetoothAlert ? `1px solid rgba(0, 150, 255, 0.34)` : hideNotActiveIslandEnabled ? "none" : `1px solid color-mix(in srgb, ${textColor}, transparent 70%)` : "none",
        borderColor:
          theme === "win95"
            ? "#FFFFFF #808080 #808080 #FFFFFF"
            : "none",

        boxShadow: hideNotActiveIslandEnabled && mode === 'still' ? "none" : isHovered ? '0 0 32px rgba(0, 0, 0, 0.25)' : '0 0 24px rgba(0, 0, 0, 0.12)',
        '--island-text-color': textColor,
        '--island-bg-color': bgColor,
        position: 'fixed',
        margin: 0,
        transition: 'box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: isTransitioning ? 'auto' : (window.electronAPI?.platform === 'linux' && mode === 'still' && !isHovered) ? 'none' : 'auto'
      }}
    >
      {/*Quickview*/}
      {mode !== "large" && (mode === "quick" || (mode === "still" && showInfoWhenIdleEnabled) || (mode === "still" && (isPlaying || showPausedQuickView)) || alert || chargingAlert || bluetoothAlert || cameraAlert || microphoneAlert) ? (
        <AnimatePresence mode="wait">
          {(isPlaying || showPausedQuickView) && !alert && !chargingAlert && !bluetoothAlert && !cameraAlert && !microphoneAlert ? (
            <motion.div
              key={spotifyTrack?.name ? `playing-${spotifyTrack.name}-${spotifyTrack.artist}` : "playing"}
              initial={{ opacity: 0, filter: 'blur(4px)', scale: 0.98 }}
              animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
              exit={{ opacity: 0, filter: 'blur(4px)', scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1], filter: { duration: 0.05 } }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                minWidth: 0,
                boxSizing: 'border-box',
                opacity: showPausedQuickView ? 0.5 : (hideNotActiveIslandEnabled ? .6 : 1),
                filter: showPausedQuickView ? 'grayscale(1)' : 'none',
                padding: '0 9px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'visible', flex: 1, minWidth: 0, userSelect: 'none', perspective: '1200px' }}>
                {spotifyTrack?.artwork_url ? (
                  <div style={{ perspective: '1200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      src={spotifyTrack.artwork_url}
                      onClick={() => openMusicPlayer(spotifyTrack.source)}
                      onMouseEnter={() => setAlbumHovered(true)}
                      onMouseLeave={() => {
                        setAlbumHovered(false);
                        setAlbumRotation({ x: 0, y: 0 });
                      }}
                      onMouseMove={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const centerX = rect.left + rect.width / 2;
                        const centerY = rect.top + rect.height / 2;
                        const deltaX = e.clientX - centerX;
                        const deltaY = e.clientY - centerY;
                        const maxDistance = Math.sqrt(rect.width * rect.width + rect.height * rect.height) / 2;
                        const angleX = (deltaY / maxDistance) * 35;
                        const angleY = (deltaX / maxDistance) * -35;
                        setAlbumRotation({ x: angleX, y: angleY });
                      }}
                      style={{
                        width: 24, height: 24, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, cursor: 'pointer',
                        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.3s ease-out',
                        transform: `rotateX(${albumRotation.x}deg) rotateY(${albumRotation.y}deg) scale(${albumHovered ? 1.25 : 1}) translateZ(0)`,
                        transformStyle: 'preserve-3d',
                        filter: albumHovered ? 'drop-shadow(0 10px 20px rgba(0,0,0,0.4))' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                        willChange: 'transform'
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0 }}>
                    <Music size={14} color={textColor} />
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 3,
                  paddingRight: 6,
                  height: 18,
                  flex: 1
                }}>
                  {[0.4, 0.9, 0.55, 0.8].map((delay, i) => (
                    <motion.span
                      key={`waveform-bar-${i}`}
                      animate={{
                        scaleY: isPlaying ? [0.3, 1, 0.35, 0.95, 0.3] : 0.3
                      }}
                      transition={{
                        duration: 0.65,
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: i * 0.14,
                        ease: "easeInOut"
                      }}
                      style={{
                        width: 3,
                        height: 14,
                        backgroundColor: '#1DB954',
                        borderRadius: 2,
                        transformOrigin: 'bottom',
                        display: 'inline-block'
                      }}
                    />
                  ))}
                </div>
                <AnimatePresence>
                  {isHovered && (
                    <motion.button
                      key="play-pause-hover"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 30 }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.electronAPI.controlSystemMedia('playpause');
                      }}
                      onMouseEnter={() => {
                        if (window.electronAPI) window.electronAPI.setIgnoreMouseEvents(false, false);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        padding: 0,
                        marginLeft: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        overflow: 'hidden',
                        zIndex: 100,
                        willChange: 'opacity, width',
                        WebkitBackfaceVisibility: 'hidden',
                        backfaceVisibility: 'hidden',
                        transform: 'translateZ(0)'
                      }}
                    >
                      {spotifyTrack?.state === 'playing' ? <Pause size={15} color="#FFFFFF" fill="#FFFFFF" /> : <Play size={15} color="#FFFFFF" fill="#FFFFFF" />}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={chargingAlert ? "charging" : alert ? "battery" : bluetoothAlert ? "bluetooth" : cameraAlert ? "camera" : microphoneAlert ? "microphone" : "time"}
              initial={{ opacity: 0, filter: 'blur(4px)', scale: 0.98 }}
              animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
              exit={{ opacity: 0, filter: 'blur(4px)', scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1], filter: { duration: 0.05 } }}
              style={{ width: '100%', height: '100%', position: 'relative' }}
            >
              <h1
                className="text"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "15px",
                  transform: "translateY(-50%)",
                  fontSize: 16,
                  fontWeight: 600,
                  margin: 0,
                  color: chargingAlert ? "#6fff7bff" : alert ? "#ff3f3fff" : cameraAlert ? "#ffff00ff" : microphoneAlert ? "#ff9a00ff" : textColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  lineHeight: 1
                }}
              >
                {chargingAlert ? (
                  <Zap size={20} color="#6fff7b" />
                ) : alert ? (
                  <Zap size={20} color="#ff3f3f" />
                ) : cameraAlert ? (
                  <Camera size={20} color="#ffff00" />
                ) : microphoneAlert ? (
                  <Mic size={20} color="#ff9a00" />
                ) : volumeAlert ? (
                  volumeLevel === 0 ? <VolumeX size={20} color="#ff4d4d" /> : <Volume2 size={20} color="#4cc9f0" />
                ) : bluetoothAlert ? <Headphones size={20} /> : time}
              </h1>
              <h1
                className="text"
                style={{
                  position: "absolute",
                  top: "50%",
                  right: "15px",
                  transform: "translateY(-50%)",
                  fontSize: 16,
                  fontWeight: 600,
                  margin: 0,
                  color: chargingAlert
                    ? "#6fff7bff"
                    : alert
                      ? "#ff3f3fff"
                      : cameraAlert
                        ? "#ffff00ff"
                        : microphoneAlert
                          ? "#ff9a00ff"
                          : volumeAlert
                            ? "#4cc9f0ff"
                            : `${textColor}`,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {alert === true ? (percent !== null ? `${percent}%` : '--') : chargingAlert === true ? (percent !== null ? `${percent}%` : '--') : standbyBorderEnabled ? (percent !== null ? `${percent}%` : '--') : cameraAlert ? "Camera" : microphoneAlert ? "Microphone" : volumeAlert ? `${volumeLevel}%` : bluetoothAlert ? "Connected" : (typeof weather.temp === "number" && !isNaN(weather.temp)) ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <WeatherIcon status={weather.status} size={14} color={textColor} />
                    <span>{weather.temp}º</span>
                  </div>
                ) : (percent !== null ? `${percent}%` : '--')}
              </h1>
            </motion.div>
          )
          }
        </AnimatePresence >
      ) : null}

      <AnimatePresence custom={direction} mode="popLayout">
        {mode === "large" && (
          <motion.div
            key={currentTabId}
            custom={direction}
            variants={tabVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 400, damping: 40 },
              opacity: { duration: 0.15 }
            }}
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "absolute"
            }}
          >
            {/*Browser Search*/}
            {currentTab === 0 && (
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <input
                  id="browser-searchbar"
                  placeholder="Search google or enter URL"
                  value={browserSearch}
                  onChange={(e) => setBrowserSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      searchBrowser();
                    }
                  }}
                  style={{ color: textColor }}
                />
              </div>
            )}

            {/* Weather Dashboard */}
            {currentTab === 1 && (
              <div style={{
                width: '90%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '12px',
                padding: '10px 0',
                boxSizing: 'border-box'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', opacity: 0.8 }}>
                      {localStorage.getItem("location") || weatherLocation || "Current Location"}
                    </span>
                    <div style={{ fontSize: 12, opacity: 0.6, marginTop: 2 }}>
                      {weather.status || "Fair"}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <WeatherIcon status={weather.status} size={28} color={textColor} />
                    <span style={{ fontSize: 26, fontWeight: 700 }}>
                      {typeof weather.temp === "number" && !isNaN(weather.temp) ? `${weather.temp}°` : "--"}
                    </span>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  width: '100%',
                  marginTop: '4px'
                }}>
                  <div style={{
                    backgroundColor: `color-mix(in srgb, ${textColor}, transparent 94%)`,
                    border: `1px solid color-mix(in srgb, ${textColor}, transparent 90%)`,
                    borderRadius: '12px',
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: 10, opacity: 0.5, fontWeight: 600, textTransform: 'uppercase' }}>Feels Like</span>
                    <span style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>
                      {typeof weather.temp === "number" ? `${weather.temp}°` : "--"}
                    </span>
                  </div>

                  <div style={{
                    backgroundColor: `color-mix(in srgb, ${textColor}, transparent 94%)`,
                    border: `1px solid color-mix(in srgb, ${textColor}, transparent 90%)`,
                    borderRadius: '12px',
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: 10, opacity: 0.5, fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Droplets size={10} /> Humidity
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>
                      {weather.humidity || "52%"}
                    </span>
                  </div>

                  <div style={{
                    backgroundColor: `color-mix(in srgb, ${textColor}, transparent 94%)`,
                    border: `1px solid color-mix(in srgb, ${textColor}, transparent 90%)`,
                    borderRadius: '12px',
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: 10, opacity: 0.5, fontWeight: 600, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Wind size={10} /> Wind
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>
                      {weather.wind || "8 mph"}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {/*Overview tab*/}
            {currentTab === 2 && (
              <>
                <div id="battery" style={{ animation: 'none' }}>
                  <div
                    id="battery-bar"
                    style={{
                      backgroundColor: localStorage.getItem('text-color'),
                      color: bgColor
                    }}
                  >
                    <h1 className="text" style={{ animation: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
                      {charging && <Zap size={16} />}
                      <span>{percent}%</span>
                    </h1>
                  </div>
                </div>
                <h1
                  className="text"
                  style={{
                    fontSize: 15,
                    left: 25,
                    top: 14,
                    position: "absolute",
                    animation: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <WeatherIcon status={weather.status} size={16} color={textColor} />
                    <span>{typeof weather.temp === "number" && !isNaN(weather.temp) ? weather.temp : "??"}º</span>
                  </div>
                </h1>
                <div id="date">
                  <h1 className="text" style={{ fontSize: 50, animation: 'none' }}>
                    {time}
                  </h1>
                  <h2 className="text" style={{ fontSize: 15, animation: 'none' }}>
                    {formatDateShort()}
                  </h2>
                </div>
              </>
            )}

            {/* Now Playing*/}
            {currentTab === 3 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                height: '100%',
                userSelect: 'none'
              }}>
                <AnimatePresence mode="wait">
                  {spotifyTrack ? (
                    <motion.div
                      key={spotifyTrack.name + spotifyTrack.artist}
                      initial={{ opacity: 0, filter: 'blur(10px)', scale: 0.95 }}
                      animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
                      exit={{ opacity: 0, filter: 'blur(10px)', scale: 0.95 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '14px 18px',
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        borderRadius: 24
                      }}
                    >
                      {/* Full-bleed background album art */}
                      {spotifyTrack.artwork_url && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            bottom: 0,
                            left: 0,
                            backgroundImage: `url("${spotifyTrack.artwork_url}")`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            filter: 'brightness(0.65)',
                            borderRadius: 'inherit',
                            zIndex: 0
                          }}
                        />
                      )}
                      
                      {/* Vignette gradient dark overlay */}
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.25) 100%), linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 70%)',
                          borderRadius: 'inherit',
                          zIndex: 1
                        }}
                      />

                      {/* Content Layer */}
                      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', padding: '2px 4px' }}>
                        {/* Top App Name Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 400, color: 'rgba(255,255,255,0.75)' }}>
                          <Music size={14} color="rgba(255,255,255,0.85)" />
                          <span>{spotifyTrack.source ? (spotifyTrack.source.charAt(0).toUpperCase() + spotifyTrack.source.slice(1)) : 'Other device'}</span>
                        </div>

                        {/* Middle Title & Artist */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 2 }}>
                          <ScrollingTitle text={spotifyTrack.name || "Unknown Title"} fontSize={15} />
                          <p
                            style={{
                              margin: 0,
                              fontSize: 13,
                              fontWeight: 400,
                              color: 'rgba(255,255,255,0.65)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '300px',
                              fontFamily: 'OpenRunde, system-ui, sans-serif'
                            }}
                          >
                            {spotifyTrack.artist || "Unknown Artist"}
                          </p>
                        </div>

                        {/* Progress Waveform Scrubber Timeline */}
                        <WaveformScrubber
                          position={mediaPosition}
                          duration={spotifyTrack.duration || 0}
                          isPlaying={spotifyTrack.state === 'playing'}
                          onSeek={(sec) => {
                            setMediaPosition(sec);
                            window.electronAPI.controlSystemMedia('seek', sec);
                          }}
                        />

                        {/* Bottom Middle 3 Playback Control Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 32, marginTop: 2 }}>
                          {/* 1. Previous button */}
                          <button
                            className="media-btn"
                            onClick={() => window.electronAPI.controlSystemMedia('previous')}
                            style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', opacity: 0.9, padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <SkipBackIcon size={22} color="#ffffff" fill="#ffffff" />
                          </button>

                          {/* 2. Center Play/Pause button */}
                          <button
                            className="media-btn"
                            onClick={() => window.electronAPI.controlSystemMedia('playpause')}
                            style={{
                              background: 'rgba(255,255,255,0.16)',
                              backdropFilter: 'blur(8px)',
                              border: '1px solid rgba(255,255,255,0.25)',
                              borderRadius: '50%',
                              width: 40,
                              height: 40,
                              color: '#ffffff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 10px rgba(0,0,0,0.35)'
                            }}
                          >
                            {spotifyTrack.state === 'playing' ? <Pause size={20} color="#ffffff" fill="#ffffff" /> : <Play size={20} color="#ffffff" fill="#ffffff" />}
                          </button>

                          {/* 3. Next button */}
                          <button
                            className="media-btn"
                            onClick={() => window.electronAPI.controlSystemMedia('next')}
                            style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', opacity: 0.9, padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <SkipForwardIcon size={22} color="#ffffff" fill="#ffffff" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="nothing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={{
                        width: '100%',
                        textAlign: 'center',
                        color: textColor,
                        fontFamily: theme === "win95" ? "w95" : "OpenRunde"
                      }}
                    >
                      <h3 style={{ margin: 0, fontSize: 16 }}>Nothing Playing</h3>
                      <p style={{ margin: '5px 0 0 0', opacity: 0.7, fontSize: 13 }}>Play music on Spotify or Apple Music</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Calendar Tab */}
            {currentTab === 4 && (
              <div className="calendar-container">
                <div className="calendar-header">
                  <button
                    className="calendar-nav-btn"
                    onClick={() => {
                      setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <h3 className="calendar-month-title">
                    {calendarDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                  </h3>
                  <button
                    className="calendar-nav-btn"
                    onClick={() => {
                      setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
                <div className="calendar-grid">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                    <div key={`cal-h-${idx}`} className="calendar-day-header">{day}</div>
                  ))}
                  {getCalendarDays(calendarDate.getFullYear(), calendarDate.getMonth()).map((item, idx) => {
                    const today = new Date();
                    const isToday = item.isCurrentMonth &&
                      item.day === today.getDate() &&
                      calendarDate.getMonth() === today.getMonth() &&
                      calendarDate.getFullYear() === today.getFullYear();
                    return (
                      <div
                        key={`cal-d-${idx}`}
                        className={`calendar-day-cell ${!item.isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
                      >
                        {item.day}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {currentTab === 5 && (
              <div className="notifications-container">
                {notificationsList.length === 0 ? (
                  <div style={{ textAlign: 'center', opacity: 0.5, marginTop: 40, fontSize: 13 }}>
                    <Bell size={24} style={{ marginBottom: 6, opacity: 0.7 }} />
                    <p style={{ margin: 0 }}>No new notifications</p>
                  </div>
                ) : (
                  notificationsList.map((notif, idx) => (
                    <div key={`notif-${idx}`} className="notification-card">
                      {notif.icon ? (
                        <img src={notif.icon} className="notification-icon" alt="" />
                      ) : (
                        <div className="notification-icon" style={{ backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Bell size={14} />
                        </div>
                      )}
                      <div className="notification-content">
                        <span className="notification-title">{notif.title}</span>
                        <span className="notification-body">{notif.body}</span>
                      </div>
                      <button
                        className="notification-dismiss"
                        onClick={() => setNotificationsList(prev => prev.filter((_, i) => i !== idx))}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Game / System Performance Overlay Tab */}
            {currentTab === 6 && (
              <div className="stats-container">
                <div className="stat-bar-group">
                  <div className="stat-label-row">
                    <span>CPU LOAD</span>
                    <span>{systemStats.cpu}%</span>
                  </div>
                  <div className="stat-bar-track">
                    <div className="stat-bar-fill" style={{ width: `${systemStats.cpu}%` }} />
                  </div>
                </div>

                <div className="stat-bar-group">
                  <div className="stat-label-row">
                    <span>MEMORY USAGE</span>
                    <span>{systemStats.ram}%</span>
                  </div>
                  <div className="stat-bar-track">
                    <div className="stat-bar-fill" style={{ width: `${systemStats.ram}%` }} />
                  </div>
                </div>

                <div className="stat-bar-group">
                  <div className="stat-label-row">
                    <span>BATTERY</span>
                    <span>{percent !== null ? `${percent}%` : 'N/A'}</span>
                  </div>
                  <div className="stat-bar-track">
                    <div className="stat-bar-fill" style={{ width: `${percent || 0}%` }} />
                  </div>
                </div>
              </div>
            )}

            {/*Clipboard*/}
            {currentTab === 7 && (
              <div id="clipboard" style={{ animation: 'none' }}>
                {clipboard.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, width: '100%' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Clipboard History ({clipboard.length})
                    </span>
                    <button
                      onClick={clearAllClipboard}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: textColor,
                        opacity: 0.5,
                        fontSize: 11,
                        cursor: 'pointer',
                        padding: 0
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
                    >
                      Clear All
                    </button>
                  </div>
                )}
                {clipboard.length === 0 ? (
                  <p style={{ opacity: 0.5, textAlign: 'center', marginTop: 30, color: textColor }}>Clipboard is empty</p>
                ) : (
                  clipboard.map((item, index) => (
                    <div className="clipboard-row" key={index}>
                      <p className="clipboard-content" style={{ paddingRight: '55px', color: textColor }}>{item}</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(item);
                          const btn = e.currentTarget;
                          btn.innerText = "Copied!";
                          btn.style.backgroundColor = 'rgba(52, 199, 89, 0.4)';
                          setTimeout(() => {
                            btn.innerText = "Copy";
                            btn.style.backgroundColor = `color-mix(in srgb, ${textColor}, transparent 85%)`;
                          }, 1500);
                        }}
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          zIndex: 10,
                          backgroundColor: `color-mix(in srgb, ${textColor}, transparent 85%)`,
                          border: `1px solid color-mix(in srgb, ${textColor}, transparent 75%)`,
                          borderRadius: '6px',
                          color: textColor,
                          fontSize: '11px',
                          fontWeight: 600,
                          padding: '4px 9px',
                          cursor: 'pointer',
                          backdropFilter: 'blur(4px)'
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/*Tasks*/}
            {currentTab === 8 && (
              <div id="tasks-container" style={{ animation: 'none' }}>
                <div id="task-list">
                  <AnimatePresence>
                    {tasks.length === 0 ? (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        style={{ textAlign: 'center', marginTop: 30 }}
                      >
                        No tasks yet. Add one below!
                      </motion.p>
                    ) : (
                      tasks.map((task, index) => (
                        <motion.div
                          className="task-row"
                          key={`task-${task}-${index}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0, padding: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <input
                            type="checkbox"
                            onChange={() => {
                              removeTask(index);
                            }}
                            className="task-checkbox"
                          />
                          <h3 className="task-item" style={{ flex: 1, margin: 0 }}>{task}</h3>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
                <div id="task-input-container">
                  <input
                    type="text"
                    placeholder="New task..."
                    value={taskText}
                    onChange={(e) => setTaskText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addTask();
                    }}
                    className="task-input"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${textColor}, transparent 95%)`,
                      color: textColor,
                      border: `1px solid color-mix(in srgb, ${textColor}, transparent 90%)`,
                      borderRadius: '12px',
                      padding: '8px 12px',
                      outline: 'none',
                      flex: 1
                    }}
                  />
                  <button
                    onClick={() => {
                      addTask();
                    }}
                    className="task-add-btn"
                    style={{
                      backgroundColor: textColor,
                      color: bgColor,
                      border: 'none',
                      borderRadius: '12px',
                      padding: '8px 16px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Timer / Stopwatch */}
            {currentTab === 10 && (
              <div style={{
                width: '90%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '10px 0',
                boxSizing: 'border-box'
              }}>
                <div style={{
                  display: 'flex',
                  backgroundColor: `color-mix(in srgb, ${textColor}, transparent 94%)`,
                  borderRadius: '10px',
                  padding: '2px',
                  border: `1px solid color-mix(in srgb, ${textColor}, transparent 90%)`
                }}>
                  <button
                    onClick={() => { setTimerMode("stopwatch"); setIsTimerRunning(false); setTimerSeconds(0); }}
                    style={{
                      border: 'none',
                      background: timerMode === "stopwatch" ? textColor : 'transparent',
                      color: timerMode === "stopwatch" ? bgColor : textColor,
                      borderRadius: '8px',
                      padding: '4px 14px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Stopwatch
                  </button>
                  <button
                    onClick={() => { setTimerMode("timer"); setIsTimerRunning(false); setTimerSeconds(300); }}
                    style={{
                      border: 'none',
                      background: timerMode === "timer" ? textColor : 'transparent',
                      color: timerMode === "timer" ? bgColor : textColor,
                      borderRadius: '8px',
                      padding: '4px 14px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Timer (5m)
                  </button>
                </div>

                <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.05em', color: textColor }}>
                  {Math.floor(timerSeconds / 3600).toString().padStart(2, '0')}:
                  {Math.floor((timerSeconds % 3600) / 60).toString().padStart(2, '0')}:
                  {(timerSeconds % 60).toString().padStart(2, '0')}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    style={{
                      backgroundColor: textColor,
                      color: bgColor,
                      border: 'none',
                      borderRadius: '20px',
                      padding: '6px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    {isTimerRunning ? <Pause size={14} /> : <Play size={14} />}
                    <span>{isTimerRunning ? "Pause" : "Start"}</span>
                  </button>
                  <button
                    onClick={() => { setIsTimerRunning(false); setTimerSeconds(timerMode === "timer" ? 300 : 0); }}
                    style={{
                      backgroundColor: `color-mix(in srgb, ${textColor}, transparent 88%)`,
                      color: textColor,
                      border: 'none',
                      borderRadius: '20px',
                      padding: '6px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600,
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <RotateCcw size={14} />
                    <span>Reset</span>
                  </button>
                </div>
              </div>
            )}

            {/*Settings Overhaul*/}
            {currentTab === 9 && (
              <div
                id="settings-container"
                ref={settingsContainerRef}
                onMouseDown={handleSettingsMouseDown}
                onMouseMove={handleSettingsMouseMove}
                onMouseUp={handleSettingsMouseUp}
                onMouseLeave={handleSettingsMouseUp}
                onTouchStart={handleSettingsMouseDown}
                onTouchMove={handleSettingsMouseMove}
                onTouchEnd={handleSettingsMouseUp}
              >
                <div className="settings-section">
                  <h3 style={{ fontSize: 13, textTransform: 'uppercase', opacity: 0.5, letterSpacing: '0.05em' }}>General</h3>
                  <div className="settings-row">
                    <span className="settings-label">12/24 Hour Format</span>
                    <select value={hourFormat ? "12-hr" : "24-hr"} onChange={handleHourFormatChange}>
                      <option value="12-hr">12-hour</option>
                      <option value="24-hr">24-hour</option>
                    </select>
                  </div>
                  {window.electronAPI?.platform !== 'darwin' && (
                    <div className="settings-row">
                      <span className="settings-label">Auto Launch on Boot</span>
                      <select value={autoLaunchEnabled ? "true" : "false"} onChange={handleAutoLaunchChange}>
                        <option value="true">Enabled</option>
                        <option value="false">Disabled</option>
                      </select>
                    </div>
                  )}
                  {displays.length > 0 && (
                    <div className="settings-row">
                      <span className="settings-label">Target Display</span>
                      <select value={currentDisplayId} onChange={handleDisplayChange}>
                        {displays.map(d => (
                          <option key={d.id} value={d.id}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="settings-section">
                  <h3 style={{ fontSize: 13, textTransform: 'uppercase', opacity: 0.5, letterSpacing: '0.05em', marginBottom: '4px' }}>Tab Management</h3>
                  <p style={{ fontSize: 11, opacity: 0.4, marginTop: -8, marginBottom: 8 }}>Drag to reorder, click eye to hide.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {tabOrder.map((id, i) => {
                      const tabDef = TABS.find(t => t.id === id);
                      const isHidden = hiddenTabs.includes(id);
                      return (
                        <div
                          key={id}
                          className={`tab-order-item ${isHidden ? 'hidden' : ''}`}
                          style={{ cursor: 'grab' }}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", i);
                            e.currentTarget.style.opacity = '0.4';
                            e.currentTarget.style.borderStyle = 'dashed';
                          }}
                          onDragEnd={(e) => {
                            e.currentTarget.style.opacity = isHidden ? '0.45' : '1';
                            e.currentTarget.style.borderStyle = isHidden ? 'dashed' : 'solid';
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.style.background = `color-mix(in srgb, ${textColor}, transparent 90%)`;
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.style.background = '';
                            e.currentTarget.style.transform = '';
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.style.background = '';
                            e.currentTarget.style.transform = '';
                            const fromIdx = parseInt(e.dataTransfer.getData("text/plain"));
                            moveTabOrder(fromIdx, i);
                          }}
                        >
                          <GripVertical size={16} style={{ opacity: 0.3, cursor: 'grab' }} />
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                            {tabDef.icon(textColor)}
                            <span style={{ fontSize: 14, fontWeight: 500 }}>{tabDef.name}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <button
                              className="tab-order-btn"
                              onClick={() => {
                                setDefaultTabId(id);
                                localStorage.setItem("default-tab", id);
                              }}
                              title="Set as default"
                              style={{ opacity: defaultTabId === id ? 1 : 0.3, color: defaultTabId === id ? '#FFD700' : textColor }}
                            >
                              <Star size={16} fill={defaultTabId === id ? '#FFD700' : 'none'} />
                            </button>
                            <div style={{ width: 1, height: 16, background: textColor, opacity: 0.1, margin: '0 4px' }} />
                            <button
                              className="tab-order-btn"
                              onClick={() => toggleTabVisibility(id)}
                              title={isHidden ? "Show" : "Hide"}
                              style={{ opacity: isHidden ? 1 : 0.6 }}
                            >
                              {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                            <div style={{ width: 1, height: 16, background: textColor, opacity: 0.1, margin: '0 4px' }} />
                            <button
                              className="tab-order-btn"
                              disabled={i === 0}
                              onClick={() => moveTabOrder(i, i - 1)}
                            >
                              <ChevronLeft size={16} style={{ transform: 'rotate(90deg)' }} />
                            </button>
                            <button
                              className="tab-order-btn"
                              disabled={i === tabOrder.length - 1}
                              onClick={() => moveTabOrder(i, i + 1)}
                            >
                              <ChevronLeft size={16} style={{ transform: 'rotate(-90deg)' }} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="settings-section">
                  <h3 style={{ fontSize: 13, textTransform: 'uppercase', opacity: 0.5, letterSpacing: '0.05em' }}>Island Style</h3>
                  <div className="settings-row">
                    <span className="settings-label">Theme</span>
                    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                      <option value="none">Default</option>
                      <option value="sleek-black">Sleek Black</option>
                      <option value="win95">Windows 95</option>
                    </select>
                  </div>
                  <div className="settings-section" style={{ alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span className="settings-label" style={{ textAlign: 'center', marginBottom: '8px', opacity: 1, color: textColor }}>Position Mode</span>
                    <div className="radio-group" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', width: '100%', gap: '15px 10px' }}>
                      {[
                        { val: "top-left", label: "Top L" },
                        { val: "top-center", label: "Top C" },
                        { val: "top-right", label: "Top R" },
                        { val: "bottom-left", label: "Bot L" },
                        { val: "bottom-center", label: "Bot C" },
                        { val: "bottom-right", label: "Bot R" }
                      ].map((mode) => (
                        <label key={mode.val} className="radio-label" style={{ justifyContent: 'center' }}>
                          <input
                            type="radio"
                            name="positionMode"
                            value={mode.val}
                            checked={positionMode === mode.val}
                            onChange={(e) => {
                              setPositionMode(e.target.value);
                              localStorage.setItem("position-mode", e.target.value);
                            }}
                          />
                          <span className="radio-custom"></span>
                          {mode.label}
                        </label>
                      ))}
                    </div>
                    <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '10px 0' }}></div>
                    <label className="radio-label" style={{ justifyContent: 'center' }}>
                      <input
                        type="radio"
                        name="positionMode"
                        value="free"
                        checked={positionMode === "free"}
                        onChange={(e) => {
                          setPositionMode(e.target.value);
                          localStorage.setItem("position-mode", e.target.value);
                        }}
                      />
                      <span className="radio-custom"></span>
                      FREE (MANUAL)
                    </label>
                  </div>
                  <AnimatePresence>
                    {isFree && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                        style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '12px' }}
                      >
                        <div className="settings-row">
                          <span className="settings-label">Position X ({islandX.toFixed(1)}%)</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="0.1"
                            value={islandX}
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              updateDragging(true);
                            }}
                            onChange={handleIslandXChange}
                            onPointerUp={(e) => {
                              e.stopPropagation();
                              savePosition();
                              handleDragEndChecks(e);
                              e.target.blur();
                            }}
                            list="tickmarks"
                            style={{ flex: 1, accentColor: textColor }}
                          />
                          <datalist id="tickmarks">
                            <option value="50" label="50%"></option>
                          </datalist>
                        </div>
                        <div className="settings-row">
                          <span className="settings-label">Position Y ({islandY}px)</span>
                          <input
                            type="range"
                            min="0"
                            max="500"
                            value={islandY}
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              updateDragging(true);
                            }}
                            onChange={handleIslandYChange}
                            onPointerUp={(e) => {
                              e.stopPropagation();
                              savePosition();
                              handleDragEndChecks(e);
                              e.target.blur();
                            }}
                            style={{ flex: 1, accentColor: textColor }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div className="settings-row">
                    <span className="settings-label">Island Border</span>
                    <select value={islandBorderEnabled ? "true" : "false"} onChange={handleIslandBorderChange}>
                      <option value="true">Show</option>
                      <option value="false">Hide</option>
                    </select>
                  </div>
                  <div className="settings-row">
                    <span className="settings-label">Hide When Inactive</span>
                    <select value={hideNotActiveIslandEnabled ? "true" : "false"} onChange={handlehideNotActiveIslandChange}>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                </div>

                <div className="settings-section">
                  <h3 style={{ fontSize: 13, textTransform: 'uppercase', opacity: 0.5, letterSpacing: '0.05em' }}>Colors & Assets</h3>
                  <div className="settings-row">
                    <span className="settings-label">Island Color</span>
                    <input
                      className="select-input"
                      style={{ width: '100px' }}
                      placeholder="#000000"
                      value={bgColor}
                      onChange={handleBgColorChange}
                    />
                  </div>
                  <div className="settings-row">
                    <span className="settings-label">Text Color</span>
                    <input
                      className="select-input"
                      style={{ width: '100px' }}
                      placeholder="#FAFAFA"
                      value={textColor}
                      onChange={handleTextColorChange}
                    />
                  </div>
                  <div className="settings-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span className="settings-label">Background Image URL</span>
                    <input
                      className="select-input"
                      placeholder="https://..."
                      value={bgImage}
                      onChange={handleBgImageChange}
                    />
                  </div>
                </div>

                <div className="settings-section">
                  <h3 style={{ fontSize: 13, textTransform: 'uppercase', opacity: 0.5, letterSpacing: '0.05em' }}>Features</h3>
                  <div className="settings-row">
                    <span className="settings-label">Low Battery Alerts</span>
                    <select value={batteryAlertsEnabled ? "true" : "false"} onChange={handleBatteryAlertsChange}>
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                  <div className="settings-row">
                    <span className="settings-label">Standby Mode</span>
                    <select value={standbyBorderEnabled ? "true" : "false"} onChange={handleStandbyChange}>
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                  <div className="settings-row">
                    <span className="settings-label">Large Standby Mode</span>
                    <select value={largeStandbyEnabled ? "true" : "false"} onChange={handleLargeStandbyChange}>
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                  <div className="settings-row">
                    <span className="settings-label">Show Info when idle</span>
                    <select value={showInfoWhenIdleEnabled ? "true" : "false"} onChange={handleShowInfoWhenIdleChange}>
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                </div>

                <div className="settings-section">
                  <h3 style={{ fontSize: 13, textTransform: 'uppercase', opacity: 0.5, letterSpacing: '0.05em' }}>Weather</h3>
                  <div className="settings-row">
                    <span className="settings-label">Location</span>
                    <input
                      className="select-input"
                      placeholder="City, ST, Country"
                      value={weatherLocation}
                      onChange={(e) => {
                        setWeatherLocation(e.target.value);
                        localStorage.setItem("location", e.target.value);
                      }}
                    />
                  </div>
                  <div className="settings-row">
                    <span className="settings-label">Unit</span>
                    <select value={weatherUnit} onChange={handleWeatherUnitChange}>
                      <option value="f">Fahrenheit (°F)</option>
                      <option value="c">Celsius (°C)</option>
                    </select>
                  </div>
                </div>

              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div >
  );
}
