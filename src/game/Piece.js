import { PIECE_SHAPES, PIECE_TYPES, WALL_KICKS, COLS } from '../constants.js';

export class Piece {
  constructor(type) {
    this.type = type;
    this.shape = PIECE_SHAPES[type].map(r => [...r]);
    this.row = 0;
    this.col = Math.floor((COLS - this.shape[0].length) / 2);
  }

  static randomBag() {
    const bag = [...PIECE_TYPES];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    return bag;
  }

  rotateCW(board) {
    const n = this.shape.length;
    const rotated = Array.from({ length: n }, (_, r) =>
      Array.from({ length: n }, (_, c) => this.shape[n - 1 - c][r])
    );
    for (const [dc, dr] of WALL_KICKS) {
      if (board.isValidPosition(rotated, this.row + dr, this.col + dc)) {
        this.shape = rotated;
        this.row += dr;
        this.col += dc;
        return true;
      }
    }
    return false;
  }

  rotateCCW(board) {
    const n = this.shape.length;
    const rotated = Array.from({ length: n }, (_, r) =>
      Array.from({ length: n }, (_, c) => this.shape[c][n - 1 - r])
    );
    for (const [dc, dr] of WALL_KICKS) {
      if (board.isValidPosition(rotated, this.row + dr, this.col + dc)) {
        this.shape = rotated;
        this.row += dr;
        this.col += dc;
        return true;
      }
    }
    return false;
  }

  moveLeft(board) {
    if (board.isValidPosition(this.shape, this.row, this.col - 1)) {
      this.col--;
      return true;
    }
    return false;
  }

  moveRight(board) {
    if (board.isValidPosition(this.shape, this.row, this.col + 1)) {
      this.col++;
      return true;
    }
    return false;
  }

  moveDown(board) {
    if (board.isValidPosition(this.shape, this.row + 1, this.col)) {
      this.row++;
      return true;
    }
    return false;
  }

  getGhostRow(board) {
    let r = this.row;
    while (board.isValidPosition(this.shape, r + 1, this.col)) r++;
    return r;
  }

  hardDrop(board) {
    this.row = this.getGhostRow(board);
  }
}
