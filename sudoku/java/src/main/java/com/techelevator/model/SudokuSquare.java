package com.techelevator.model;

public class SudokuSquare {
	

	private int value; //the value 1-9 of the given square
	private boolean isDetermined; //if the value was given at the board definition or there are no other possible options for value
	
	public SudokuSquare() {
		value = 0;
		isDetermined = false;
	}	
	
	public SudokuSquare(String value) {
		try {
			this.value = Integer.parseInt(value);
			isDetermined = true;
		}
		catch(Exception e) { //this is expected if they sent in a space
		    this.value =0;		    
		}

	}
	
	public SudokuSquare(int val) {
		value = val;
		if (value != 0) {
			isDetermined = true;
		}
	}
	
	public void resetValue() {
		if (!isDetermined) {
			value = 0;
		}
	}
	
	public boolean isSet()
	{
		return value != 0;
	}
	
	public int getValue() {
		return value;
	}

	public void setValue(int value) {
		if (value >= 1 && value <=9 && !isDetermined) {
			this.value = value;
		}			
	}
	
	public boolean isDetermined() {
		return isDetermined;
	}
	
	@Override
	public String toString() {
		String retValue = "" + value; 
		if (value == 0)
			retValue = " "; 
		return retValue; 
	}

	public SudokuSquare Copy() {
		SudokuSquare newSquare = new SudokuSquare();
		newSquare.isDetermined = this.isDetermined;
		newSquare.value = this.value;
		return newSquare;
	}

}
