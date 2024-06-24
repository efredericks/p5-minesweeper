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

// Game state machine
let STATES = {
  PLAYING: 0,
  GAMEOVER: 1,
}

// visible state of grid
GRID_STATE = {
  COVERED: 0, // not checked, blank square
  FLAGGED: 1, // flagged as mine
  QUESTION: 2, // unsure
  CLEAR: 3, // opened by user
  SHOW_BOMB: 4, // gameover state - show bomb
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

// spritesheet lookup
let SPRITES = {
  'covered': { r: 14, c: 39 },
  // 'uncovered': { r: 0, c: 0 },
  'marked': { r: 21, c: 35 },
  'question': { r: 13, c: 37 },
  'bomb': { r: 9, c: 45 },
  'exploded': { r: 0, c: 0 },
  '1': { r: 17, c: 36 },
  '2': { r: 17, c: 37 },
  '3': { r: 17, c: 38 },
  '4': { r: 17, c: 39 },
  '5': { r: 17, c: 40 },
  '6': { r: 17, c: 41 },
  '7': { r: 17, c: 42 },
  '8': { r: 17, c: 43 },
  '9': { r: 17, c: 44 },
  '0': { r: 17, c: 35 }, 
  'cursor': { r: 12, c: 38 },
  'face_smile': { r: 14, c: 35 },
  'face_mad': { r: 14, c: 36},
  'face_happy': { r: 14, c: 37 },
  'face_sad': { r: 14, c: 38 },
}