// ============================================================
// TIME-LAPSE VIEWER ENGINE
// ============================================================
window.initTimeLapseViewer = function () {
  const scrubber = document.getElementById('tl-scrubber');
  const playhead = document.getElementById('tl-playhead');
  const tsVal = document.getElementById('tl-timestamp-val');
  const liveBadge = document.getElementById('tl-live-badge');
  const playBtn = document.getElementById('tl-play-btn');
  const playIcon = document.getElementById('tl-play-icon');
  const rewindBtn = document.getElementById('tl-rewind-btn');
  const fwdBtn = document.getElementById('tl-forward-btn');
  const speedSel = document.getElementById('tl-speed-select');
  const blipsContainer = document.getElementById('tl-blips');

  if (!scrubber || !playhead || !tsVal) return;

  // ── Build activity histogram blips ─────────────────────
  const TOTAL_BLIPS = 144; // one blip per 10 min
  for (let i = 0; i < TOTAL_BLIPS; i++) {
    const blip = document.createElement('div');
    blip.className = 'tl-blip';
    // simulate higher activity during business hours (6am–10pm → min 360–1320)
    const minute = (i / TOTAL_BLIPS) * 1440;
    const inBusiness = minute >= 360 && minute <= 1320;
    const height = inBusiness
      ? Math.floor(Math.random() * 70) + 20
      : Math.floor(Math.random() * 20) + 4;
    blip.style.height = `${height}%`;
    // colour by intensity
    const hue = inBusiness ? 'rgba(255,115,0,' : 'rgba(255,179,0,';
    blip.style.background = `${hue + ((height / 100) * 0.85 + 0.15)})`;
    blipsContainer.appendChild(blip);
  }

  // ── Helpers ─────────────────────────────────────────────
  function minutesToLabel(minutes) {
    const m = Math.round(minutes) % 1440;
    const h = String(Math.floor(m / 60)).padStart(2, '0');
    const min = String(m % 60).padStart(2, '0');
    return `${h}:${min}`;
  }

  function isLive() {
    return window.state.timelapse.currentMinute >= 1435;
  }

  function updatePlayheadPos(minute) {
    const pct = (minute / 1440) * 100;
    playhead.style.left = `${pct}%`;
  }

  function updateDisplay() {
    const m = window.state.timelapse.currentMinute;
    const live = isLive();
    updatePlayheadPos(m);

    // Contradiction prevention: Show either "LIVE" or specific timestamp, not both.
    if (live) {
      tsVal.style.display = 'none';
    } else {
      tsVal.style.display = '';
      tsVal.innerText = `${minutesToLabel(m)} — Day ${window.state.timelapse.day}`;
    }

    liveBadge.classList.toggle('live-active', live);
    scrubber.value = Math.round(m);

    // Update status label for clarity (Issue 013)
    const statusLabel = document.getElementById('tl-status-label');
    if (statusLabel) {
      statusLabel.innerText = live ? '● LIVE' : '▶ Viewing History';
      statusLabel.style.color = live ? '#22c55e' : '';
    }
  }

  updateDisplay();

  // ── Play / Pause ─────────────────────────────────────────
  const PLAY_SVG = '<polygon points="5,3 19,12 5,21"/>';
  const PAUSE_SVG =
    '<rect x="5" y="3" width="4" height="18"/><rect x="15" y="3" width="4" height="18"/>';

  let tlInterval = null;
  const TICK_MS = 250; // advances time every 250ms

  function startPlayback() {
    if (tlInterval) return;
    window.state.timelapse.playing = true;
    playIcon.innerHTML = PAUSE_SVG;
    playBtn.classList.add('tl-playing');
    tlInterval = setInterval(() => {
      if (!window.state.timelapse.playing) {
        clearInterval(tlInterval);
        tlInterval = null;
        return;
      }
      const step = (60 / TICK_MS) * window.state.timelapse.speed; // minutes per tick
      window.state.timelapse.currentMinute += step;
      if (window.state.timelapse.currentMinute >= 1440) {
        window.state.timelapse.currentMinute = 1440;
        stopPlayback(); // reached end of day
      }
      updateDisplay();
    }, TICK_MS);
  }

  function stopPlayback() {
    window.state.timelapse.playing = false;
    playIcon.innerHTML = PLAY_SVG;
    playBtn.classList.remove('tl-playing');
    if (tlInterval) {
      clearInterval(tlInterval);
      tlInterval = null;
    }
  }

  playBtn.addEventListener('click', () => {
    // If at the end, rewind first
    if (window.state.timelapse.currentMinute >= 1440) window.state.timelapse.currentMinute = 0;
    if (window.state.timelapse.playing) stopPlayback();
    else startPlayback();
  });

  // ── Rewind / Forward buttons (±60 min) ──────────────────
  rewindBtn.addEventListener('click', () => {
    stopPlayback();
    window.state.timelapse.currentMinute = Math.max(0, window.state.timelapse.currentMinute - 60);
    updateDisplay();
  });

  fwdBtn.addEventListener('click', () => {
    stopPlayback();
    window.state.timelapse.currentMinute = Math.min(
      1440,
      window.state.timelapse.currentMinute + 60,
    );
    updateDisplay();
  });

  // ── Speed selector ───────────────────────────────────────
  speedSel.addEventListener('change', (e) => {
    window.state.timelapse.speed = parseFloat(e.target.value);
    // Restart interval with new speed if playing
    if (window.state.timelapse.playing) {
      clearInterval(tlInterval);
      tlInterval = null;
      startPlayback();
    }
  });

  // ── Scrubber drag ────────────────────────────────────────
  scrubber.addEventListener('input', (e) => {
    stopPlayback();
    window.state.timelapse.currentMinute = parseInt(e.target.value);
    updateDisplay();
  });

  // ── Click on the track background ───────────────────────
  document.getElementById('tl-track')?.addEventListener('click', (e) => {
    if (e.target === scrubber) return; // handled by scrubber
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    stopPlayback();
    window.state.timelapse.currentMinute = Math.round(pct * 1440);
    updateDisplay();
  });

  // ── Live badge click → jump to live ─────────────────────
  liveBadge.addEventListener('click', () => {
    stopPlayback();
    window.state.timelapse.currentMinute = 1440;
    updateDisplay();
  });
};
