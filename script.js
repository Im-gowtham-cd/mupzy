const playPauseButton = document.getElementById("playPause");
const skipPreviousButton = document.getElementById("skipPrevious");
const skipNextButton = document.getElementById("skipNext");
const restartButton = document.getElementById("restart");
const forwardButton = document.getElementById("forward");
const currentTimeSpan = document.getElementById("currentTime");
const totalDurationSpan = document.getElementById("totalDuration");
const songTitleEl = document.getElementById("songTitle");
const songArtistEl = document.getElementById("songArtist");

let player;
let isPlayerReady = false;
let activeLyricIndex = -1;

const songs = [
  {
    title: "Do It",
    artist: "Stray Kids",
    videoId: "NED7nev2ywQ"
  },
  {
    title: "Calling After Me",
    artist: "Wallows",
    videoId: "xtU6xI8wUTs"
  },
  {
    title: "Arabic Kuthu",
    artist: "Anirudh",
    videoId: "KUN5Uf9mObQ"
  }
];

let currentSongIndex = 0;

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
  // Initialize song title/artist when ready
  songTitleEl.textContent = songs[currentSongIndex].title;
  songArtistEl.textContent = songs[currentSongIndex].artist;
  requestAnimationFrame(updateLoop);
}

function onPlayerStateChange(e) {
  console.log("Player state changed:", e.data);
  const icon = playPauseButton.querySelector('i');

  if (e.data === YT.PlayerState.ENDED) {
    nextSong();
  } else if (e.data === YT.PlayerState.CUED) {
    player.playVideo(); // Auto-play when cued
  } else if (e.data === YT.PlayerState.PLAYING) {
    playPauseButton.classList.remove('bxs-play-circle');
    playPauseButton.classList.add('bxs-pause-circle');
  } else if (e.data === YT.PlayerState.PAUSED) {
    playPauseButton.classList.remove('bxs-pause-circle');
    playPauseButton.classList.add('bxs-play-circle');
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

  activeLyricIndex = -1;

  // Use the API's load method
  player.loadVideoById(s.videoId);
}

function playSong() {
  console.log("Attempting to play song.");
  // Unmute is optional, but ensures audio if player was muted
  try { player.unMute(); } catch (e) { console.error("Error unmuting player:", e); }
  player.playVideo();
}

function nextSong() {
  cueSong(currentSongIndex + 1);
  // playSong is automatically called by onPlayerStateChange
}

function prevSong() {
  cueSong(currentSongIndex - 1);
  // playSong is automatically called by onPlayerStateChange
}

playPauseButton.addEventListener("click", () => {
  const state = player.getPlayerState();
  if (state === YT.PlayerState.PLAYING) {
    player.pauseVideo();
  } else {
    playSong();
  }
  // The state change handler updates the icon
});

skipNextButton.addEventListener("click", nextSong);
skipPreviousButton.addEventListener("click", prevSong);

restartButton.addEventListener("click", () => {
  // Seek back 5 seconds
  player.seekTo(Math.max(0, player.getCurrentTime() - 5), true);
});

forwardButton.addEventListener("click", () => {
  // Seek forward 5 seconds
  player.seekTo(player.getCurrentTime() + 5, true);
});

window.addEventListener("keydown", (ev) => {
  if (ev.code === "Space") { ev.preventDefault(); playPauseButton.click(); }
  if (ev.code === "ArrowRight") forwardButton.click();
  if (ev.code === "ArrowLeft") restartButton.click();
  if (ev.code === "ArrowUp") skipNextButton.click();
  if (ev.code === "ArrowDown") skipPreviousButton.click();
});

// This loop is what keeps your time display updated
function updateLoop() {
  if (isPlayerReady && player.getPlayerState() !== YT.PlayerState.UNSTARTED) {
    const t = player.getCurrentTime();

    currentTimeSpan.textContent = formatTime(t);
    // GetDuration might return 0 if the video hasn't loaded metadata yet, so check it.
    const duration = player.getDuration();
    if (duration > 0) {
      totalDurationSpan.textContent = formatTime(duration);
    }
  }

  requestAnimationFrame(updateLoop);
}

// Initial cue is not needed here; the video is loaded in onYouTubeIframeAPIReady.
// cueSong(currentSongIndex);