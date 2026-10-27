import { SudokuBoard, BOARD_SIZE } from "./SudokuBoard";

interface Cell {
  row: number;
  col: number;
}

export class SudokuSolver {
  private board: SudokuBoard;

  constructor(board: SudokuBoard) {
    this.board = board.copy();
  }

  /** Returns the solved board, or null if there's no solution. */
  bruteForceSolve(): SudokuBoard | null {
    return this.trySettingValueForRowCol(0, 0) ? this.board : null;
  }

  private trySettingValueForRowCol(row: number, col: number): boolean {
    const next = this.nextSquare(row, col);

    // Given squares are skipped
    if (this.board.isGiven(row, col)) {
      return next === null || this.trySettingValueForRowCol(next.row, next.col);
    }

    for (let val = 1; val <= BOARD_SIZE; val++) {
      if (!this.board.setValue(row, col, val)) continue;
      if (next === null || this.trySettingValueForRowCol(next.row, next.col)) return true;
      this.board.resetSquare(row, col); // dead end, backtrack
    }
    return false;
  }

  private nextSquare(row: number, col: number): Cell | null {
    if (col < BOARD_SIZE - 1) return { row, col: col + 1 };
    if (row < BOARD_SIZE - 1) return { row: row + 1, col: 0 };
    return null; // finished [8][8]
  }
}
