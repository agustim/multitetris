import { COLS, ROWS } from '../constants.js';

export class Board {
  constructor() {
    this.grid = this.createEmptyGrid();
  }

  createEmptyGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  reset() {
    this.grid = this.createEmptyGrid();
  }

  isValidPosition(shape, row, col) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const nr = row + r;
        const nc = col + c;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return false;
        if (this.grid[nr][nc] !== null) return false;
      }
    }
    return true;
  }

  place(shape, row, col, color) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          this.grid[row + r][col + c] = color;
        }
      }
    }
  }

  clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.grid[r].every(cell => cell !== null)) {
        this.grid.splice(r, 1);
        this.grid.unshift(Array(COLS).fill(null));
        cleared++;
        r++;
      }
    }
    return cleared;
  }

  getBottomRows(n) {
    const start = Math.max(0, ROWS - n);
    return this.grid.slice(start).map(row => [...row]);
  }

  addRowsToBottom(rows) {
    for (const row of rows) {
      this.grid.shift();
      this.grid.push([...row]);
    }
  }

  isOverflowed() {
    return this.grid[0].some(c => c !== null) || this.grid[1].some(c => c !== null);
  }

  getOccupiedLines() {
    return this.grid.filter(row => row.some(c => c !== null)).length;
  }
}
