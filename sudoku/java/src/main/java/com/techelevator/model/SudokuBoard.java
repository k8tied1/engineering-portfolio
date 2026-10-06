package com.techelevator.model;

import java.io.File;
import java.util.HashSet;
import java.util.Scanner;
import java.util.Set;

public class SudokuBoard {
	
	public static int BOARD_SIZE =9 ;
	public static int SMALL_BOX_SIZE=3;
	
	private SudokuSquare [][] board = new SudokuSquare[BOARD_SIZE][BOARD_SIZE];;
	
	
	public SudokuBoard() {
		
	}
	
	// this will init to any size board so that unit testing becomes easier
	public SudokuBoard(int [][] init) {
		for (int i=0;i<init.length;i++) {
			for (int j=0;j<init[i].length; j++) {
				board[i][j] = new SudokuSquare(init[i][j]); 
			}
		}
		setRestToUnset();
	}
	
	
	public SudokuBoard Copy() {
		SudokuBoard newBoard = new SudokuBoard();
		for (int i=0;i< board.length;i++) {
			for (int j=0;j<board[i].length; j++) {
				newBoard.board[i][j] = board[i][j].Copy(); 
			}
		}
		return newBoard;
	}
	
	private void setRestToUnset()
	{
		for (int i=0;i<BOARD_SIZE;i++) {
			for (int j=0;j<BOARD_SIZE;j++) {
				if (board[i][j]==null) {
					board[i][j] = new SudokuSquare();
				}
			}
		}
	}
	
	
	//this constructor takes a file name where the file is assumed to be in the format
	//of a sudoku board where unset are blank spaces and rows are | delimited
	public SudokuBoard(String fileName) {
		File f = new File(fileName);
		try {
			Scanner s = new Scanner(f);
			int row=0, col = 0;
			while (s.hasNext()) {
				String line = s.nextLine();
				for( String val: line.split("\\|")) {
					if (row<BOARD_SIZE && col<BOARD_SIZE) { // if they have extra stuff at the end of the line or the end of the file, ignore it
						board[row][col++] = new SudokuSquare(val);
					}
				}
				row++;
				col = 0;
			}
		}
		catch (Exception e)
		{
			setRestToUnset();
		}

	}
	
	public boolean isGiven(int row, int column) {
		return board[row][column] !=null &&  board[row][column].isDetermined();
	}
	
	/*
	 * This will return false if the move is not allowed based on other values already filled in
	 */
	public boolean setValue(int row, int column, int value) {
		if (isAllowed(row,column,value)) {
			board[row][column].setValue(value); 
			return true;
		}
		return false;
	}
	
	public boolean isSet(int row, int column, boolean onlyTrueIfDetermined) {
		if (board[row][column] == null) { 
			return !onlyTrueIfDetermined;
		}
		return board[row][column].isSet(); 
		
	}
	
	public void resetSquare (int row, int column) {
		board[row][column].resetValue();
	}
	
	public boolean isAllowed(int row,int column, int value) {		
		boolean notAlreadySet = !isSet(row,column,false);
		boolean notInRow = !rowContainsValue(row,value);
		boolean notInCol = !columnContainsValue(column, value);
		boolean notInBox = !boxContainsValue(row,column,value);
		
		return  notAlreadySet && notInRow && notInCol && notInBox; 
		
	}

	private boolean boxContainsValue(int row, int column, int value) {
		boolean foundValue = false;
		//Find the upper left corner of the box that row column is in
		int upperLeftRow = (row/SMALL_BOX_SIZE) * SMALL_BOX_SIZE; 
		int upperLeftCol = (column/SMALL_BOX_SIZE) * SMALL_BOX_SIZE;
		
		for (int r=upperLeftRow; r<upperLeftRow+SMALL_BOX_SIZE; r++ ) {
			for (int c = upperLeftCol; c <upperLeftCol+SMALL_BOX_SIZE; c++) {
				if (board[r][c] != null && board[r][c].getValue() == value)
				{
					foundValue = true;
					break;
				}
			}
		}
		
		return foundValue;
	}

	private boolean columnContainsValue(int column, int value) {
		boolean foundValue = false;
		for (int row=0; row<board.length; row++ ) {
			if (board[row][column] != null && board[row][column].getValue()==value) {
				foundValue = true;
				break;
			}
		}
		return foundValue;	
	}

	private boolean rowContainsValue(int row, int value) {
		boolean foundValue = false;
		for (int column=0; column<board[row].length; column++ ) {
			if (board[row][column] != null && board[row][column].getValue()==value) {
				foundValue = true;
				break;
			}
		}
		return foundValue;	
	}
	
	@Override
	public String toString() {
		String retValue = "";
		for (int row = 0; row < BOARD_SIZE; row++) {
			for (int col = 0; col<BOARD_SIZE; col++) {
				retValue += (board[row][col]==null)?" ":board[row][col] + "|";					
			}
			retValue += "\n";
		}
			
	    return retValue;
	}

	public boolean isCorrectlyFilled() {
		return checkRows() && checkColumns() && checkBoxes(); 
		
	}

	private boolean checkBoxes() {
		Set<Integer> foundValues = new HashSet<Integer>();
		
		for (int upperLeftRow=0; upperLeftRow<BOARD_SIZE-1; upperLeftRow+=3) {
			for (int upperLeftCol=0; upperLeftCol<BOARD_SIZE-1; upperLeftCol+=3) {
			
				for (int r=upperLeftRow; r<upperLeftRow+SMALL_BOX_SIZE; r++ ) {
					for (int c = upperLeftCol; c <upperLeftCol+SMALL_BOX_SIZE; c++) {
						if (board[r][c]==null) {
							return false;
						}
						foundValues.add(board[r][c].getValue());		
					}
				}
				if (foundValues.size()<BOARD_SIZE) {
					return false;
				}
				else {
					foundValues.clear();
				}
					
			}
		}
		
		return true;	
		}

	

	private boolean checkColumns() {
		//using the set is faster than using columnContains value. why?
		Set<Integer> foundValues = new HashSet();
		for (int col=0; col<BOARD_SIZE; col++) {
			for (int row =0; row<BOARD_SIZE; row++) {				
					if (board[row][col]==null) {
						return false;
					}
					foundValues.add(board[row][col].getValue());				
			}
			if (foundValues.size() < BOARD_SIZE)
				return false;
			else {
				foundValues.clear();
			}
		}
		return true;
	}

	private boolean checkRows() {
		Set<Integer> foundValues = new HashSet();
		for (int row =0; row<BOARD_SIZE; row++) {
			for (int col=0; col<BOARD_SIZE; col++) {
				if (board[row][col]==null) {
					return false;
				}
				foundValues.add(board[row][col].getValue());
			}
			if (foundValues.size() < BOARD_SIZE)
				return false;
			else {
				foundValues.clear();
			}
		}
		return true;
	}

}
