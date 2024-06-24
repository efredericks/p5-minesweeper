// based on https://www.askpython.com/python/examples/create-minesweeper-using-python

// MARKED AND THEN CLEARED DOESN'T CLEAR MARK!
// MARKING ALL AS MINES CAUSES YOU TO WIN

let cell_w, half_cell, smaller_cell_w, larger_cell_w;
let current_difficulty;
let grid;
let ui_w = 120;
let ui_padding = 20;
let dirty;
let cells; // iterable list for drawing
let hovering;
let num_marked;

let mine_cells;

let game_state;

let bgcol, activecol;
let GAMEOVER_DELAY = 100;
let GAMEOVER_TIMER;



// let explosions;
let spritesheet;
function preload() {
  // explosions = [];
  // for (let i = 0; i < 9; i++) {
  // explosions[i] = loadImage(`./assets/PixelExplosion/pixelExplosion0${i}.png`);
  // }

  spritesheet = loadImage("./assets/colored-transparent_packed.png");
}
function setup() {
  createCanvas(600 + ui_w + 2 * ui_padding, 600 + 2 * ui_padding);
  drawingContext.imageSmoothingEnabled = false; // make sprites look nice scaled up

  bgcol = color(71, 45, 60);
  activecol = color(207, 198, 184);

  difficultyRadio = createRadio();
  difficultyRadio.position(0, 0);
  // difficultyRadio.size(ui_w);

  difficultyRadio.option("easy");
  difficultyRadio.option("medium");
  difficultyRadio.option("hard");
  // difficultyRadio.option("expert");
  difficultyRadio.selected("easy");

  // difficultyRadio.mousePressed(updateDifficulty);
  updateDifficulty();

  textSize(24);
  textAlign(CENTER, CENTER);

  imageMode(CENTER);

  setupGame();
}

function draw() {
  if (dirty && game_state == STATES.PLAYING) {
    background(bgcol);
    drawGame();

    dirty = false;
  } else if (game_state == STATES.GAME_WON || game_state == STATES.GAME_LOST) { // animate explosions and then reset
    background(bgcol);

    if (game_state == STATES.GAME_LOST)
      fill(color(255, 0, 0, 20));
    else
      fill(color(0, 255, 0, 20));
    noStroke();
    rect(0, 0, width, height);
    drawGame();
    GAMEOVER_TIMER--;

    // let remaining_to_explode = 0;
    // for (let mc of mine_cells) {
    //   if (mc.explode_anim_frame == -2) remaining_to_explode++;
    //   else {
    //     if (mc.explode_anim_frame == -1 && random() > 0.90) { // kick off explosion cycle
    //       mc.explode_anim_frame = 0;
    //     } else {
    //       if (mc.explode_anim_frame >= 0) {
    //         image(explosions[mc.explode_anim_frame], mc.x, mc.y, cell_w, cell_w);
    //         if (frameCount % 2 == 0)
    //           mc.explode_anim_frame++;

    //         if (mc.explode_anim_frame == explosions.length - 1) mc.explode_anim_frame = -2;
    //       }
    //     }
    //   }
    // }

    // if (remaining_to_explode == GAME_DATA[current_difficulty].num_mines) // all done
    if (GAMEOVER_TIMER == 0)
      setupGame();
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
    // stroke(color(0));//20, 20, 20, 100));
    // fill(bgcol);//color(COLORS[c.state]));
    // rect(c.x, c.y, cell_w, cell_w);
    if (c.state != GRID_STATE.CLEAR) {
      let sx = SPRITES.covered.c * 16;
      let sy = SPRITES.covered.r * 16;
      image(spritesheet, c.x + half_cell, c.y + half_cell, cell_w, cell_w, sx, sy, 16, 16);
    }

    if (c.state == GRID_STATE.CLEAR) {
      // noStroke();
      // fill(0);
      if (c.value != 0) {
        let sx = SPRITES[c.value].c * 16;
        let sy = SPRITES[c.value].r * 16;
        image(spritesheet, c.x + half_cell, c.y + half_cell, smaller_cell_w, smaller_cell_w, sx, sy, 16, 16);
        // text(c.value, c.x + half_cell, c.y + half_cell);
      } else {
        noStroke();
        fill(bgcol);//color(COLORS[c.state]));
        rect(c.x, c.y, cell_w, cell_w);

      }
    } else if (c.state == GRID_STATE.QUESTION) {
      // noStroke();
      // fill(color(255, 255, 0));
      // text("?", c.x + half_cell, c.y + half_cell);
      let sx = SPRITES.question.c * 16;
      let sy = SPRITES.question.r * 16;
      image(spritesheet, c.x + half_cell, c.y + half_cell, smaller_cell_w, smaller_cell_w, sx, sy, 16, 16);
    } else if (c.state == GRID_STATE.FLAGGED) {
      // noStroke();
      let sx = SPRITES.marked.c * 16;
      let sy = SPRITES.marked.r * 16;
      image(spritesheet, c.x + half_cell, c.y + half_cell, smaller_cell_w, smaller_cell_w, sx, sy, 16, 16);
      // fill(color(255, 0, 0));
      // text("!", c.x + half_cell, c.y + half_cell);
    } else if (c.state == GRID_STATE.SHOW_BOMB) {
      let sx = SPRITES.bomb.c * 16;
      let sy = SPRITES.bomb.r * 16;
      image(spritesheet, c.x + half_cell, c.y + half_cell, smaller_cell_w, smaller_cell_w, sx, sy, 16, 16);
    }
  }

  // textAlign(RIGHT, CENTER);
  stroke(activecol);
  line(width - ui_w, 20, width - ui_w, height - 20);
  noStroke();

  // icon
  let icon_size = ui_w * 0.75;
  let half_icon = icon_size / 2;
  let quarter_icon = icon_size / 4;

  if (game_state == STATES.GAME_LOST) {
    let sx = SPRITES.face_mad.c * 16;
    let sy = SPRITES.face_mad.r * 16;
    image(spritesheet, width - ui_w / 2, icon_size, icon_size, icon_size, sx, sy, 16, 16);
  } else if (game_state == STATES.GAME_WON) {
    let sx = SPRITES.face_happy.c * 16;
    let sy = SPRITES.face_happy.r * 16;
    image(spritesheet, width - ui_w / 2, icon_size, icon_size, icon_size, sx, sy, 16, 16);

  } else { // playing
    let sx = SPRITES.face_smile.c * 16;
    let sy = SPRITES.face_smile.r * 16;
    image(spritesheet, width - ui_w / 2, icon_size, icon_size, icon_size, sx, sy, 16, 16);
  }

  // total mines
  let num_mines_str = GAME_DATA[current_difficulty].num_mines.toString();
  // let tx, ty;
  // if (num_mines_str.length == 1) {
  //   tx = width - ui_w / 2;
  //   ty = icon_size * 1.95;

  //   let sx = SPRITES[num_mines_str].c * 16;
  //   let sy = SPRITES[num_mines_str].r * 16;
  //   image(spritesheet, tx, ty, half_icon, half_icon, sx, sy, 16, 16);
  // } else if (num_mines_str.length == 2) {
  //   tx = width - ui_w / 2 - icon_size / 6;
  //   ty = icon_size * 1.95;

  //   let sx = SPRITES[num_mines_str[0]].c * 16;
  //   let sy = SPRITES[num_mines_str[0]].r * 16;
  //   image(spritesheet, tx, ty, half_icon, half_icon, sx, sy, 16, 16);

  //   tx = width - ui_w / 2 + icon_size / 6;
  //   // ty = icon_size * 1.75;

  //   sx = SPRITES[num_mines_str[1]].c * 16;
  //   sy = SPRITES[num_mines_str[1]].r * 16;
  //   image(spritesheet, tx, ty, half_icon, half_icon, sx, sy, 16, 16);

  // } else if (num_mines_str.length == 3) {
  //   tx = width - ui_w / 2;
  //   ty = icon_size * 1.95;

  //   let sx = SPRITES[num_mines_str[1]].c * 16;
  //   let sy = SPRITES[num_mines_str[1]].r * 16;
  //   image(spritesheet, tx, ty, half_icon, half_icon, sx, sy, 16, 16);

  //   tx -= quarter_icon

  //   sx = SPRITES[num_mines_str[0]].c * 16;
  //   sy = SPRITES[num_mines_str[0]].r * 16;
  //   image(spritesheet, tx, ty, half_icon, half_icon, sx, sy, 16, 16);

  //   tx += half_icon;

  //   sx = SPRITES[num_mines_str[2]].c * 16;
  //   sy = SPRITES[num_mines_str[2]].r * 16;
  //   image(spritesheet, tx, ty, half_icon, half_icon, sx, sy, 16, 16);

  // } else {
  //   alert("ERROR: NOT HANDLED");
  // }

  tx = width - ui_w * 0.80;
  ty = icon_size + icon_size * 0.85;
  sx = SPRITES.bomb.c * 16;
  sy = SPRITES.bomb.r * 16;
  image(spritesheet, tx, ty, half_icon, half_icon, sx, sy, 16, 16);

  sx = SPRITES.marked.c * 16;
  sy = SPRITES.marked.r * 16;
  image(spritesheet, tx, ty + half_icon, half_icon, half_icon, sx, sy, 16, 16);

  ty += quarter_icon;

  fill(activecol);
  textSize(48);
  text(
    `${GAME_DATA[current_difficulty].num_mines}`,
    width - ui_w / 2,
    ty
  );
  ty += 48;
  text(
    `${num_marked}`,
    width - ui_w / 2,
    ty
  );

  if (hovering !== null) {
    let sx = SPRITES.cursor.c * 16;
    let sy = SPRITES.cursor.r * 16;
    image(spritesheet, hovering.x + half_cell, hovering.y + half_cell, larger_cell_w, larger_cell_w, sx, sy, 16, 16);
    // stroke(color(255, 0, 255));
    // strokeWeight(3);
    // noFill();
    // rect(hovering.x, hovering.y, cell_w, cell_w);
  }
}

function setupGame() {
  game_state = STATES.PLAYING;

  cell_w =
    (width - ui_w - 2 * ui_padding) / GAME_DATA[current_difficulty].grid_size;
  half_cell = cell_w / 2;

  smaller_cell_w = cell_w - (cell_w * 0.25);
  larger_cell_w = cell_w + (cell_w * 0.25);

  dirty = true;
  hovering = null;
  cells = [];
  mine_cells = [];
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
        // explode_anim_frame: -1,
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
      mine_cells.push(c); // easy access to mines
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
  if (game_state == STATES.PLAYING) {
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
          // alert("GAME OVER");
          game_state = STATES.GAME_LOST;
          GAMEOVER_TIMER = GAMEOVER_DELAY;

          for (let mc of mine_cells) {
            mc.state = GRID_STATE.SHOW_BOMB;
          }
          dirty = true;
          // setupGame();
        }
      }
      dirty = true;
    }
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
    game_state = STATES.GAME_WON;
    GAMEOVER_TIMER = GAMEOVER_DELAY;
    dirty = true;
    // alert("YOU WIN");

    // setupGame();
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
