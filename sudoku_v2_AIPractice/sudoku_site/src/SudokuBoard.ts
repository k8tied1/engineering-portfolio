export const BOARD_SIZE = 9;
export const SMALL_BOX_SIZE = 3;

export class SudokuSquare {
value: number;
isDetermined: boolean;

constructor(value = 0, isDetermined = value !== 0) {
  this.value = value;
  this.isDetermined = isDetermined;
}

  resetValue(): void {
    if (!this.isDetermined) this.value = 0;
  }

  isSet(): boolean {
    return this.value !== 0;
  }

  setValue(value: number): void {
    if (value >= 1 && value <= 9 && !this.isDetermined) this.value = value;
  }

  copy(): SudokuSquare {
    return new SudokuSquare(this.value, this.isDetermined);
  }
}

export class SudokuBoard {
  private board: SudokuSquare[][];

  constructor(init?: number[][]) {
    this.board = Array.from({ length: BOARD_SIZE }, (_, r) =>
      Array.from({ length: BOARD_SIZE }, (_, c) => new SudokuSquare(init?.[r]?.[c] ?? 0)),
    );
  }

  /** Replaces the Java file constructor: rows are newline separated, cells are "|" delimited, blanks are unset. */
  static fromText(text: string): SudokuBoard {
    const grid = text
      .split("\n")
      .slice(0, BOARD_SIZE)
      .map((line) => line.split("|").slice(0, BOARD_SIZE).map((v) => parseInt(v, 10) || 0));
    return new SudokuBoard(grid);
  }

  copy(): SudokuBoard {
    const b = new SudokuBoard();
    b.board = this.board.map((row) => row.map((sq) => sq.copy()));
    return b;
  }

  getValue(row: number, col: number): number {
    return this.board[row][col].value;
  }

  isGiven(row: number, col: number): boolean {
    return this.board[row][col].isDetermined;
  }

  isSet(row: number, col: number): boolean {
    return this.board[row][col].isSet();
  }

  /** Returns false if the move isn't allowed by what's already filled in. */
  setValue(row: number, col: number, value: number): boolean {
    if (!this.isAllowed(row, col, value)) return false;
    this.board[row][col].setValue(value);
    return true;
  }

  resetSquare(row: number, col: number): void {
    this.board[row][col].resetValue();
  }

  isAllowed(row: number, col: number, value: number): boolean {
    return (
      !this.isSet(row, col) &&
      !this.rowContains(row, value) &&
      !this.columnContains(col, value) &&
      !this.boxContains(row, col, value)
    );
  }

  private rowContains(row: number, value: number): boolean {
    return this.board[row].some((sq) => sq.value === value);
  }

  private columnContains(col: number, value: number): boolean {
    return this.board.some((r) => r[col].value === value);
  }

  private boxContains(row: number, col: number, value: number): boolean {
    const top = Math.floor(row / SMALL_BOX_SIZE) * SMALL_BOX_SIZE;
    const left = Math.floor(col / SMALL_BOX_SIZE) * SMALL_BOX_SIZE;
    for (let r = top; r < top + SMALL_BOX_SIZE; r++)
      for (let c = left; c < left + SMALL_BOX_SIZE; c++)
        if (this.board[r][c].value === value) return true;
    return false;
  }

  /** True if any two filled squares in a row, column or box share a value. New: useful for validating user input. */
  hasConflicts(): boolean {
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++) {
        const v = this.board[r][c].value;
        if (v === 0) continue;
        const sq = this.board[r][c];
        sq.value = 0; // temporarily clear so it doesn't match itself
        const clash =
          this.rowContains(r, v) || this.columnContains(c, v) || this.boxContains(r, c, v);
        sq.value = v;
        if (clash) return true;
      }
    return false;
  }

  isCorrectlyFilled(): boolean {
    const complete = (cells: SudokuSquare[]) => new Set(cells.map((s) => s.value)).size === BOARD_SIZE &&
      cells.every((s) => s.value !== 0);
    for (let i = 0; i < BOARD_SIZE; i++) {
      if (!complete(this.board[i])) return false;
      if (!complete(this.board.map((r) => r[i]))) return false;
    }
    for (let top = 0; top < BOARD_SIZE; top += SMALL_BOX_SIZE)
      for (let left = 0; left < BOARD_SIZE; left += SMALL_BOX_SIZE) {
        const cells: SudokuSquare[] = [];
        for (let r = top; r < top + SMALL_BOX_SIZE; r++)
          for (let c = left; c < left + SMALL_BOX_SIZE; c++) cells.push(this.board[r][c]);
        if (!complete(cells)) return false;
      }
    return true;
  }

  toGrid(): number[][] {
    return this.board.map((row) => row.map((sq) => sq.value));
  }

  toString(): string {
    return this.board.map((row) => row.map((sq) => (sq.value === 0 ? " " : sq.value) + "|").join("")).join("\n");
  }
}
