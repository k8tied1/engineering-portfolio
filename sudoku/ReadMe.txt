This will prompt the user fora file name. SampleBoard is provided, but the user can use ANY sodoku board in the correct format.

The file must have one row per line with columns separated by a | . Blanks should be a space.

For instance: 
 | |3|9| |6| | |7
 | |7| |3| |6|1|9
6| | | | | | | | 
7| |5|3| | |4|6|1
4| | | |6|9|7|2| 
3| | |1| | |5|9| 
2| |6| |9| | | |4
5|1| | |4| | | |2
9|3| |2|5|1|8| |6

Changing debug to true in the SudokuSolver file will print loads of debug output to see how the program is figuring it out.

The program uses recursion to solve the problem. It starts with the first left square and takes a guess. Then it moves across
column by column and row by row to taking a guess. When the program hits a wall, it backtracks one guess and tries again 
incrementing the guess by 1.