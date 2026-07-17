import { COLS, ROWS, CELL_SIZE, NEXT_CELL_SIZE } from '../constants.js';

export class Renderer {
  constructor(boardCanvas, nextCanvas) {
    this.boardCanvas = boardCanvas;
    this.boardCtx = boardCanvas.getContext('2d');
    this.nextCanvas = nextCanvas;
    this.nextCtx = nextCanvas.getContext('2d');
    this.boardCanvas.width = COLS * CELL_SIZE;
    this.boardCanvas.height = ROWS * CELL_SIZE;
    this.nextCanvas.width = 4 * NEXT_CELL_SIZE;
    this.nextCanvas.height = 4 * NEXT_CELL_SIZE;
  }

  render(board, currentPiece, nextPiece, theme) {
    this.renderBoard(board, currentPiece, theme);
    this.renderNext(nextPiece, theme);
  }

  renderBoard(board, currentPiece, theme) {
    const ctx = this.boardCtx;
    const w = COLS * CELL_SIZE;
    const h = ROWS * CELL_SIZE;

    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = theme.gridLine;
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * CELL_SIZE); ctx.lineTo(w, r * CELL_SIZE); ctx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath(); ctx.moveTo(c * CELL_SIZE, 0); ctx.lineTo(c * CELL_SIZE, h); ctx.stroke();
    }

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const color = board.grid[r][c];
        if (color) {
          ctx.fillStyle = color;
          this.drawBlock(ctx, c, r, CELL_SIZE);
        }
      }
    }

    if (!currentPiece) return;

    const ghostRow = currentPiece.getGhostRow(board);
    ctx.fillStyle = theme.ghost;
    for (let r = 0; r < currentPiece.shape.length; r++) {
      for (let c = 0; c < currentPiece.shape[r].length; c++) {
        if (currentPiece.shape[r][c]) {
          this.drawBlock(ctx, currentPiece.col + c, ghostRow + r, CELL_SIZE);
        }
      }
    }

    const color = theme[currentPiece.type];
    if (color) {
      ctx.fillStyle = color;
      for (let r = 0; r < currentPiece.shape.length; r++) {
        for (let c = 0; c < currentPiece.shape[r].length; c++) {
          if (currentPiece.shape[r][c]) {
            this.drawBlock(ctx, currentPiece.col + c, currentPiece.row + r, CELL_SIZE);
          }
        }
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      for (let r = 0; r < currentPiece.shape.length; r++) {
        for (let c = 0; c < currentPiece.shape[r].length; c++) {
          if (currentPiece.shape[r][c]) {
            ctx.strokeRect(
              (currentPiece.col + c) * CELL_SIZE + 1.5,
              (currentPiece.row + r) * CELL_SIZE + 1.5,
              CELL_SIZE - 3, CELL_SIZE - 3
            );
          }
        }
      }
    }
  }

  renderNext(nextPiece, theme) {
    const ctx = this.nextCtx;
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, 4 * NEXT_CELL_SIZE, 4 * NEXT_CELL_SIZE);
    if (!nextPiece) return;
    const color = theme[nextPiece.type];
    if (!color) return;
    ctx.fillStyle = color;
    for (let r = 0; r < nextPiece.shape.length; r++) {
      for (let c = 0; c < nextPiece.shape[r].length; c++) {
        if (nextPiece.shape[r][c]) {
          this.drawBlock(ctx, c, r, NEXT_CELL_SIZE);
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
