import { useEffect, useRef, useState } from "react";
import { SudokuBoard, BOARD_SIZE, SMALL_BOX_SIZE } from "./SudokuBoard";
import { SudokuSolver } from "./SudokuSolver";
import { readBoardFromImage } from "./readBoardFromImage";

const EXAMPLE = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

const empty = () => Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
const noFlags = () => Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(false));

export default function App() {
  const [given, setGiven] = useState<number[][]>(empty());
  const [uncertain, setUncertain] = useState<boolean[][]>(noFlags());
  const [solved, setSolved] = useState<number[][] | null>(null);
  const [message, setMessage] = useState("Type a puzzle, or paste a screenshot of one (Ctrl/Cmd+V).");
  const [reading, setReading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const importImage = async (blob: Blob) => {
    setReading(true);
    setSolved(null);
    try {
      const result = await readBoardFromImage(blob, (n) => setMessage(`Reading image… ${n}/81`));
      setGiven(result.grid);
      setUncertain(result.uncertain);
      const flagged = result.uncertain.flat().filter(Boolean).length;
      setMessage(
        flagged
          ? `Read the board. ${flagged} highlighted cell(s) may be wrong, so check them, then press Solve.`
          : "Read the board. Check the digits, then press Solve.",
      );
    } catch {
      setMessage("Couldn't read that image. Try cropping it tightly to the 9x9 grid.");
    } finally {
      setReading(false);
    }
  };

  // Paste a screenshot anywhere on the page
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith("image/"));
      const file = item?.getAsFile();
      if (file) {
        e.preventDefault();
        importImage(file);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  const reset = (grid: number[][]) => {
    setGiven(grid);
    setUncertain(noFlags());
    setSolved(null);
    setMessage("");
  };

  const edit = (r: number, c: number, text: string) => {
    const n = parseInt(text.slice(-1), 10);
    setGiven(given.map((row, i) => row.map((v, j) => (i === r && j === c ? (n >= 1 && n <= 9 ? n : 0) : v))));
    setUncertain(uncertain.map((row, i) => row.map((f, j) => (i === r && j === c ? false : f))));
    setSolved(null);
  };

  const solve = () => {
    const board = new SudokuBoard(given);
    if (board.hasConflicts()) {
      setMessage("Those starting numbers conflict with each other. Check for misread digits.");
      return;
    }
    const result = new SudokuSolver(board).bruteForceSolve();
    setSolved(result ? result.toGrid() : null);
    setMessage(result ? "Solved!" : "No solution exists for this puzzle.");
  };

  const border = (i: number) => (i % SMALL_BOX_SIZE === 0 ? "2px solid #333" : "1px solid #bbb");

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 440, margin: "2rem auto", textAlign: "center" }}>
      <h1>Sudoku Solver</h1>
      <div style={{ display: "inline-grid", gridTemplateColumns: `repeat(${BOARD_SIZE}, 44px)`, borderRight: "2px solid #333", borderBottom: "2px solid #333" }}>
        {given.map((row, r) =>
          row.map((v, c) => {
            const fromSolver = solved && v === 0;
            return (
              <input
                key={`${r}-${c}`}
                value={solved ? solved[r][c] : v || ""}
                readOnly={!!solved || reading}
                onChange={(e) => edit(r, c, e.target.value)}
                inputMode="numeric"
                style={{
                  width: 44, height: 44, boxSizing: "border-box", textAlign: "center", fontSize: 20,
                  borderTop: border(r), borderLeft: border(c), borderRight: "none", borderBottom: "none",
                  background: uncertain[r][c] && !solved ? "#ffe0b2" : "#fff",
                  fontWeight: fromSolver ? 400 : 700, color: fromSolver ? "#1a73e8" : "#111",
                }}
              />
            );
          }),
        )}
      </div>
      <div style={{ marginTop: 16, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
        <button onClick={solve} disabled={!!solved || reading}>Solve</button>
        <button onClick={() => { setSolved(null); setMessage(""); }} disabled={!solved}>Edit</button>
        <button onClick={() => fileRef.current?.click()} disabled={reading}>Upload image</button>
        <button onClick={() => reset(EXAMPLE)} disabled={reading}>Example</button>
        <button onClick={() => reset(empty())} disabled={reading}>Clear</button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importImage(f);
            e.target.value = "";
          }}
        />
      </div>
      <p>{message}</p>
    </div>
  );
}
