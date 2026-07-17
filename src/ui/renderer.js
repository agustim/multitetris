import { COLS, ROWS, getCellSizes } from '../constants.js';

export class Renderer {
  constructor(boardCanvas, nextCanvas) {
    this.boardCanvas = boardCanvas;
    this.boardCtx = boardCanvas.getContext('2d');
    this.nextCanvas = nextCanvas;
    this.nextCtx = nextCanvas.getContext('2d');

    this.cellSize = 28;
    this.nextCellSize = 22;

    this.resize();
  }

  resize() {
    const sizes = getCellSizes();
    this.cellSize = sizes.cellSize;
    this.nextCellSize = sizes.nextCellSize;
    this.boardCanvas.width = COLS * this.cellSize;
    this.boardCanvas.height = ROWS * this.cellSize;
    this.nextCanvas.width = 4 * this.nextCellSize;
    this.nextCanvas.height = 4 * this.nextCellSize;
  }

  render(board, currentPiece, nextPiece, theme) {
    this.renderBoard(board, currentPiece, theme);
    this.renderNext(nextPiece, theme);
  }

  renderBoard(board, currentPiece, theme) {
    const ctx = this.boardCtx;
    const w = COLS * this.cellSize;
    const h = ROWS * this.cellSize;

    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = theme.gridLine;
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * this.cellSize); ctx.lineTo(w, r * this.cellSize); ctx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath(); ctx.moveTo(c * this.cellSize, 0); ctx.lineTo(c * this.cellSize, h); ctx.stroke();
    }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const color = board.grid[r][c];
        if (color) {
          ctx.fillStyle = color;
          this.drawBlock(ctx, c, r, this.cellSize);
        }
      }
    }

    if (!currentPiece) return;

    const ghostRow = currentPiece.getGhostRow(board);
    ctx.fillStyle = theme.ghost;
    for (let r = 0; r < currentPiece.shape.length; r++) {
      for (let c = 0; c < currentPiece.shape[r].length; c++) {
        if (currentPiece.shape[r][c]) {
          this.drawBlock(ctx, currentPiece.col + c, ghostRow + r, this.cellSize);
        }
      }
    }

    const color = theme[currentPiece.type];
    if (color) {
      ctx.fillStyle = color;
      for (let r = 0; r < currentPiece.shape.length; r++) {
        for (let c = 0; c < currentPiece.shape[r].length; c++) {
          if (currentPiece.shape[r][c]) {
            this.drawBlock(ctx, currentPiece.col + c, currentPiece.row + r, this.cellSize);
          }
        }
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      for (let r = 0; r < currentPiece.shape.length; r++) {
        for (let c = 0; c < currentPiece.shape[r].length; c++) {
          if (currentPiece.shape[r][c]) {
            ctx.strokeRect(
              (currentPiece.col + c) * this.cellSize + 1.5,
              (currentPiece.row + r) * this.cellSize + 1.5,
              this.cellSize - 3, this.cellSize - 3
            );
          }
        }
      }
    }
  }

  renderNext(nextPiece, theme) {
    const ctx = this.nextCtx;
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, 4 * this.nextCellSize, 4 * this.nextCellSize);
    if (!nextPiece) return;
    const color = theme[nextPiece.type];
    if (!color) return;
    ctx.fillStyle = color;
    for (let r = 0; r < nextPiece.shape.length; r++) {
      for (let c = 0; c < nextPiece.shape[r].length; c++) {
        if (nextPiece.shape[r][c]) {
          this.drawBlock(ctx, c, r, this.nextCellSize);
        }
      }
    }
  }

  drawBlock(ctx, col, row, size) {
    const x = col * size;
    const y = row * size;
    ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(x + 1, y + 1, size - 2, 3);
    ctx.fillRect(x + 1, y + 1, 3, size - 2);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(x + size - 3, y + 1, 2, size - 2);
    ctx.fillRect(x + 1, y + size - 3, size - 2, 2);
    ctx.restore();
  }
}
