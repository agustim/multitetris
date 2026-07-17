import { THEME_KEYS, COLOR_THEMES } from '../constants.js';

const $ = (id) => document.getElementById(id);

export function setupLobby() {
  const themeSelect = $('theme-select');
  THEME_KEYS.forEach(key => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = COLOR_THEMES[key].name;
    opt.style.color = COLOR_THEMES[key].I;
    themeSelect.appendChild(opt);
  });
  themeSelect.value = 'classic';

  const randomSuffix = Math.random().toString(36).substring(2, 6);
  $('room-input').value = `tetris-${randomSuffix}`;

  return {
    getName:     () => $('name-input').value.trim() || 'Jugador',
    getTheme:    () => themeSelect.value,
    getRoomId:   () => $('room-input').value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || `room-${randomSuffix}`,
    setStatus:   (msg) => { $('status').textContent = msg; },
    showLobby:   () => { $('lobby').style.display = 'flex'; $('game-container').style.display = 'none'; },
    showGame:    () => { $('lobby').style.display = 'none'; $('game-container').style.display = 'flex'; },
    hideGameOver: () => {
      const ov = document.querySelector('.game-over-overlay');
      if (ov) ov.remove();
    },
    showGameOver: (message, onBack) => {
      const existing = document.querySelector('.game-over-overlay');
      if (existing) existing.remove();
      const overlay = document.createElement('div');
      overlay.className = 'game-over-overlay';
      overlay.innerHTML = `<h2>Game Over</h2><p>${message}</p><button id="back-to-lobby" style="padding:8px 20px;border:none;border-radius:6px;background:#e94560;color:#fff;cursor:pointer">Tornar al lobby</button>`;
      $('board-wrapper').appendChild(overlay);
      $('back-to-lobby').onclick = () => {
        overlay.remove();
        if (onBack) onBack();
      };
    },
    showCreateBtn:  (show) => { $('create-btn').style.display = show ? '' : 'none'; },
    showJoinBtn:    (show) => { $('join-btn').style.display = show ? '' : 'none'; },
    showRoomInput:  (show) => { $('room-section').style.display = show ? '' : 'none'; },
    setButtonsEnabled: (enabled) => {
      $('create-btn').disabled = !enabled;
      $('join-btn').disabled = !enabled;
    },
  };
}
