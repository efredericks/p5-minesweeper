GAME_DATA = {
  // attrs
  BASE: {
    grid_size: 8,
    num_mines: 8,
  },

  EASY: { grid_size: 8, num_mines: 8 },
  MEDIUM: { grid_size: 16, num_mines: 24 },
  HARD: { grid_size: 32, num_mines: 100 },
  EXPERT: { grid_size: 64, num_mines: 300 },
};

// visible state of grid
GRID_STATE = {
  COVERED: 0, // not checked, blank square
  FLAGGED: 1, // flagged as mine
  QUESTION: 2, // unsure
  CLEAR: 3, // opened by user
};

// draw colors
COLORS = {};
COLORS[GRID_STATE.COVERED] = "#aaaaaa";
COLORS[GRID_STATE.QUESTION] = "#aaaaaa";
COLORS[GRID_STATE.FLAGGED] = "#aaaaaa";
COLORS[GRID_STATE.CLEAR] = "#eeeeee";
COLORS.HOVER = "#cccccc";

// cell directions
DIRECTIONS = [
  { c: -1, r: -1 },
  { c: 0, r: -1 },
  { c: 1, r: -1 }, 
  { c: -1, r: 0 },
  { c: 1, r: 0 }, 
  { c: -1, r: 1 },
  { c: 0, r: 1 },
  { c: 1, r: 1 }, 
];
