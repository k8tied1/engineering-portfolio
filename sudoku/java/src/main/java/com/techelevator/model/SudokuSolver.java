package com.techelevator.model;

import java.util.Stack;

public class SudokuSolver {
	
	private SudokuBoard board; 
	private Stack<SudokuMove> movesTried = new Stack<SudokuMove>();
	private boolean debug = false;
	
	public SudokuSolver(SudokuBoard board) {
		if (board!=null) {
			this.board = board.Copy();
		}
	}
	
	
	
	public SudokuBoard BruteForceSolve() {
		
		if (board==null) {
			return null;
		}
		
		//let's start at 0,0 and rock and roll		
		if (TrySettingValueForRowCol(0,0))		
			return board;	
		
		return null;
	}
	
	public boolean TrySettingValueForRowCol (int tryRow, int tryCol) {
		if (debug) {
			System.out.println("Working on ["+tryRow + "] ["+tryCol+"]" + "\n" + board);
		}
		
		//if it's given, skip it 
		if (board.isGiven(tryRow,tryCol)) {
			
			if (debug) {
				System.out.println("   **Given value**");
			}
			SudokuMove nextSquare = nextSquare(tryRow, tryCol);
			if (nextSquare==null) //we're at the end of the board
				return true;
			
			return TrySettingValueForRowCol(nextSquare.row,nextSquare.col);
		}
		
		//it wasn't given so let's try all the values 1-9
		for (int tryVal = 1; tryVal <= SudokuBoard.BOARD_SIZE; tryVal++) {			
			
			if (debug) {
				System.out.println("   Let's try "+tryVal +" for ["+tryRow+"] ["+tryCol+"]");
			}
			
			//if we can't set the value because it's not allowed, loop through and try the next value
			if (board.setValue(tryRow, tryCol, tryVal)) {
				
				SudokuMove nextSquare = nextSquare(tryRow, tryCol);
				if (nextSquare==null) //we're at the end of the board
					return true;
				
				if (! TrySettingValueForRowCol(nextSquare.row,nextSquare.col))
				{
					if (debug) {
						System.out.println("   Well that didn't work. Resetting ["+tryRow+"] ["+tryCol+"]");
					}
					board.resetSquare(tryRow, tryCol);
				}
			}
		}
		 
		return (board.isCorrectlyFilled());
		
	}



	/**
	 * @param tryRow
	 * @param tryCol
	 */
	private SudokuMove nextSquare(int tryRow, int tryCol) {
		SudokuMove nextMove = new SudokuMove();
		
		//if there's columns left in this row, we'll try setting the next column in this row
		if (tryCol < SudokuBoard.BOARD_SIZE-1) {
			 nextMove.row = tryRow;
			 nextMove.col = tryCol+1; 
		}
		//if there's no columns left in this row, we'll try setting the first column in the next row
		else if (tryRow < SudokuBoard.BOARD_SIZE-1){
			nextMove.row = tryRow+1; 
			nextMove.col = 0;
		}
		else { //we're at spot [8][8] so we've filled the whole board
			return null;
		}
		return nextMove; 
	}
	
	
	private SudokuBoard SolveALittleSmarter() {
		SudokuMove firstMove = FindNextBestMove();
		
		//KD TODO do this
		return board;
	}



	private SudokuMove FindNextBestMove() {
		
		int [] rowPopCounts = new int[SudokuBoard.BOARD_SIZE];
		int [] colPopCounts = new int[SudokuBoard.BOARD_SIZE];
		int [] boxPopCounts =  new int[SudokuBoard.BOARD_SIZE];		
		int boxNum = 0; 
		
		int maxCount = 0;
		int pickRow = 0;
		int pickCol = 0; 
		
		for (int row = 0; row<SudokuBoard.BOARD_SIZE; row++) {
			for (int col = 0; col < SudokuBoard.BOARD_SIZE; col++) {
				if (board.isSet(row, col, true)) {
					rowPopCounts[row]++;
					colPopCounts[col]++;
					boxPopCounts[boxNum]++;
				}
	
				if (rowPopCounts[row] > maxCount) {
					maxCount = rowPopCounts[row];
					pickRow = row;
					pickCol = col;
				}
				else if (colPopCounts[col] > maxCount) {
					maxCount = colPopCounts[col];
					pickRow = row;
					pickCol = col;
				}
				else if (boxPopCounts[boxNum] > maxCount) {
					maxCount = boxPopCounts[row];
					pickRow = row;
					pickCol = col;
				}
				//increment the box number if we need to
				if (col % SudokuBoard.SMALL_BOX_SIZE ==0) {
					boxNum ++;
				}
				
			}
		}
		return new SudokuMove(pickRow,pickCol,0);
	
	}



	private class SudokuMove {
		public int row;
		public int col;
		public int value;	
		
		public SudokuMove(int row, int column, int value) {
			this.row = row;
			this.col = column;
			this.value  = value;
		}

		public SudokuMove() {
			// TODO Auto-generated constructor stub
		}
	}
}


