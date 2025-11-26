const audioPlayer = document.getElementById('audioPlayer');
const playPauseButton = document.getElementById('playPause');
const skipPreviousButton = document.getElementById('skipPrevious');
const skipNextButton = document.getElementById('skipNext');
const restartButton = document.getElementById('restart');
const forwardButton = document.getElementById('forward');
const currentTimeSpan = document.getElementById('currentTime');
const totalDurationSpan = document.getElementById('totalDuration');
const songTitleEl = document.getElementById('songTitle');
const songArtistEl = document.getElementById('songArtist');
const lyricsSection = document.getElementById('lyricsSection');
let timedLyrics = [];
let activeLyricIndex = -1;

const songs = [
  {
    title: "I walk this earth all by myself",
    artist: "EKKSTACY",
    path: "./audio/EKKSTACY - i walk this earth all by myself [Official Lyric Video].mp3",
    cover: "./Preset/Y3.webp",
    lyrics: `I walk this earth all by myself
I'm doing drugs, but they don't help
My voice is nothing when I'm screaming out for help
I stretch my hand, but my grip just gives out
Oh-oh,
Oh-oh
Oh-oh,
Oh-oh
Oh-oh,
Oh-oh
Oh-oh,
Oh-oh
Nobody gives a fuck about me
That's what I think to myself when I'm alone in the city
I walk around the mall, but there's nobody with me
What do I say when there's nobody listening?
I walk this earth all by myself
I'm doing drugs, but they don't help
My voice is nothing when I'm screaming out for help
I stretch my hand, but my grip just gives out
I walk this earth all by myself
I'm doing drugs, but they don't help
My voice is nothing when I'm screaming out for help
I stretch my hand, but my grip just gives out`
  },
];

let currentSongIndex = 0;
let isPlaying = false;

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

function loadSong(index) {
  const song = songs[index];
  audioPlayer.src = song.path;
  songTitleEl.textContent = song.title;
  songArtistEl.textContent = song.artist;
  audioPlayer.load();
  renderLyricsForSong(song);
  activeLyricIndex = -1;
}

function updatePlayIcon(playing) {
  if (playing) {
    playPauseButton.classList.remove('bxs-play-circle');
    playPauseButton.classList.add('bxs-pause-circle');
  } else {
    playPauseButton.classList.remove('bxs-pause-circle');
    playPauseButton.classList.add('bxs-play-circle');
  }
}

playPauseButton.addEventListener('click', () => {
  if (!isPlaying) {
    audioPlayer.play();
    isPlaying = true;
  } else {
    audioPlayer.pause();
    isPlaying = false;
  }
  updatePlayIcon(isPlaying);
});

skipPreviousButton.addEventListener('click', () => {
  currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
  loadSong(currentSongIndex);
  audioPlayer.play();
  isPlaying = true;
  updatePlayIcon(true);
});

skipNextButton.addEventListener('click', () => {
  currentSongIndex = (currentSongIndex + 1) % songs.length;
  loadSong(currentSongIndex);
  audioPlayer.play();
  isPlaying = true;
  updatePlayIcon(true);
});

restartButton.addEventListener('click', () => {
  const newTime = Math.max(0, audioPlayer.currentTime - 5);
  audioPlayer.currentTime = newTime;
});

forwardButton.addEventListener('click', () => {
  const newTime = audioPlayer.currentTime + 5;
  audioPlayer.currentTime = Math.min(newTime, audioPlayer.duration || newTime);
});

audioPlayer.addEventListener('timeupdate', () => {
  currentTimeSpan.textContent = formatTime(audioPlayer.currentTime);
  // Sync lyrics if timed entries are available
  if (timedLyrics.length > 0 && Number.isFinite(audioPlayer.duration)) {
    const t = audioPlayer.currentTime;
    let idx = timedLyrics.findIndex((entry, i) => {
      const next = timedLyrics[i + 1]?.time ?? Infinity;
      return t >= entry.time && t < next;
    });
    if (idx === -1 && t >= timedLyrics[timedLyrics.length - 1].time) idx = timedLyrics.length - 1;
    if (idx !== -1 && idx !== activeLyricIndex) {
      setActiveLyric(idx);
    }
  }
});

audioPlayer.addEventListener('loadedmetadata', () => {
  totalDurationSpan.textContent = formatTime(audioPlayer.duration);
  currentTimeSpan.textContent = formatTime(0);
});

audioPlayer.addEventListener('ended', () => {
  isPlaying = false;
  updatePlayIcon(false);
});

audioPlayer.addEventListener('error', () => {
  console.error('Failed to load audio source:', audioPlayer.src);
  isPlaying = false;
  updatePlayIcon(false);
});

// ===================== LYRICS HANDLING ========================

function renderLyrics(lines) {
  lyricsSection.innerHTML = '';
  if (!lines || lines.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'No lyrics available';
    lyricsSection.appendChild(p);
    return;
  }

  lines.forEach((line) => {
    const p = document.createElement('p');
    p.textContent = line;
    lyricsSection.appendChild(p);
  });
}

function stripTimestamp(line) {
  return (line || '').replace(/\[[0-9:.]+\]/g, '').trim();
}

async function tryFetchLyricsFromLrc(path) {
  const lrcPath = path.replace(/\.mp3$/i, '.lrc');
  try {
    const res = await fetch(lrcPath);
    if (!res.ok) throw new Error('Lyrics file not found');
    const text = await res.text();
    const entries = parseLrc(text);
    return entries.length ? entries : null;
  } catch (err) {
    return null;
  }
}

async function renderLyricsForSong(song) {
  timedLyrics = [];
  activeLyricIndex = -1;

  const lyricsText = (song.lyrics || '').trim();
  const hasTimestamps = /\[[0-9:.]+\]/.test(lyricsText);

  if (lyricsText && hasTimestamps) {
    const entries = parseLrc(lyricsText);
    renderTimedLyrics(entries);
    return;
  }

  // Prefer external .lrc for syncing
  const lrcEntries = await tryFetchLyricsFromLrc(song.path);
  if (lrcEntries) {
    renderTimedLyrics(lrcEntries);
    return;
  }

  // Fall back to plain text lyrics, if any
  if (lyricsText) {
    const lines = lyricsText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    renderLyrics(lines);
  } else {
    renderLyrics([]);
  }
}

function parseLrc(text) {
  const entries = [];
  const lines = text.split(/\r?\n/);
  const timeRegex = /\[([0-9]{1,2}):([0-9]{2})(?:\.([0-9]{1,2}))?\]/g;
  for (const line of lines) {
    let match;
    const content = line.replace(timeRegex, '').trim();
    if (!content) continue;
    timeRegex.lastIndex = 0;
    while ((match = timeRegex.exec(line)) !== null) {
      const min = parseInt(match[1], 10) || 0;
      const sec = parseInt(match[2], 10) || 0;
      const hund = match[3] ? parseInt(match[3], 10) : 0;
      const time = min * 60 + sec + hund / 100;
      entries.push({ time, text: content });
    }
  }
  entries.sort((a, b) => a.time - b.time);
  return entries;
}

function renderTimedLyrics(entries) {
  timedLyrics = entries;
  lyricsSection.innerHTML = '';
  entries.forEach((e, i) => {
    const p = document.createElement('p');
    p.textContent = e.text;
    p.dataset.index = i;
    lyricsSection.appendChild(p);
  });
}

function setActiveLyric(idx) {
  const children = Array.from(lyricsSection.children);
  children.forEach((el, i) => {
    el.classList.remove('active', 'prev', 'next');
    if (i === idx) {
      el.classList.add('active');
    } else if (i === idx - 1) {
      el.classList.add('prev');
    } else if (i === idx + 1) {
      el.classList.add('next');
    }
  });
  activeLyricIndex = idx;
  const activeEl = children[idx];
  if (activeEl) {
    const top = activeEl.offsetTop - lyricsSection.clientHeight / 2 + activeEl.clientHeight / 2;
    lyricsSection.scrollTo({ top, behavior: 'smooth' });
  }
}

// Initialize page
loadSong(currentSongIndex);
updatePlayIcon(false);
