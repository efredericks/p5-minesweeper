// author: erik fredericks, 2024
// minesweeper implemented in p5js
// based on https://www.askpython.com/python/examples/create-minesweeper-using-python
// assets: 
//     * kenney.nl 1-bit pack --> https://kenney.nl/assets/1-bit-pack
//     * kenney.nl explosion pack --> https://kenney.itch.io/kenney-game-assets

// QUESTION MARKED AND THEN CLEARED DOESN'T CLEAR MARK!

// feedback on touch (highlight?)

let cell_w, half_cell, smaller_cell_w, larger_cell_w;
let current_difficulty;
let grid;
let ui_w = 120;
let ui_padding = 20;
let dirty;
let cells; // iterable list for drawing
let hovering;
let num_marked;
// let bg_img;

let mine_cells;

let game_state;

let bgcol, activecol;
let GAMEOVER_DELAY = 100;
let GAMEOVER_TIMER;

let icon_size;
let half_icon;
let quarter_icon;

let ui_buttons;


let explosions;
let spritesheet;
function preload() {
  explosions = [];
  for (let i = 0; i < 9; i++) {
    explosions[i] = loadImage(`./assets/PixelExplosion/pixelExplosion0${i}.png`);
  }

  spritesheet = loadImage("./assets/colored-transparent_packed.png");
}
function setup() {
  let canvas = createCanvas(600 + ui_w + 2 * ui_padding, 600 + 2 * ui_padding);
  drawingContext.imageSmoothingEnabled = false; // make sprites look nice scaled up

  noiseDetail(random(4, 8), random(0.25, 0.85));

  bgcol = color(71, 45, 60);
  activecol = color(207, 198, 184);

  // difficultyRadio = createRadio();
  // difficultyRadio.position(0, 0);
  // // difficultyRadio.size(ui_w);

  // difficultyRadio.option("easy");
  // difficultyRadio.option("medium");
  // difficultyRadio.option("hard");
  // // difficultyRadio.option("expert");
  // difficultyRadio.selected("easy");

  // difficultyRadio.mousePressed(updateDifficulty);
  updateDifficulty("EASY");

  textSize(24);
  textAlign(CENTER, CENTER);

  imageMode(CENTER);

  canvas.touchStarted(touchStart);
  canvas.touchEnded(touchEnd);

  setupGame();

  // preload a random tiled image and set as tiled bg
  // let body = select('body');
  // let bg_cells = 16;
  // bg_img = createImage(16 * bg_cells, 16 * bg_cells);
  // let bg_y = 0;
  // let bg_x = 0;
  // for (let r = 0; r < bg_cells; r++) {
  //   for (let c = 0; c < bg_cells; c++) {
  //     let n = noise(c * 0.1, r * 0.1);
  //     let bg_cell = 'bg_open';
  //     if (n < 0.2) bg_cell = 'bg_open';
  //     else if (n < 0.3) bg_cell = 'bg_dirt1';
  //     else if (n < 0.4) bg_cell = 'bg_grass1';
  //     else if (n < 0.5) bg_cell = 'bg_dirt2';
  //     else if (n < 0.6) bg_cell = 'bg_grass2';
  //     else if (n < 0.7) bg_cell = 'bg_rocks1';
  //     else if (n < 0.8) bg_cell = 'bg_grass3';
  //     else if (n < 0.9) bg_cell = 'bg_rocks2';

  //     let sx = SPRITES[bg_cell].c * 16;
  //     let sy = SPRITES[bg_cell].r * 16;
  //     bg_img.copy(spritesheet, sx, sy, 16, 16, bg_x, bg_y, 16, 16);//, sx, sy, 16, 16);

  //     bg_x += 16;
  //   }
  //   bg_x = 0;
  //   bg_y += 16;
  // }
}

let touchTimer;
let touchValue;
function touchStart() {
  touchTimer = 0;
  touchValue = {};
}

function touchEnd() {
  if (touchTimer > 5) touchValue = { x: touches[0].x, y: touches[0].y, type: RIGHT };
  else {
    touchValue = { x: touches[0].x, y: touches[0].y, type: LEFT };
    handleGenericPress(touchValue.x, touchValue.y, CENTER); // allow a left click to also try and clear
  }

  handleGenericPress(touchValue.x, touchValue.y, touchValue.type);
}

function draw() {
  dirty = true;
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

    if (game_state == STATES.GAME_LOST) {
      let remaining_to_explode = 0;
      for (let mc of mine_cells) {
        if (mc.explode_anim_frame == -2) remaining_to_explode++;
        else {
          if (mc.explode_anim_frame == -1 && random() > 0.90) { // kick off explosion cycle
            mc.explode_anim_frame = 0;
          } else {
            if (mc.explode_anim_frame >= 0) {
              image(explosions[mc.explode_anim_frame], mc.x + half_cell, mc.y + half_cell, cell_w, cell_w);
              if (frameCount % 2 == 0)
                mc.explode_anim_frame++;

              if (mc.explode_anim_frame == explosions.length - 1) mc.explode_anim_frame = -2;
            }
          }
        }
      }
      if (GAMEOVER_TIMER == 0 && remaining_to_explode == GAME_DATA[current_difficulty].num_mines) // all done
        setupGame();
    } else {
      if (GAMEOVER_TIMER == 0) // all done
        setupGame();
    }
    // if (GAMEOVER_TIMER == 0 && remaining_to_explode == GAME_DATA[current_difficulty].num_mines) // all done
  }

  if (touchTimer > -1) touchTimer++;
  drawMouse();
}

function updateDifficulty(diff) {
  current_difficulty = diff.toUpperCase();
  setupGame();
}

function drawMouse() {
  drawSprite(mouseX + half_cell / 2, mouseY + half_cell / 2, smaller_cell_w, smaller_cell_w, 'mouse');
}

function drawGame() {
  strokeWeight(1);
  if (current_difficulty == "EASY" || current_difficulty == "MEDIUM") textSize(24);
  else textSize(12);
  for (let c of cells) {
    if (c.state != GRID_STATE.CLEAR) {
      drawSprite(c.x + half_cell, c.y + half_cell, cell_w, cell_w, 'covered');
    }

    if (c.state == GRID_STATE.CLEAR) {
      if (c.value != 0) {
        drawSprite(c.x + half_cell, c.y + half_cell, cell_w, cell_w, c.value.toString());
      } else {
        noStroke();
        fill(bgcol);
        rect(c.x, c.y, cell_w, cell_w);

      }
    } else if (c.state == GRID_STATE.QUESTION) {
      drawSprite(c.x + half_cell, c.y + half_cell, smaller_cell_w, smaller_cell_w, 'question');
    } else if (c.state == GRID_STATE.FLAGGED) {
      drawSprite(c.x + half_cell, c.y + half_cell, smaller_cell_w, smaller_cell_w, 'marked');
    } else if (c.state == GRID_STATE.SHOW_BOMB) {
      drawSprite(c.x + half_cell, c.y + half_cell, smaller_cell_w, smaller_cell_w, 'bomb');
    }
  }

  stroke(activecol);
  line(width - ui_w, 20, width - ui_w, height - 20);
  noStroke();

  for (let ui_b of ui_buttons) {
    if (ui_b.main_icon) { // main icon - special handling
      let spr;
      if (game_state == STATES.GAME_LOST) {
        spr = 'face_mad';
      } else if (game_state == STATES.GAME_WON) {
        spr = 'face_happy';
      } else { // playing
        spr = 'face_smile';
      }
      drawSprite(ui_b.x, ui_b.y, ui_b.w, ui_b.h, spr);
    } else {
      image(ui_b.gfx, ui_b.x + ui_b.w / 2, ui_b.y + ui_b.h / 2);
    }
  }


  // total mines
  let num_mines_str = GAME_DATA[current_difficulty].num_mines.toString();

  tx = width - ui_w * 0.80;
  ty = icon_size + icon_size * 0.85;
  drawSprite(tx, ty, half_icon, half_icon, 'bomb');
  ty += quarter_icon;
  drawSprite(tx, ty + quarter_icon, half_icon, half_icon, 'marked');

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

  // hover over cells
  if (hovering !== null) {
    drawSprite(hovering.x + half_cell, hovering.y + half_cell, hovering.w, hovering.w, 'cursor');
  }
}

// reset all
function setupGame() {
  game_state = STATES.PLAYING;

  setupIcons();

  touchTimer = -1;
  touchValue = {};

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
        explode_anim_frame: -1,
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
  // cell click
  if (cells !== undefined) {
    for (let c of cells) {
      if (x > c.x && x < c.x + cell_w && y > c.y && y < c.y + cell_w) return c;
    }
  }

  return null;
}

function handleGenericPress(x, y, type) {
  if (game_state == STATES.PLAYING) {
    hovering = null;
    let clicked_cell = checkPress(x, y);
    if (clicked_cell != null) {
      if (type == RIGHT && clicked_cell.state != GRID_STATE.CLEAR) {
        // go between options
        if (clicked_cell.state == GRID_STATE.COVERED) {
          clicked_cell.state = GRID_STATE.FLAGGED;
          num_marked++;

          checkGame();
        } else if (clicked_cell.state == GRID_STATE.FLAGGED) {
          clicked_cell.state = GRID_STATE.QUESTION;
          num_marked--;

        } else clicked_cell.state = GRID_STATE.COVERED;
      } else if (type == CENTER || (type == LEFT && keyIsPressed && key == "Shift")) {
        let visited = [];
        let retval = checkNeighborsValued(clicked_cell, visited);

        if (retval != null) {
          for (let c of retval) {
            let visited = [];
            checkNeighbors(c, visited);
          }
        }
      } else {
        // only allow left click/press when cell isn't marked in any way
        // mostly to avoid touch event accidental game over
        if (clicked_cell.state == GRID_STATE.COVERED) {
          clicked_cell.state = GRID_STATE.CLEAR;

          // visit all neighboring cells to clear them
          if (clicked_cell.value == 0) {
            let visited = [];
            checkNeighbors(clicked_cell, visited);
          }
          // mine clicked
          else if (clicked_cell.value == -1) {
            // alert("GAME OVER");
            gameOver(false);
            // setupGame();
          }
        }
      }
      dirty = true;
    } else { // cell not clicked - check UI
      for (let ui_b of ui_buttons) {
        // probably have a bug somewhere in the click handlers, but icon is registering different than buttons
        if (
          (ui_b.main_icon && x > ui_b.x - half_cell && x < ui_b.x - half_cell + ui_b.w && y > ui_b.y - half_cell && y < ui_b.y - half_cell + ui_b.h) ||
          (!ui_b.main_icon && x > ui_b.x && x < ui_b.x + ui_b.w && y > ui_b.y && y < ui_b.y + ui_b.h)) {
          ui_b.callback.cb(ui_b.callback.arg);
        }
      }
    }
  }
}

function mousePressed() {
  handleGenericPress(mouseX, mouseY, mouseButton);
}

// gameover state
function gameOver(won) {
  if (won) {
    game_state = STATES.GAME_WON;
    GAMEOVER_TIMER = GAMEOVER_DELAY;
  } else {
    game_state = STATES.GAME_LOST;
    GAMEOVER_TIMER = GAMEOVER_DELAY;

    for (let mc of mine_cells) {
      mc.state = GRID_STATE.SHOW_BOMB;
    }
  }
  dirty = true;
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
  let checked_cnt = 0;
  for (let c of cells) {
    if (c.value == -1 && c.state == GRID_STATE.FLAGGED) cnt++;
    if (c.state == GRID_STATE.FLAGGED) checked_cnt++;
  }
  if (cnt == GAME_DATA[current_difficulty].num_mines && cnt == checked_cnt) {
    gameOver(true);
  }
}

function mouseMoved() {
  hovering = null;
  let clicked_cell = checkPress(mouseX, mouseY);
  if (clicked_cell != null) {
    hovering = clicked_cell;
    hovering.w = larger_cell_w;
    dirty = true;
  }

  let sx = width - ui_w / 2;
  if (mouseX > sx - half_cell && mouseX < sx - half_cell + icon_size && mouseY > icon_size - half_cell && mouseY < icon_size * 2 - half_cell) {
    hovering = { x: sx - half_cell, y: icon_size - half_cell, w: icon_size * 1.25 };
  }
}

// function windowResized() {
//   resizeCanvas(windowWidth, windowHeight);
//   dirty = true;
// }


function setupIcons() {
  ui_buttons = [];

  // icon
  icon_size = ui_w * 0.75;
  half_icon = icon_size / 2;
  quarter_icon = icon_size / 4;

  ui_buttons.push({
    x: width - ui_w / 2,
    y: icon_size,
    w: icon_size,
    h: icon_size,
    main_icon: true,
    callback: { cb: gameOver, arg: false },
  })

  // difficulty buttons
  let box_w = ui_w - 2 * ui_padding;
  let box_h = 48;
  let box_x = width - ui_w + ui_padding;
  let box_y = height - ui_padding - box_h;

  // hard
  let ui_button_gfx_h = createGraphics(box_w, box_h);
  ui_button_gfx_h.textAlign(CENTER, CENTER);
  ui_button_gfx_h.textSize(18);

  ui_button_gfx_h.stroke(color(activecol));
  ui_button_gfx_h.noFill();
  ui_button_gfx_h.rect(0, 0, box_w, box_h);
  ui_button_gfx_h.fill(color(activecol));
  ui_button_gfx_h.text("hard", box_w / 2, box_h / 2);

  ui_buttons.push({
    x: box_x,
    y: box_y,
    w: box_w,
    h: box_h,
    main_icon: false,
    gfx: ui_button_gfx_h,
    callback: { cb: updateDifficulty, arg: "hard" },
  })

  // medium
  box_y -= ui_padding / 2 + box_h;
  let ui_button_gfx_m = createGraphics(box_w, box_h);
  ui_button_gfx_m.textAlign(CENTER, CENTER);
  ui_button_gfx_m.textSize(18);

  ui_button_gfx_m.stroke(color(activecol));
  ui_button_gfx_m.noFill();
  ui_button_gfx_m.rect(0, 0, box_w, box_h);
  ui_button_gfx_m.fill(color(activecol));
  ui_button_gfx_m.text("medium", box_w / 2, box_h / 2);

  ui_buttons.push({
    x: box_x,
    y: box_y,
    w: box_w,
    h: box_h,
    main_icon: false,
    gfx: ui_button_gfx_m,
    callback: { cb: updateDifficulty, arg: "medium" },
  })

  // easy
  box_y -= ui_padding / 2 + box_h;
  let ui_button_gfx_e = createGraphics(box_w, box_h);
  ui_button_gfx_e.textAlign(CENTER, CENTER);
  ui_button_gfx_e.textSize(18);

  ui_button_gfx_e.stroke(color(activecol));
  ui_button_gfx_e.noFill();
  ui_button_gfx_e.rect(0, 0, box_w, box_h);
  ui_button_gfx_e.fill(color(activecol));
  ui_button_gfx_e.text("easy", box_w / 2, box_h / 2);

  ui_buttons.push({
    x: box_x,
    y: box_y,
    w: box_w,
    h: box_h,
    main_icon: false,
    gfx: ui_button_gfx_e,
    callback: { cb: updateDifficulty, arg: "easy" },
  })
}

function drawSprite(x, y, w, h, spr) {
  let sx = SPRITES[spr].c * 16;
  let sy = SPRITES[spr].r * 16;
  image(spritesheet, x, y, w, h, sx, sy, 16, 16);
}