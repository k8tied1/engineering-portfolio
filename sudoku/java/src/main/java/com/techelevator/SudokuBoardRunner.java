package com.techelevator;

import java.util.Scanner;

import com.techelevator.model.SudokuBoard;
import com.techelevator.model.SudokuSolver;

public class SudokuBoardRunner {
	
	private SudokuBoard board;
	
	public void loadBoardFromFile(String fileName) {
		board = new SudokuBoard(fileName);		
	}
	
	private void displayBoard() {
		System.out.println("Sudoku Board");
		System.out.println( (board == null) ? "Not initialized":board);		
	}

	/**
	 * 
	 */
	private void findAndDisplaySolution() {
		SudokuSolver solver  = new SudokuSolver(board);
		SudokuBoard solution = solver.BruteForceSolve();
		System.out.println("Sudoku Board Solution");
		System.out.println( (solution == null) ? "Not initialized":solution);
	}
	
	
	
	public static void main(String [] args) {
		SudokuBoardRunner runIt = new SudokuBoardRunner();
		System.out.println("Enter file name (SampleBoard.txt is in this dir): ");
		Scanner input = new Scanner(System.in);
		runIt.loadBoardFromFile(input.nextLine());
		runIt.displayBoard();
		runIt.findAndDisplaySolution();
	}

 }