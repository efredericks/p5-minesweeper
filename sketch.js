// based on https://www.askpython.com/python/examples/create-minesweeper-using-python
let cell_w, half_cell;
let current_difficulty;
let grid;
let ui_w = 120;
let ui_padding = 20;
let dirty;
let cells; // iterable list for drawing
let hovering;
let num_marked;

function setup() {
  createCanvas(600 + ui_w + 2 * ui_padding, 600 + 2 * ui_padding);

  difficultyRadio = createRadio();
  difficultyRadio.position(0, 0);
  // difficultyRadio.size(ui_w);

  difficultyRadio.option("easy");
  difficultyRadio.option("medium");
  difficultyRadio.option("hard");
  difficultyRadio.option("expert");
  difficultyRadio.selected("easy");

  // difficultyRadio.mousePressed(updateDifficulty);
  updateDifficulty();

  textSize(24);
  textAlign(CENTER, CENTER);

  setupGame();
}

function draw() {
  if (dirty) {
    background(220);
    drawGame();

    dirty = false;
  }
  
  // run in the loop to check if the radio button was updated
  // for some reason it has to be clicked twice to update when using mousePressed
  updateDifficulty();
}

function updateDifficulty() {
  if (current_difficulty != difficultyRadio.value().toUpperCase()) {
    current_difficulty = difficultyRadio.value().toUpperCase();
    setupGame();
  }
}
function drawGame() {
  // textAlign(CENTER, CENTER);
  strokeWeight(1);
  if (current_difficulty == "EASY" || current_difficulty == "MEDIUM") textSize(24);
  else textSize(12);
  for (let c of cells) {
    stroke(color(20,20,20,100));
    fill(color(COLORS[c.state]));
    rect(c.x, c.y, cell_w, cell_w);

    if (c.state == GRID_STATE.CLEAR) {
      noStroke();
      fill(0);
      if (c.value != 0) text(c.value, c.x + half_cell, c.y + half_cell);
    } else if (c.state == GRID_STATE.QUESTION) {
      noStroke();
      fill(color(255,255,0));
      text("?", c.x + half_cell, c.y + half_cell);
    } else if (c.state == GRID_STATE.FLAGGED) {
      noStroke();
      fill(color(255,0,0));
      text("!", c.x + half_cell, c.y + half_cell);
    }
  }

  // textAlign(RIGHT, CENTER);
  stroke(20);
  line(width - ui_w, 20, width - ui_w, height - 20);
  noStroke();
  fill(20);
  textSize(24);
  text(
    `Mines: ${GAME_DATA[current_difficulty].num_mines}`,
    width - ui_w / 2,
    30
  );
  text(
    `Marked: ${num_marked}`,
    width - ui_w / 2,
    54
  );

  if (hovering !== null) {
    stroke(color(255, 0, 255));
    strokeWeight(3);
    noFill();
    rect(hovering.x, hovering.y, cell_w, cell_w);
  }
}

function setupGame() {
  cell_w =
    (width - ui_w - 2 * ui_padding) / GAME_DATA[current_difficulty].grid_size;
  half_cell = cell_w / 2;

  dirty = true;
  hovering = null;
  cells = [];
  grid = [];
  num_marked = 0;
  
  let x = ui_padding;
  let y = ui_padding;

  for (let r = 0; r < GAME_DATA[current_difficulty].grid_size; r++) {
    grid[r] = [];
    for (let c = 0; c < GAME_DATA[current_difficulty].grid_size; c++) {
      grid[r][c] = {
        state: GRID_STATE.COVERED,
        value: 0,
        x: x,
        y: y,
        r: r,
        c: c,
      };
      cells.push(grid[r][c]);
      x += cell_w;
    }
    y += cell_w;
    x = ui_padding;
  }

  // randomly place mines
  let remaining = GAME_DATA[current_difficulty].num_mines;
  while (remaining > 0) {
    let c = random(cells);
    if (c.value != -1) {
      c.value = -1;
      remaining--;
    }
  }

  // set cell values
  for (let r = 0; r < GAME_DATA[current_difficulty].grid_size; r++) {
    for (let c = 0; c < GAME_DATA[current_difficulty].grid_size; c++) {
      if (grid[r][c].value == -1) continue; // is a mine, skip

      let val = 0;
      for (let d of DIRECTIONS) {
        let next_cell = { c: c + d.c, r: r + d.r };
        if (
          next_cell.c >= 0 &&
          next_cell.c <= GAME_DATA[current_difficulty].grid_size - 1 &&
          next_cell.r >= 0 &&
          next_cell.r <= GAME_DATA[current_difficulty].grid_size - 1
        ) {
          if (grid[next_cell.r][next_cell.c].value == -1) val++;
        }
      }
      grid[r][c].value = val;
    }
  }
}

// cell of pressed location
function checkPress(x, y) {
  if (cells !== undefined) {
    for (let c of cells) {
      if (x > c.x && x < c.x + cell_w && y > c.y && y < c.y + cell_w) return c;
    }
  }

  return null;
}

function mousePressed() {
  hovering = null;
  let clicked_cell = checkPress(mouseX, mouseY);
  if (clicked_cell != null) {
    if (mouseButton == RIGHT && clicked_cell.state != GRID_STATE.CLEAR) {
      // go between options
      if (clicked_cell.state == GRID_STATE.COVERED) {
        clicked_cell.state = GRID_STATE.FLAGGED;
        num_marked++;

        checkGame();
      } else if (clicked_cell.state == GRID_STATE.FLAGGED) {
        clicked_cell.state = GRID_STATE.QUESTION;
        num_marked--;
        
      } else clicked_cell.state = GRID_STATE.COVERED;
    } else if (mouseButton == CENTER) {
      let visited = [];
      let retval = checkNeighborsValued(clicked_cell, visited);

      if (retval != null) {
        for (let c of retval) {
          let visited = [];
          checkNeighbors(c, visited);
        }
      }
    } else {
      clicked_cell.state = GRID_STATE.CLEAR;

      // visit all neighboring cells to clear them
      if (clicked_cell.value == 0) {
        let visited = [];
        checkNeighbors(clicked_cell, visited);
      }
      // mine clicked
      else if (clicked_cell.value == -1) {
        alert("GAME OVER");
        setupGame();
      }
    }
    dirty = true;
  }
}

// recursively visit neighbors
function checkNeighbors(cell, visited_cells) {
  if (visited_cells.indexOf(cell) < 0) {
    visited_cells.push(cell);

    if (cell.value == 0) {
      cell.state = GRID_STATE.CLEAR;
      for (let d of DIRECTIONS) {
        let next_cell = { c: cell.c + d.c, r: cell.r + d.r };
        if (
          next_cell.c >= 0 &&
          next_cell.c <= GAME_DATA[current_difficulty].grid_size - 1 &&
          next_cell.r >= 0 &&
          next_cell.r <= GAME_DATA[current_difficulty].grid_size - 1
        ) {
          grid[next_cell.r][next_cell.c].state = GRID_STATE.CLEAR;

          checkNeighbors(grid[next_cell.r][next_cell.c], visited_cells);
        }
      }
    }
  }
}

// recursively visit neighbors to see if there are cells to be cleared
function checkNeighborsValued(cell, visited_cells) {
  if (visited_cells.indexOf(cell) < 0) {
    visited_cells.push(cell);

    // recurse over empty cells
    if (cell.value == 0) {
      let vc = [];
      checkNeighbors(cell, vc);
    } else if (cell.value > 0) {
      // check marked cells to make sure they were flagged correctly
      let cells_to_open = [];
      let cnt = 0;
      let valid = true;

      for (let d of DIRECTIONS) {
        let next_cell = { c: cell.c + d.c, r: cell.r + d.r };
        if (
          next_cell.c >= 0 &&
          next_cell.c <= GAME_DATA[current_difficulty].grid_size - 1 &&
          next_cell.r >= 0 &&
          next_cell.r <= GAME_DATA[current_difficulty].grid_size - 1
        ) {
          if (grid[next_cell.r][next_cell.c].state == GRID_STATE.FLAGGED) cnt++;
          else cells_to_open.push(grid[next_cell.r][next_cell.c]);

          if (
            grid[next_cell.r][next_cell.c].state == GRID_STATE.FLAGGED &&
            grid[next_cell.r][next_cell.c].value != -1
          ) {
            valid = false;
            break;
          }
        }
      }
      // correctly identified - open all relevant

      let ret_empty = [];
      if (cnt == cell.value && valid) {
        for (let c of cells_to_open) {
          c.state = GRID_STATE.CLEAR;

          if (c.value == 0) {
            ret_empty.push(c);
          }
        }
      }
      return ret_empty;
    }
  }
  return null;
  // return visited_cells;
}

// check win condition
function checkGame() {
  let cnt = 0;
  for (let c of cells) {
    if (c.value == -1 && c.state == GRID_STATE.FLAGGED) cnt++;
  }
  if (cnt == GAME_DATA[current_difficulty].num_mines) {
    alert("YOU WIN");
    setupGame();
  }
}

function mouseMoved() {
  hovering = null;
  let clicked_cell = checkPress(mouseX, mouseY);
  if (clicked_cell != null) {
    hovering = clicked_cell;
    dirty = true;
  }
}

// function windowResized() {
//   resizeCanvas(windowWidth, windowHeight);
//   dirty = true;
// }
