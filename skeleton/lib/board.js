var Piece = require("./piece");
var colors = require('colors');

/**
 * Returns a 2D array (8 by 8) with two black pieces at [3, 4] and [4, 3]
 * and two white pieces at [3, 3] and [4, 4]
 */
function _makeGrid () {
  var grid = [];
  for (var i = 0; i < 8; i++) {
    grid.push([]);
    for (var j = 0; j < 8; j++) {
      grid[i][j] = undefined;
    }
  }
  grid[3][4] = new Piece("black");
  grid[4][3] = new Piece("black");
  grid[3][3] = new Piece("white");
  grid[4][4] = new Piece("white");
  return grid;
}

/**
 * Constructs a Board with a starting grid set up.
 */
function Board () {
  this.grid = _makeGrid();
}

Board.DIRS = [
  [ 0,  1], [ 1,  1], [ 1,  0],
  [ 1, -1], [ 0, -1], [-1, -1],
  [-1,  0], [-1,  1]
];

/**
 * Returns the piece at a given [x, y] position,
 * throwing an Error if the position is invalid.
 */
Board.prototype.getPiece = function (pos) {
  var x = pos[0];
  var y = pos[1];
  if (this.isValidPos(pos)) {
    return this.grid[x][y];
  } else {
    throw new Error("out of bounds");
  }
};

/**
 * Checks if there are any valid moves for the given color.
 */
Board.prototype.hasMove = function (color) {
  return this.validMoves(color).length > 0;
};



Board.prototype.eachSlot = function (cl) {
  for (var x = 0; x < 8; x++) {
    for (var y = 0; y < 8; y++) {
      cl(this.grid[x][y]);
    }
  }
  return this;
};

Board.prototype.eachPos = function (cl) {
  for (var x = 0; x < 8; x++) {
    for (var y = 0; y < 8; y++) {
      cl([x, y]);
    }
  }
  return this;
};



/**
 * Checks if every position on the Board is occupied.
 */
Board.prototype.isFull = function () {
  var isFull = true;
  this.eachSlot(function(slot) {
    if (slot === undefined) {
      isFull = false;
    }
  });
  return isFull;
};

/**
 * Checks if the piece at a given position
 * matches a given color.
 */
Board.prototype.isMine = function (pos, color) {
  var piece = this.getPiece(pos);
  if (piece === undefined) {
    return false;
  }
  return this.getPiece(pos).color === color;
};

/**
 * Checks if a given position has a piece on it.
 */
Board.prototype.isOccupied = function (pos) {
  return this.getPiece(pos) !== undefined;
};

/**
 * Checks if both the white player and
 * the black player are out of moves.
 */
Board.prototype.isOver = function () {
  return !(this.hasMove('white') || this.hasMove('black'));
};

/**
 * Checks if a given position is on the Board.
 */
Board.prototype.isValidPos = function (pos) {
  var x = pos[0];
  var y = pos[1];
  return (x < 8 && x >= 0 && y >= 0 && y < 8);
};

/**
 * Recursively follows a direction away from a starting position, adding each
 * piece of the opposite color until hitting another piece of the current color.
 * It then returns an array of all pieces between the starting position and
 * ending position.
 *
 * Returns null if it reaches the end of the board before finding another piece
 * of the same color.
 *
 * Returns null if it hits an empty position.
 *
 * Returns null if no pieces of the opposite color are found.
 */
function _positionsToFlip (board, pos, color, dir, piecesToFlip) {
  var nextPos = [pos[0] + dir[0], pos[1] + dir[1]];
  if (!board.isValidPos(pos)) {
    return null;
  }
  if (!board.isValidPos(nextPos)) {
    return null;
  }
  var nextSlot = board.getPiece(nextPos);
  if (nextSlot === undefined) {
    return null;
  }
  if (nextSlot.color === color && piecesToFlip.length === 0){
    return null;
  }
  if (nextSlot.color === color) {
    return piecesToFlip;
  }
  if (nextSlot.color !== color) {
    piecesToFlip.push(nextSlot);
    return _positionsToFlip(board, nextPos, color, dir, piecesToFlip);
  }
}

/**
 * Adds a new piece of the given color to the given position, flipping the
 * color of any pieces that are eligible for flipping.
 *
 * Throws an error if the position represents an invalid move.
 */
Board.prototype.placePiece = function (pos, color) {
  if (!this.validMove(pos, color)) {
    throw new Error("Can't place piece there");
  }
  var x = pos[0];
  var y = pos[1];
  this.grid[x][y] = new Piece(color);
  var board = this;
  Board.DIRS.forEach(function(dir){
    var pieces = _positionsToFlip(board, pos, color, dir, []);
    if (pieces) {
      pieces.forEach(function(piece){
        piece.flip();
      });
    }
  });
};

/**
 * Prints a string representation of the Board to the console.
 */
Board.prototype.print = function () {
  var display = '   0 1 2 3 4 5 6 7\n';
  for (var x = 0; x < 8; x++) {
    var rowstr = '';
    for (var y = 0; y < 8; y++) {
      var slot = this.getPiece([x,y]);
      var tile = '';
      if ( slot ) {
        tile = slot.toString() + ' ';
      } else {
        tile = '  ';
      }
      if( (x + y) % 2 === 0) {
        tile = tile.bgBlue;
      } else {
        tile = tile.bgCyan;
      }
      rowstr += tile;
    }
    display += x + ' ' + rowstr.bgMagenta + "\n";
  }
  console.log(display);
};

/**
 * Checks that a position is not already occupied and that the color
 * taking the position will result in some pieces of the opposite
 * color being flipped.
 */

Board.prototype.validMove = function (pos, color) {
  if ( !this.isValidPos(pos) || this.getPiece(pos) !== undefined ) {
    return false;
  }
  var valid = false;
  var board = this;
  Board.DIRS.forEach(function(dir){
    if (_positionsToFlip(board, pos, color, dir, [])) {
      valid = true;
    }
  });
  return valid;
};

/**
 * Produces an array of all valid positions on
 * the Board for a given color.
 */
Board.prototype.validMoves = function (color) {
  var moves = [];
  var board = this;
  this.eachPos(function(pos){
    if ( board.validMove(pos, color) ) {
      moves.push(pos);
    }
  });
  return moves;
};

module.exports = Board;
