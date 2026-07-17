import { Board } from './Board.js';
import { Piece } from './Piece.js';
import { Renderer } from '../ui/renderer.js';
import { LEVEL_SPEEDS, LINE_POINTS, LINES_PER_LEVEL, getCellSizes } from '../constants.js';

export class TetrisGame {
  constructor(options) {
    this.board = new Board();
    this.themeKey = options.themeKey;
    this.theme = { ...options.theme };
    this.canvas = options.canvas;
    this.nextCanvas = options.nextCanvas;
    this.miNextCanvas = options.miNextCanvas || null;
    this.renderer = new Renderer(this.canvas, this.nextCanvas);

    this.onAttack = options.onAttack || (() => {});
    this.onGameOver = options.onGameOver || (() => {});
    this.onStateChange = options.onStateChange || (() => {});

    this.score = 0;
    this.lines = 0;
    this.level = 0;
    this.alive = false;
    this.bag = [];
    this.currentPiece = null;
    this.nextPiece = null;
    this.frameCount = 0;
    this.animFrameId = null;
    this.lastStateBroadcast = 0;

    this.handleKeyDown = (e) => {
      if (!this.alive || !this.currentPiece) return;
      const key = e.key;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'z', 'Z'].includes(key)) {
        e.preventDefault();
      }
      switch (key) {
        case 'ArrowLeft':  this.moveLeft(); break;
        case 'ArrowRight': this.moveRight(); break;
        case 'ArrowDown':
          this.softDrop();
          break;
        case 'ArrowUp':    this.rotateCW(); break;
        case 'z': case 'Z': this.rotateCCW(); break;
        case ' ':
          this.hardDrop();
          break;
      }
    };
  }

  moveLeft() {
    if (!this.alive || !this.currentPiece) return;
    this.currentPiece.moveLeft(this.board);
  }

  moveRight() {
    if (!this.alive || !this.currentPiece) return;
    this.currentPiece.moveRight(this.board);
  }

  softDrop() {
    if (!this.alive || !this.currentPiece) return;
    if (!this.currentPiece.moveDown(this.board)) this.lockPiece();
    this.frameCount = 0;
  }

  rotateCW() {
    if (!this.alive || !this.currentPiece) return;
    this.currentPiece.rotateCW(this.board);
  }

  rotateCCW() {
    if (!this.alive || !this.currentPiece) return;
    this.currentPiece.rotateCCW(this.board);
  }

  hardDrop() {
    if (!this.alive || !this.currentPiece) return;
    this.currentPiece.hardDrop(this.board);
    this.lockPiece();
  }

  start() {
    this.board.reset();
    this.score = 0;
    this.lines = 0;
    this.level = 0;
    this.alive = true;
    this.bag = [];
    this.frameCount = 0;

    const sizes = getCellSizes();
    this.renderer.resize();

    this.spawnPiece();
    this.renderer.render(this.board, this.currentPiece, this.nextPiece, this.theme);
    document.addEventListener('keydown', this.handleKeyDown);
    this.animFrameId = requestAnimationFrame((t) => this.tick(t));
  }

  stop() {
    this.alive = false;
    document.removeEventListener('keydown', this.handleKeyDown);
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  spawnPiece() {
    if (this.bag.length === 0) this.bag = Piece.randomBag();
    if (!this.nextPiece) {
      this.currentPiece = new Piece(this.bag.pop());
      if (this.bag.length === 0) this.bag = Piece.randomBag();
      this.nextPiece = new Piece(this.bag.pop());
    } else {
      this.currentPiece = this.nextPiece;
      if (this.bag.length === 0) this.bag = Piece.randomBag();
      this.nextPiece = new Piece(this.bag.pop());
    }
    if (!this.board.isValidPosition(this.currentPiece.shape, this.currentPiece.row, this.currentPiece.col)) {
      this.die();
    }
  }

  lockPiece() {
    const color = this.theme[this.currentPiece.type] || '#888';
    this.board.place(this.currentPiece.shape, this.currentPiece.row, this.currentPiece.col, color);
    const cleared = this.board.clearLines();
    if (cleared > 0) {
      this.lines += cleared;
      this.score += (LINE_POINTS[cleared] || cleared * 200) * (this.level + 1);
      const newLevel = Math.floor(this.lines / LINES_PER_LEVEL);
      if (newLevel > this.level) this.level = newLevel;
      const rows = this.board.getBottomRows(cleared);
      this.onAttack(rows, cleared);
    }
    this.spawnPiece();
    this.emitState();
  }

  receiveAttack(rows) {
    if (!this.alive) return;
    this.board.addRowsToBottom(rows);
    if (!this.board.isValidPosition(this.currentPiece.shape, this.currentPiece.row, this.currentPiece.col)) {
      const color = this.theme[this.currentPiece.type] || '#888';
      this.board.place(this.currentPiece.shape, this.currentPiece.row, this.currentPiece.col, color);
      const cleared = this.board.clearLines();
      if (cleared > 0) {
        this.lines += cleared;
        this.score += (LINE_POINTS[cleared] || cleared * 200) * (this.level + 1);
        const newLevel = Math.floor(this.lines / LINES_PER_LEVEL);
        if (newLevel > this.level) this.level = newLevel;
      }
      if (this.alive) this.spawnPiece();
    }
    if (this.alive && this.board.isOverflowed()) this.die();
    this.emitState();
  }

  die() {
    this.alive = false;
    this.emitState();
    this.onGameOver();
  }

  emitState() {
    this.onStateChange({
      occupiedLines: this.board.getOccupiedLines(),
      linesCleared: this.lines,
      score: this.score,
      alive: this.alive,
    });
  }

  renderMobileNext() {
    if (!this.miNextCanvas || !this.nextPiece) return;
    const sizes = getCellSizes();
    const s = sizes.nextCellSize;
    const ctx = this.miNextCanvas.getContext('2d');
    if (!ctx) return;
    this.miNextCanvas.width = 4 * s;
    this.miNextCanvas.height = 4 * s;
    ctx.fillStyle = this.theme.background;
    ctx.fillRect(0, 0, 4 * s, 4 * s);
    const color = this.theme[this.nextPiece.type];
    if (!color) return;
    ctx.fillStyle = color;
    for (let r = 0; r < this.nextPiece.shape.length; r++) {
      for (let c = 0; c < this.nextPiece.shape[r].length; c++) {
        if (this.nextPiece.shape[r][c]) {
          this.renderer.drawBlock(ctx, c, r, s);
        }
      }
    }
  }

  tick(timestamp) {
    if (!this.alive) {
      this.renderer.render(this.board, this.currentPiece, this.nextPiece, this.theme);
      this.animFrameId = requestAnimationFrame((t) => this.tick(t));
      return;
    }
    this.frameCount++;
    const speed = LEVEL_SPEEDS[Math.min(this.level, LEVEL_SPEEDS.length - 1)];
    if (this.frameCount >= speed) {
      this.frameCount = 0;
      if (!this.currentPiece.moveDown(this.board)) {
        this.lockPiece();
      }
    }
    this.renderer.render(this.board, this.currentPiece, this.nextPiece, this.theme);
    this.renderMobileNext();
    this.animFrameId = requestAnimationFrame((t) => this.tick(t));
  }

  destroy() {
    this.stop();
  }
}
