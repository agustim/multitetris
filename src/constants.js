export const COLS = 10;
export const ROWS = 20;
export const CELL_SIZE = 28;
export const NEXT_CELL_SIZE = 22;

export const PIECE_SHAPES = {
  I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  O: [[1,1],[1,1]],
  T: [[0,1,0],[1,1,1],[0,0,0]],
  S: [[0,1,1],[1,1,0],[0,0,0]],
  Z: [[1,1,0],[0,1,1],[0,0,0]],
  J: [[1,0,0],[1,1,1],[0,0,0]],
  L: [[0,0,1],[1,1,1],[0,0,0]],
};

export const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

export const COLOR_THEMES = {
  classic: {
    name: 'Classic',
    I: '#00f0f0', O: '#f0f000', T: '#a000f0',
    S: '#00f000', Z: '#f00000', J: '#0000f0', L: '#f0a000',
    ghost: 'rgba(255,255,255,0.15)', grid: '#1a1a2e', gridLine: '#222244', background: '#0f0f1a',
  },
  retro: {
    name: 'Retro',
    I: '#40e0d0', O: '#e8e838', T: '#bf60ff',
    S: '#60d060', Z: '#f05050', J: '#6060f0', L: '#f0b040',
    ghost: 'rgba(255,255,255,0.12)', grid: '#1a1a2e', gridLine: '#222244', background: '#0f0f1a',
  },
  neon: {
    name: 'Neon',
    I: '#00ffff', O: '#ffff00', T: '#ff00ff',
    S: '#00ff00', Z: '#ff0000', J: '#0088ff', L: '#ff8800',
    ghost: 'rgba(255,255,255,0.10)', grid: '#0a0a1a', gridLine: '#1a1a3a', background: '#050510',
  },
  ice: {
    name: 'Ice',
    I: '#c0f0f0', O: '#f0f0c0', T: '#d0c0f0',
    S: '#c0f0c0', Z: '#f0c0c0', J: '#b0b0f0', L: '#f0d0b0',
    ghost: 'rgba(255,255,255,0.20)', grid: '#1a2233', gridLine: '#223355', background: '#0f1520',
  },
  monochrome: {
    name: 'Monochrome',
    I: '#666666', O: '#777777', T: '#888888',
    S: '#555555', Z: '#444444', J: '#333333', L: '#222222',
    ghost: 'rgba(255,255,255,0.08)', grid: '#181818', gridLine: '#282828', background: '#0a0a0a',
  },
};

export const THEME_KEYS = Object.keys(COLOR_THEMES);

export const LINE_POINTS = { 1: 100, 2: 300, 3: 500, 4: 800 };

export const LEVEL_SPEEDS = [
  48, 43, 38, 33, 28, 23, 18, 13, 8, 6,
  5, 5, 5, 4, 4, 4, 3, 3, 3, 2, 1,
];

export const LINES_PER_LEVEL = 10;

export const WALL_KICKS = [
  [0, 0], [1, 0], [-1, 0], [0, -1], [1, -1], [-1, -1],
  [0, -2], [1, -2], [-1, -2], [2, 0], [-2, 0],
];
