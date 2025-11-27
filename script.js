const playPauseButton = document.getElementById("playPause");
const skipPreviousButton = document.getElementById("skipPrevious");
const skipNextButton = document.getElementById("skipNext");
const restartButton = document.getElementById("restart");
const forwardButton = document.getElementById("forward");
const currentTimeSpan = document.getElementById("currentTime");
const totalDurationSpan = document.getElementById("totalDuration");
const songTitleEl = document.getElementById("songTitle");
const songArtistEl = document.getElementById("songArtist");
const lyricsSection = document.getElementById("lyricsSection");

let player;
let isPlayerReady = false;
let activeLyricIndex = -1;

const songs = [
  {
    title: "Do It",
    artist: "Stray Kids",
    videoId: "NED7nev2ywQ",
    lyrics: [
      { time: 0, text: "Do it - starting line" },
      { time: 5, text: "Next lyric line" },
      { time: 11, text: "Another lyric line" }
    ]
  },
  {
    title: "Back To Friends",
    artist: "Sombr",
    videoId: "c8zq4kAn_O0",
    lyrics: [
      { time: 0, text: "I walk this earth all by myself" },
      { time: 7, text: "And I do not need no one else" },
      { time: 13, text: "I am better off alone" }
    ]
  },
  {
    title: "Arabic Kuthu",
    artist: "Anirudh",
    videoId: "KUN5Uf9mObQ",
    lyrics: [
      { time: 0, text: "Arabic Kuthu starting line" },
      { time: 6, text: "Lyrics line 2" },
      { time: 12, text: "Lyrics line 3" }
    ]
  }
];

let currentSongIndex = 0;
let timedLyrics = [];

function onYouTubeIframeAPIReady() {
  player = new YT.Player("yt-player", {
    height: "1",
    width: "1",
    videoId: songs[currentSongIndex].videoId,
    playerVars: { playsinline: 1, controls: 0, rel: 0 },
    events: { onReady: onPlayerReady, onStateChange: onPlayerStateChange }
  });
}

function onPlayerReady() {
  isPlayerReady = true;
  cueSong(currentSongIndex);
  requestAnimationFrame(updateLoop);
}

function onPlayerStateChange(e) {
  console.log("Player state changed:", e.data);
  if (e.data === YT.PlayerState.ENDED) {
    nextSong();
  } else if (e.data === YT.PlayerState.CUED || e.data === YT.PlayerState.BUFFERING) {
    player.playVideo();
  }
}

function formatTime(t) {
  t = Math.floor(t);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

function cueSong(index) {
  currentSongIndex = ((index % songs.length) + songs.length) % songs.length;
  const s = songs[currentSongIndex];

  songTitleEl.textContent = s.title;
  songArtistEl.textContent = s.artist;

  timedLyrics = s.lyrics || [];
  activeLyricIndex = -1;

  renderLyrics();

  player.loadVideoById(s.videoId);

}

function playSong() {
  console.log("Attempting to play song.");
  try { player.unMute(); } catch (e) { console.error("Error unmuting player:", e); }
  player.playVideo();
}

function nextSong() {
  cueSong(currentSongIndex + 1);
  playSong();
}

function prevSong() {
  cueSong(currentSongIndex - 1);
  playSong();
}

playPauseButton.addEventListener("click", () => {
  const state = player.getPlayerState();
  const icon = playPauseButton.querySelector('i');
  if (state === YT.PlayerState.PLAYING) {
    player.pauseVideo();
    playPauseButton.classList.remove('bxs-pause-circle');
    playPauseButton.classList.add('bxs-play-circle');
  } else {
    playSong();
    playPauseButton.classList.remove('bxs-play-circle');
    playPauseButton.classList.add('bxs-pause-circle');
  }
});

skipNextButton.addEventListener("click", nextSong);
skipPreviousButton.addEventListener("click", prevSong);

restartButton.addEventListener("click", () => {
  player.seekTo(Math.max(0, player.getCurrentTime() - 5), true);
});

forwardButton.addEventListener("click", () => {
  player.seekTo(player.getCurrentTime() + 5, true);
});

window.addEventListener("keydown", (ev) => {
  if (ev.code === "Space") { ev.preventDefault(); playPauseButton.click(); }
  if (ev.code === "ArrowRight") forwardButton.click();
  if (ev.code === "ArrowLeft") restartButton.click();
  if (ev.code === "ArrowUp") skipNextButton.click();
  if (ev.code === "ArrowDown") skipPreviousButton.click();
});

function renderLyrics() {
  lyricsSection.innerHTML = "";
  timedLyrics.forEach((line, i) => {
    const p = document.createElement("p");
    p.textContent = line.text;
    p.dataset.index = i;
    p.onclick = () => player.seekTo(line.time, true);
    lyricsSection.appendChild(p);
  });
}

function highlightLine(index) {
  const lines = lyricsSection.children;
  [...lines].forEach((p, i) => {
    p.classList.toggle("active", i === index);
  });

  if (lines[index]) {
    lyricsSection.scrollTo({
      top: lines[index].offsetTop - lyricsSection.clientHeight / 2,
      behavior: "smooth"
    });
  }
}

function updateLoop() {
  if (isPlayerReady && timedLyrics.length > 0) {
    const t = player.getCurrentTime();

    let idx = timedLyrics.findIndex((l, i) => {
      const next = timedLyrics[i + 1];
      return t >= l.time && (!next || t < next.time);
    });

    if (idx !== -1 && idx !== activeLyricIndex) {
      activeLyricIndex = idx;
      highlightLine(idx);
    }

    currentTimeSpan.textContent = formatTime(t);
    totalDurationSpan.textContent = formatTime(player.getDuration());
  }

  requestAnimationFrame(updateLoop);
}

cueSong(currentSongIndex);
