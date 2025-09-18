const gameBoard = document.getElementById('game-board');
const scoreDisplay = document.getElementById('score');
const width = 8;
const candies = [];
let score = 0;

const candyColors = [
    'red', 'blue', 'green', 'yellow', 'purple'
];

// Utility helpers to robustly manage candy colors
const COLOR_CLASSES = ['blank', ...candyColors];
const COLOR_EMOJI = {
    red: '🍎',
    blue: '🫐',
    green: '🍏',
    yellow: '🍋',
    purple: '🍇'
};

// Animation constants
const TILE_PX = 50;
const GAP_PX = 2;
const STEP_PX = TILE_PX + GAP_PX; // grid gap is 2px
const ANIM_MS = 120;
const SWIPE_THRESHOLD_PX = 18; // minimal movement to consider a swipe on touch
let isAnimating = false;
let isResolving = false;
let pendingClear = new Set();

function getColor(el) {
    for (const c of candyColors) {
        if (el.classList.contains(c)) return c;
    }
    return el.classList.contains('blank') ? 'blank' : null;
}


function handleTouchStart(e) {
    if (isAnimating || isResolving) return;
    if (!e.touches || e.touches.length === 0) return;
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchHandled = false;
    touchStartId = parseInt(this.id);
    selectedSquareId = touchStartId;
    this.classList.add('selected');
}

function handleTouchMove(e) {
    if (isAnimating || isResolving) return;
    if (touchHandled) return;
    if (!e.touches || e.touches.length === 0) return;
    e.preventDefault();
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    if (adx < SWIPE_THRESHOLD_PX && ady < SWIPE_THRESHOLD_PX) return;

    let targetId = null;
    const r = Math.floor(touchStartId / width);
    const c = touchStartId % width;
    if (adx > ady) {
        // Horizontal swipe
        if (dx > 0 && c < width - 1) targetId = touchStartId + 1; // right
        else if (dx < 0 && c > 0) targetId = touchStartId - 1; // left
    } else {
        // Vertical swipe
        if (dy > 0 && r < width - 1) targetId = touchStartId + width; // down
        else if (dy < 0 && r > 0) targetId = touchStartId - width; // up
    }
    if (targetId !== null) {
        attemptSwap(touchStartId, targetId);
        touchHandled = true;
        if (selectedSquareId !== null && selectedSquareId !== undefined) {
            candies[selectedSquareId].classList.remove('selected');
        }
        selectedSquareId = null;
    }
}

function handleTouchEnd(e) {
    if (selectedSquareId !== null && selectedSquareId !== undefined) {
        candies[selectedSquareId].classList.remove('selected');
    }
    selectedSquareId = null;
    touchStartId = null;
}

function hasFloatingCandies() {
    for (let i = 0; i < 56; i++) {
        const color = getColor(candies[i]);
        if (color && color !== 'blank' && getColor(candies[i + width]) === 'blank') {
            return true;
        }
    }
    return false;
}

function setColor(el, color) {
    // Remove any previous color/blank class, keep 'candy'
    COLOR_CLASSES.forEach(c => el.classList.remove(c));
    if (!color) {
        el.textContent = '';
        return;
    }
    if (color === 'blank') {
        el.classList.add('blank');
        el.textContent = '';
        return;
    }
    // Normal candy color
    el.classList.add(color);
    el.textContent = COLOR_EMOJI[color] || '';
}

function swapColors(i, j) {
    const c1 = getColor(candies[i]);
    const c2 = getColor(candies[j]);
    setColor(candies[i], c2);
    setColor(candies[j], c1);
}

function isAdjacent(a, b) {
    if (b === null || b === undefined) return false;
    const ar = Math.floor(a / width), ac = a % width;
    const br = Math.floor(b / width), bc = b % width;
    return Math.abs(ar - br) + Math.abs(ac - bc) === 1;
}

function hasMatchAt(idx) {
    const color = getColor(candies[idx]);
    if (!color || color === 'blank') return false;
    const r = Math.floor(idx / width), c = idx % width;
    // Horizontal check through idx
    let count = 1;
    let cc = c - 1;
    while (cc >= 0 && getColor(candies[r * width + cc]) === color) { count++; cc--; }
    cc = c + 1;
    while (cc < width && getColor(candies[r * width + cc]) === color) { count++; cc++; }
    if (count >= 3) return true;
    // Vertical check through idx
    count = 1;
    let rr = r - 1;
    while (rr >= 0 && getColor(candies[rr * width + c]) === color) { count++; rr--; }
    rr = r + 1;
    while (rr < width && getColor(candies[rr * width + c]) === color) { count++; rr++; }
    return count >= 3;
}

// Transparent drag image to hide default ghost (especially on Firefox)
let __transparentDragImage = null;
function getTransparentDragImage() {
    if (!__transparentDragImage) {
        const canvas = document.createElement('canvas');
        canvas.width = 1; canvas.height = 1;
        __transparentDragImage = new Image();
        __transparentDragImage.src = canvas.toDataURL();
    }
    return __transparentDragImage;
}
function createBoard() {
    for (let i = 0; i < width * width; i++) {
        const candy = document.createElement('div');
        candy.classList.add('candy');
        candy.setAttribute('draggable', true);
        candy.setAttribute('id', i);
        let randomColor = Math.floor(Math.random() * candyColors.length);
        setColor(candy, candyColors[randomColor]);
        candies.push(candy);
        gameBoard.appendChild(candy);
    }
}

createBoard();

let colorBeingDragged;
let colorBeingReplaced;
let squareIdBeingDragged;
let squareIdBeingReplaced;
let selectedSquareId = null;
let touchStartId = null;
let touchStartX = 0;
let touchStartY = 0;
let touchHandled = false;

candies.forEach(candy => candy.addEventListener('dragstart', dragStart));
candies.forEach(candy => candy.addEventListener('dragend', dragEnd));
candies.forEach(candy => candy.addEventListener('dragover', dragOver));
candies.forEach(candy => candy.addEventListener('dragenter', dragEnter));
candies.forEach(candy => candy.addEventListener('dragleave', dragLeave));
candies.forEach(candy => candy.addEventListener('drop', dragDrop));
// Click-to-swap support
candies.forEach(candy => candy.addEventListener('click', handleClick));
// Touch-to-drag (mobile) support
candies.forEach(candy => candy.addEventListener('touchstart', handleTouchStart, { passive: false }));
candies.forEach(candy => candy.addEventListener('touchmove', handleTouchMove, { passive: false }));
candies.forEach(candy => candy.addEventListener('touchend', handleTouchEnd, { passive: false }));

function dragStart(e) {
    colorBeingDragged = getColor(this);
    squareIdBeingDragged = parseInt(this.id);
    this.classList.add('dragging');
    // Required by Firefox to initiate drag, and hide the default drag ghost
    if (e && e.dataTransfer) {
        e.dataTransfer.setData('text/plain', colorBeingDragged || '');
        try { e.dataTransfer.setDragImage(getTransparentDragImage(), 0, 0); } catch (_) {}
    }
}

function dragOver(e) {
    e.preventDefault();
}

function dragEnter(e) {
    e.preventDefault();
    this.classList.add('highlight');
}

function dragLeave() {
    this.classList.remove('highlight');
}

function dragDrop(e) {
    if (e) e.preventDefault();
    colorBeingReplaced = getColor(this);
    squareIdBeingReplaced = parseInt(this.id);
    // Do not swap here; dragEnd will validate and perform the swap
}

function dragEnd() {
    this.classList.remove('dragging');
    if (squareIdBeingReplaced !== null && squareIdBeingReplaced !== undefined) {
        candies[squareIdBeingReplaced].classList.remove('highlight');
    }
    attemptSwap(squareIdBeingDragged, squareIdBeingReplaced);
    squareIdBeingReplaced = null;
}

function attemptSwap(a, b) {
    if (a === null || a === undefined || b === null || b === undefined) return false;
    if (!isAdjacent(a, b)) return false;

    // Prevent overlapping animations
    if (isAnimating || isResolving) return false;

    // Determine if swap would create a match without committing visible colors yet
    const cA = getColor(candies[a]);
    const cB = getColor(candies[b]);
    // Temporarily swap for logic check
    setColor(candies[a], cB);
    setColor(candies[b], cA);
    const ok = hasMatchAt(a) || hasMatchAt(b);
    // Revert immediately (visuals unchanged due to quick revert)
    setColor(candies[a], cA);
    setColor(candies[b], cB);

    const ar = Math.floor(a / width), ac = a % width;
    const br = Math.floor(b / width), bc = b % width;
    const dx = (bc - ac) * STEP_PX;
    const dy = (br - ar) * STEP_PX;

    const elA = candies[a];
    const elB = candies[b];
    isAnimating = true;

    // Animate forward movement
    elA.style.transform = `translate(${dx}px, ${dy}px)`;
    elB.style.transform = `translate(${-dx}px, ${-dy}px)`;

    setTimeout(() => {
        if (ok) {
            // Commit swap colors
            swapColors(a, b);
            // Reset transforms instantly (no transition)
            const prevTA = elA.style.transition;
            const prevTB = elB.style.transition;
            elA.style.transition = 'none';
            elB.style.transition = 'none';
            elA.style.transform = 'none';
            elB.style.transform = 'none';
            // Force reflow
            void elA.offsetWidth; void elB.offsetWidth;
            // Restore transition
            elA.style.transition = prevTA || '';
            elB.style.transition = prevTB || '';
            isAnimating = false;
        } else {
            // Animate back to original position
            elA.style.transform = 'none';
            elB.style.transform = 'none';
            setTimeout(() => {
                isAnimating = false;
            }, ANIM_MS);
        }
    }, ANIM_MS);
    return ok;
}

function clearSelection() {
    if (selectedSquareId !== null && selectedSquareId !== undefined) {
        candies[selectedSquareId].classList.remove('selected');
    }
    selectedSquareId = null;
}

function handleClick(e) {
    const id = parseInt(this.id);
    if (selectedSquareId === null || selectedSquareId === undefined) {
        selectedSquareId = id;
        this.classList.add('selected');
        return;
    }
    // If clicking the same square, deselect
    if (selectedSquareId === id) {
        clearSelection();
        return;
    }
    // Try swap
    const did = attemptSwap(selectedSquareId, id);
    clearSelection();
    if (!did) {
        // Optionally provide a brief visual feedback
        // e.g., flash the selection or shake - skipped for simplicity
    }
}

// Check for matches
function checkRowForThree() {
    for (let i = 0; i < 64; i++) {
        const col = i % width; if (col > width - 3) continue;
        const decidedColor = getColor(candies[i]);
        if (!decidedColor || decidedColor === 'blank') continue;
        const rowOfThree = [i, i + 1, i + 2];
        if (rowOfThree.every(index => getColor(candies[index]) === decidedColor)) {
            score += 3;
            scoreDisplay.innerHTML = score;
            rowOfThree.forEach(index => { pendingClear.add(index); candies[index].classList.add('combo'); });
        }
    }
}

function checkRowForFour() {
    for (let i = 0; i < 64; i++) {
        const col = i % width; if (col > width - 4) continue;
        const decidedColor = getColor(candies[i]);
        if (!decidedColor || decidedColor === 'blank') continue;
        const rowOfFour = [i, i + 1, i + 2, i + 3];
        if (rowOfFour.every(index => getColor(candies[index]) === decidedColor)) {
            score += 4;
            scoreDisplay.innerHTML = score;
            rowOfFour.forEach(index => { pendingClear.add(index); candies[index].classList.add('combo'); });
        }
    }
}

function checkRowForFive() {
    for (let i = 0; i < 64; i++) {
        const col = i % width; if (col > width - 5) continue;
        const decidedColor = getColor(candies[i]);
        if (!decidedColor || decidedColor === 'blank') continue;
        const rowOfFive = [i, i + 1, i + 2, i + 3, i + 4];
        if (rowOfFive.every(index => getColor(candies[index]) === decidedColor)) {
            score += 5;
            scoreDisplay.innerHTML = score;
            rowOfFive.forEach(index => { pendingClear.add(index); candies[index].classList.add('combo'); });
        }
    }
}

function checkColumnForThree() {
    for (let i = 0; i <= 47; i++) {
        const decidedColor = getColor(candies[i]);
        if (!decidedColor || decidedColor === 'blank') continue;
        const columnOfThree = [i, i + width, i + width * 2];
        if (columnOfThree.every(index => getColor(candies[index]) === decidedColor)) {
            score += 3;
            scoreDisplay.innerHTML = score;
            columnOfThree.forEach(index => { pendingClear.add(index); candies[index].classList.add('combo'); });
        }
    }
}

function checkColumnForFour() {
    for (let i = 0; i <= 39; i++) {
        const decidedColor = getColor(candies[i]);
        if (!decidedColor || decidedColor === 'blank') continue;
        const columnOfFour = [i, i + width, i + width * 2, i + width * 3];
        if (columnOfFour.every(index => getColor(candies[index]) === decidedColor)) {
            score += 4;
            scoreDisplay.innerHTML = score;
            columnOfFour.forEach(index => { pendingClear.add(index); candies[index].classList.add('combo'); });
        }
    }
}

function checkColumnForFive() {
    for (let i = 0; i <= 31; i++) {
        const decidedColor = getColor(candies[i]);
        if (!decidedColor || decidedColor === 'blank') continue;
        const columnOfFive = [i, i + width, i + width * 2, i + width * 3, i + width * 4];
        if (columnOfFive.every(index => getColor(candies[index]) === decidedColor)) {
            score += 5;
            scoreDisplay.innerHTML = score;
            columnOfFive.forEach(index => { pendingClear.add(index); candies[index].classList.add('combo'); });
        }
    }
}

// Animated drop (one step per call)
function animateMoveIntoSquareBelow() {
    if (isAnimating) return;
    let moves = 0;
    for (let i = 0; i < 56; i++) {
        const below = i + width;
        const color = getColor(candies[i]);
        if (color && color !== 'blank' && getColor(candies[below]) === 'blank') {
            moves++;
            const el = candies[i];
            // Animate down
            el.style.transform = `translate(0, ${STEP_PX}px)`;
            setTimeout(() => {
                // Commit the move
                setColor(candies[below], color);
                setColor(candies[i], 'blank');
                // Reset transform instantly
                const prevT = el.style.transition;
                el.style.transition = 'none';
                el.style.transform = 'none';
                void el.offsetWidth;
                el.style.transition = prevT || '';
            }, ANIM_MS);
        }
    }
    if (moves > 0) {
        isAnimating = true;
        setTimeout(() => { isAnimating = false; }, ANIM_MS + 5);
    }
}

// Generate new candies for top row
function fillBlanks() {
    for (let i = 0; i < width; i++) {
        if (getColor(candies[i]) === 'blank') {
            const randomColor = Math.floor(Math.random() * candyColors.length);
            setColor(candies[i], candyColors[randomColor]);
        }
    }
}

// Debug helpers to quickly test board states
function setBoardFromColors(colors) {
    if (!Array.isArray(colors) || colors.length !== width * width) return;
    for (let i = 0; i < colors.length; i++) {
        const color = colors[i];
        if (color === 'blank' || candyColors.includes(color)) {
            setColor(candies[i], color);
        }
    }
}

function printBoard() {
    const rows = [];
    for (let r = 0; r < width; r++) {
        const row = [];
        for (let c = 0; c < width; c++) {
            row.push(getColor(candies[r * width + c]) || '-');
        }
        rows.push(row.join(' '));
    }
    // eslint-disable-next-line no-console
    console.log(rows.join('\n'));
}

// Expose for console usage
window.debugSetBoard = setBoardFromColors;
window.debugPrintBoard = printBoard;

// Controls: reset and shuffle
function resetBoard() {
    score = 0;
    scoreDisplay.innerHTML = score;
    for (let i = 0; i < candies.length; i++) {
        const randomColor = Math.floor(Math.random() * candyColors.length);
        setColor(candies[i], candyColors[randomColor]);
    }
}

function shuffleBoard() {
    for (let i = 0; i < candies.length; i++) {
        const randomColor = Math.floor(Math.random() * candyColors.length);
        setColor(candies[i], candyColors[randomColor]);
    }
}

const btnReset = document.getElementById('btn-reset');
if (btnReset) btnReset.addEventListener('click', resetBoard);
const btnShuffle = document.getElementById('btn-shuffle');
if (btnShuffle) btnShuffle.addEventListener('click', shuffleBoard);

window.setInterval(function() {
    if (isAnimating || isResolving) return;

    // If there are floating candies, keep falling until settled before evaluating matches
    if (hasFloatingCandies()) {
        animateMoveIntoSquareBelow();
        if (!isAnimating) fillBlanks();
        return;
    }

    // Prioritize larger matches first
    checkRowForFive();
    checkColumnForFive();
    checkRowForFour();
    checkColumnForFour();
    checkRowForThree();
    checkColumnForThree();

    if (pendingClear.size > 0) {
        isResolving = true;
        // Briefly highlight combos before clearing
        setTimeout(() => {
            pendingClear.forEach(idx => {
                setColor(candies[idx], 'blank');
                candies[idx].classList.remove('combo');
            });
            pendingClear.clear();
            isResolving = false;
        }, 200);
        return;
    }

    // Nothing to clear and board is settled; ensure top is refilled
    animateMoveIntoSquareBelow();
    if (!isAnimating) fillBlanks();
}, 120);
