package com.techelevator;

import org.junit.*;

import com.techelevator.model.SudokuBoard;
import com.techelevator.model.SudokuSquare;

import static org.junit.Assert.*;

public class SudokuBoardTest {

    SudokuBoard board ;
    
    private void setupAllUnset() {
    	int[][] testSetup = new int[SudokuBoard.BOARD_SIZE][SudokuBoard.BOARD_SIZE];
    	board =  new SudokuBoard(testSetup);
    }
   
    private void setupWithOneAtRow0Col0() {
    	int[][] testSetup = new int[SudokuBoard.BOARD_SIZE][SudokuBoard.BOARD_SIZE];
    	testSetup[0][0] = 1; 
    
    	board = new SudokuBoard(testSetup);
    }
    

    private void setupWithOneAtRow1Col1() {
    	int[][] testSetup = new int[SudokuBoard.BOARD_SIZE][SudokuBoard.BOARD_SIZE];    	
    	testSetup[1][1] = 1;     	
    	board = new SudokuBoard(testSetup);
    }

    private void setupWithOneAtRow1Col7() {
    	int[][] testSetup = new int[SudokuBoard.BOARD_SIZE][SudokuBoard.BOARD_SIZE];    	
    	testSetup[1][7] = 1;     	
    	board = new SudokuBoard(testSetup);
    }
    
    private void setupSampleBoard() {
    	board =  new SudokuBoard("SampleBoard.txt");
    }
    
    @Test
    public void testTheSquare() {//this should really be in its own file but I'm lazy
    	SudokuSquare square = new SudokuSquare();
    	square.setValue(1);
        Assert.assertEquals(1, square.getValue());
        square.setValue(10);//this won't do anything
        Assert.assertEquals(1, square.getValue());
        square = new SudokuSquare(5); //if we init to 5, it's assumed to be given and we can't change it
        Assert.assertEquals(5, square.getValue());
        Assert.assertEquals(true,square.isDetermined());
        square.setValue(6); //we can't change it if it's determined  
        Assert.assertEquals(5, square.getValue());
    }
   
    @Test
    public void sampleBoardLoadedCorrectly() {
    	setupSampleBoard();
    	Assert.assertEquals("Sample Board - 9 forbidden at 0,0",false, board.isAllowed(0, 0, 9));
    	Assert.assertEquals("Sample Board - 9 forbidden at 2,0",false, board.isAllowed(2, 0, 9));
    	Assert.assertEquals("Sample Board - 9 forbidden at 2,2",false, board.isAllowed(2, 2, 9));
    	Assert.assertEquals("Sample Board - 9 allowed at 3,0",true, board.isAllowed(3, 0, 9));
    }
    
    @Test
    public void testEverything1Thru9AllowedWhenAllUnset() {
    	setupAllUnset();
        Assert.assertEquals("When all are unset, anything goes",true, board.isAllowed(0, 0, 9));
        Assert.assertEquals("When all are unset, anything goes",true, board.isAllowed(5, 5, 1));      
    }
    
    
    @Test
    public void testIsNotAllowedWhenAlreadyInRow() {
    	setupWithOneAtRow0Col0();
        Assert.assertEquals("In a row with a one, a one is not allowed",false, board.isAllowed(0, 5, 1));
       
    }
    
    @Test
    public void testIsAllowedWhenNotAlreadyInRow() {
    	setupWithOneAtRow0Col0();
        Assert.assertEquals("In a row with a one, a two is allowed",true, board.isAllowed(0, 5, 2));
       
    }
    
    @Test
    public void testIsNotAllowedWhenAlreadyInCol() {
    	setupWithOneAtRow0Col0();
        Assert.assertEquals("In a column with a one, a one is not allowed",false, board.isAllowed(8, 0, 1));
       
    }
    
    @Test
    public void testIsAllowedWhenNotAlreadyInCol() {
    	setupWithOneAtRow0Col0();
        Assert.assertEquals("In a column with a one, a two is allowed",true, board.isAllowed(8, 0, 2));
       
    }
    
    @Test
    public void testIsAllowedWhenNotAlreadyInBox() {
    	setupWithOneAtRow1Col1();
    	//a two can go anywhere 
    	for (int row = 0; row<3; row++) {
    		for (int col = 0; col<3; col++) {
    			if (row ==1 && col==1) {
    				Assert.assertEquals("If a value is given, you can't set it",false, board.isAllowed(row,col, 2));
    			}
    			else {
    				Assert.assertEquals("In a box that already has a 1, a two is allowed",true, board.isAllowed(row,col, 2));
    			}
    		}
    	}
      
    }

    @Test
    public void testIsNotAllowedWhenAlreadyInBox() {
    	setupWithOneAtRow1Col1();
    	//a one is not allowed anywhere 
    	for (int row = 0; row<3; row++) {
    		for (int col = 0; col<3; col++) {
    			if (row ==1 && col==1) {
    				Assert.assertEquals("If a value is given, you can't set it",false, board.isAllowed(row,col, 2));
    			}
    			else {
    				Assert.assertEquals("In a box that already has a 1, a 1 is not allowed at row "+row+" col "+col,false, board.isAllowed(row,col, 1));
    			}
    		}
    	}       
    }

    @Test
    public void testIsNotAllowedWhenAlreadyInBox3() {
    	setupWithOneAtRow1Col7();
    	
    	
    	//a one is not allowed anywhere 
    	for (int row = 0; row<3; row++) {
    		for (int col = 6; col<9; col++) {
    			
    				Assert.assertEquals("In a box that already has a 1, a 1 is not allowed at row "+row+" col "+col,false, board.isAllowed(row,col, 1));
    			
    		}
    	}       
    }


    @Test
    public void testReset()
    {
    	setupAllUnset();
    	Assert.assertEquals("You can set everythign",true, board.isAllowed(1, 1, 2));
    	board.setValue(1, 1, 2);
    	Assert.assertEquals("Once it is set, you can't set it again",false, board.isAllowed(1, 1, 3));
    	board.resetSquare(1, 1);
    	Assert.assertEquals("If you reset the square, you are allowed to set it again",true, board.isAllowed(1, 1, 3));
    }

}