import { PeerManager } from './network/PeerManager.js';
import { TetrisGame } from './game/TetrisGame.js';
import { setupLobby } from './ui/lobby.js';
import { updateHUD, updatePeerList } from './ui/hud.js';
import { COLOR_THEMES, getCellSizes } from './constants.js';

const $ = (id) => document.getElementById(id);

const lobby = setupLobby();
let peer = null;
let game = null;

lobby.showCreateBtn(true);
lobby.showJoinBtn(true);
lobby.showRoomInput(true);

$('create-btn').addEventListener('click', onCreateRoom);
$('join-btn').addEventListener('click', onJoinRoom);

function setupTouchControls() {
  const buttons = document.querySelectorAll('.tc-btn');
  let repeatInterval = null;
  let repeatAction = null;

  function getActionForGame(action) {
    switch (action) {
      case 'moveLeft': return () => game.moveLeft();
      case 'moveRight': return () => game.moveRight();
      case 'softDrop': return () => game.softDrop();
      case 'rotateCW': return () => game.rotateCW();
      case 'rotateCCW': return () => game.rotateCCW();
      case 'hardDrop': return () => game.hardDrop();
      default: return null;
    }
  }

  function startAction(action) {
    if (!game || !game.alive) return;
    const fn = getActionForGame(action);
    if (!fn) return;
    fn();

    if (action === 'moveLeft' || action === 'moveRight' || action === 'softDrop') {
      clearInterval(repeatInterval);
      repeatAction = action;
      repeatInterval = setInterval(() => {
        if (!game || !game.alive) { clearInterval(repeatInterval); repeatInterval = null; return; }
        getActionForGame(repeatAction)();
      }, 80);
    }
  }

  function stopAction(action) {
    if (repeatAction === action) {
      clearInterval(repeatInterval);
      repeatInterval = null;
      repeatAction = null;
    }
  }

  for (const btn of buttons) {
    const action = btn.dataset.action;
    if (!action) continue;

    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      btn.classList.add('pressed');
      startAction(action);
    }, { passive: false });

    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      btn.classList.remove('pressed');
      stopAction(action);
    }, { passive: false });

    btn.addEventListener('touchcancel', (e) => {
      btn.classList.remove('pressed');
      stopAction(action);
    });

    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      btn.classList.add('pressed');
      startAction(action);
    });

    btn.addEventListener('mouseup', (e) => {
      btn.classList.remove('pressed');
      stopAction(action);
    });

    btn.addEventListener('mouseleave', (e) => {
      btn.classList.remove('pressed');
      stopAction(action);
    });
  }
}

function setupResizeHandler() {
  let resizeTimeout = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (game && game.alive) {
        game.renderer.resize();
      }
    }, 200);
  });

  if (window.screen && window.screen.orientation) {
    window.screen.orientation.addEventListener('change', () => {
      setTimeout(() => {
        if (game && game.alive) {
          game.renderer.resize();
        }
      }, 300);
    });
  }
}

async function onCreateRoom() {
  const name = lobby.getName();
  const themeKey = lobby.getTheme();
  const roomId = lobby.getRoomId();
  if (!name) { lobby.setStatus('Introdueix un nom'); return; }
  if (!roomId) { lobby.setStatus('Introdueix un ID de sala vàlid'); return; }

  lobby.setButtonsEnabled(false);
  lobby.setStatus('Creant sala...');

  peer = new PeerManager();
  try {
    const id = await peer.createRoom(roomId, name, themeKey);
    lobby.setStatus(`Sala creada: "${id}". Esperant jugadors...`);
    lobby.showCreateBtn(false);
    lobby.showJoinBtn(false);
    lobby.showRoomInput(false);
    setupRoom(peer, name, themeKey);
  } catch (err) {
    lobby.setStatus(`Error: ${err.message}`);
    lobby.setButtonsEnabled(true);
    peer = null;
  }
}

async function onJoinRoom() {
  const name = lobby.getName();
  const themeKey = lobby.getTheme();
  const roomId = lobby.getRoomId();
  if (!name) { lobby.setStatus('Introdueix un nom'); return; }
  if (!roomId) { lobby.setStatus('Introdueix un ID de sala'); return; }

  lobby.setButtonsEnabled(false);
  lobby.setStatus('Connectant a la sala...');

  peer = new PeerManager();
  try {
    await peer.joinRoom(roomId, name, themeKey);
    lobby.setStatus(`Connectat a "${roomId}". Esperant que l'amfitrió iniciï la partida...`);
    lobby.showCreateBtn(false);
    lobby.showJoinBtn(false);
    lobby.showRoomInput(false);
    setupRoom(peer, name, themeKey);
  } catch (err) {
    lobby.setStatus(`Error: ${err.message}`);
    lobby.setButtonsEnabled(true);
    peer = null;
  }
}

function setupRoom(pm, myName, myThemeKey) {
  let started = false;
  let alive = true;
  const myTheme = COLOR_THEMES[myThemeKey];
  const startBtn = document.createElement('button');
  startBtn.textContent = 'Començar Partida';
  startBtn.style.cssText = 'padding:10px;border:none;border-radius:6px;background:#00c853;color:#fff;font-size:1rem;font-weight:600;cursor:pointer;margin-top:8px';
  startBtn.id = 'start-game-btn';

  const removeStartBtn = () => { if (startBtn.parentNode) startBtn.remove(); };

  function onStartGame() {
    if (started) return;
    started = true;
    removeStartBtn();
    lobby.showGame();
    lobby.hideGameOver();
    if (pm.isHost) pm.broadcastGameStart();
    beginGame();
  }

  const unsubs = [];

  unsubs.push(pm.on('player-list-update', (players) => {
    updatePeerList(players, pm.myId);
    lobby.setStatus(`${players.length} jugador${players.length !== 1 ? 's' : ''} connectat${players.length !== 1 ? 's' : ''}${pm.isHost ? '. Prem "Començar Partida" per iniciar.' : ''}`);
  }));

  unsubs.push(pm.on('player-joined', ({ name }) => {
    lobby.setStatus(`${name} s'ha connectat!${pm.isHost ? ' Prem "Començar Partida" per iniciar.' : ''}`);
    const players = pm.getPlayers();
    updatePeerList(players, pm.myId);
  }));

  unsubs.push(pm.on('player-left', ({ id }) => {
    const players = pm.getPlayers();
    updatePeerList(players, pm.myId);
    if (pm.isHost) lobby.setStatus('Algú s\'ha desconnectat.');
  }));

  unsubs.push(pm.on('game-start', () => {
    if (!started) { started = true; removeStartBtn(); lobby.showGame(); lobby.hideGameOver(); beginGame(); }
  }));

  unsubs.push(pm.on('attack-received', ({ rows }) => {
    if (game && alive) game.receiveAttack(rows);
  }));

  unsubs.push(pm.on('player-died', ({ id }) => {
    const players = pm.getPlayers();
    updatePeerList(players, pm.myId);

    const myEntry = players.find(p => p.id === pm.myId);
    const iAmAlive = myEntry?.state?.alive !== false;
    const otherAlive = players.filter(p => p.id !== pm.myId && p.state?.alive !== false);

    if (!iAmAlive && otherAlive.length === 0) {
      lobby.showGameOver('Empat!', () => location.reload());
    } else if (!iAmAlive && otherAlive.length >= 1) {
      lobby.showGameOver('Has perdut!', () => location.reload());
    } else if (iAmAlive && otherAlive.length === 0) {
      lobby.showGameOver('Ets el guanyador!', () => location.reload());
      if (pm.isHost) pm.broadcastWinner(pm.myId, myName);
    }
  }));

  unsubs.push(pm.on('game-winner', ({ name }) => {
    const myEntry = pm.getPlayers().find(p => p.id === pm.myId);
    if (myEntry?.state?.alive !== false) {
      lobby.showGameOver(`Guanyador: ${name}`, () => location.reload());
    }
  }));

  function updateMobileHUD(score, lines) {
    const miScore = $('mi-score');
    const miLines = $('mi-lines');
    if (miScore) miScore.textContent = score.toLocaleString();
    if (miLines) miLines.textContent = lines;
  }

  function beginGame() {
    alive = true;
    const isMobile = window.innerWidth < 768 || navigator.maxTouchPoints > 0;
    const miNextCanvas = isMobile ? $('mi-next-canvas') : null;

    game = new TetrisGame({
      canvas: $('board-canvas'),
      nextCanvas: $('next-canvas'),
      miNextCanvas,
      themeKey: myThemeKey,
      theme: myTheme,
      onAttack(rows, count) {
        const targetId = pm.findAttackTarget();
        if (targetId && alive) {
          pm.sendAttack(rows, targetId);
        }
      },
      onGameOver() {
        alive = false;
        pm.broadcastGameOver();
      },
      onStateChange(state) {
        pm.broadcastState(state);
        updateHUD(state.score, state.linesCleared);
        updateMobileHUD(state.score, state.linesCleared);
        const players = pm.getPlayers();
        updatePeerList(players, pm.myId);
      },
    });
    game.start();
  }

  if (pm.isHost) {
    $('lobby').appendChild(startBtn);
    startBtn.addEventListener('click', onStartGame);
    lobby.setStatus('Sala creada. Esperant jugadors...');
  }

  updatePeerList(pm.getPlayers(), pm.myId);
}

setupTouchControls();
setupResizeHandler();

window.addEventListener('beforeunload', () => {
  if (peer) { peer.broadcastGameOver(); peer.destroy(); }
  if (game) game.destroy();
});
