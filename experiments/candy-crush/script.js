const gameBoard = document.getElementById('game-board');
const scoreDisplay = document.getElementById('score');
const width = 8;
const candies = [];
let score = 0;

const candyColors = [
    'red', 'blue', 'green', 'yellow', 'purple'
];

function createBoard() {
    for (let i = 0; i < width * width; i++) {
        const candy = document.createElement('div');
        candy.classList.add('candy');
        candy.setAttribute('draggable', true);
        candy.setAttribute('id', i);
        let randomColor = Math.floor(Math.random() * candyColors.length);
        candy.classList.add(candyColors[randomColor]);
        candies.push(candy);
        gameBoard.appendChild(candy);
    }
}

createBoard();

let colorBeingDragged;
let colorBeingReplaced;
let squareIdBeingDragged;
let squareIdBeingReplaced;

candies.forEach(candy => candy.addEventListener('dragstart', dragStart));
candies.forEach(candy => candy.addEventListener('dragend', dragEnd));
candies.forEach(candy => candy.addEventListener('dragover', dragOver));
candies.forEach(candy => candy.addEventListener('dragenter', dragEnter));
candies.forEach(candy => candy.addEventListener('dragleave', dragLeave));
candies.forEach(candy => candy.addEventListener('drop', dragDrop));

function dragStart() {
    colorBeingDragged = this.classList[1];
    squareIdBeingDragged = parseInt(this.id);
}

function dragOver(e) {
    e.preventDefault();
}

function dragEnter(e) {
    e.preventDefault();
}

function dragLeave() {
    this.classList.remove('highlight');
}

function dragDrop() {
    colorBeingReplaced = this.classList[1];
    squareIdBeingReplaced = parseInt(this.id);

    candies[squareIdBeingDragged].classList.remove(colorBeingDragged);
    candies[squareIdBeingReplaced].classList.remove(colorBeingReplaced);

    candies[squareIdBeingDragged].classList.add(colorBeingReplaced);
    candies[squareIdBeingReplaced].classList.add(colorBeingDragged);
}

function dragEnd() {
    const validMoves = [
        squareIdBeingDragged - 1, // left
        squareIdBeingDragged - width, // up
        squareIdBeingDragged + 1, // right
        squareIdBeingDragged + width // down
    ];

    const validMove = validMoves.includes(squareIdBeingReplaced);

    if (squareIdBeingReplaced && validMove) {
        squareIdBeingReplaced = null;
    } else if (squareIdBeingReplaced && !validMove) {
        // If not a valid move, swap back
        candies[squareIdBeingDragged].classList.add(colorBeingDragged);
        candies[squareIdBeingReplaced].classList.add(colorBeingReplaced);
        candies[squareIdBeingDragged].classList.remove(colorBeingReplaced);
        candies[squareIdBeingReplaced].classList.remove(colorBeingDragged);
    } else {
        candies[squareIdBeingDragged].classList.add(colorBeingDragged);
    }
}

// Check for matches
function checkRowForThree() {
    for (let i = 0; i < 64; i++) {
        let rowOfThree = [i, i + 1, i + 2];
        let decidedColor = candies[i].classList[1];
        const isBlank = candies[i].classList.contains('blank');

        const notValid = [6, 7, 14, 15, 22, 23, 30, 31, 38, 39, 46, 47, 54, 55, 62, 63];
        if (notValid.includes(i)) continue;

        if (rowOfThree.every(index => candies[index].classList[1] === decidedColor && !isBlank)) {
            score += 3;
            scoreDisplay.innerHTML = score;
            rowOfThree.forEach(index => candies[index].classList.add('blank'));
        }
    }
}

function checkColumnForThree() {
    for (let i = 0; i < 47; i++) {
        let columnOfThree = [i, i + width, i + width * 2];
        let decidedColor = candies[i].classList[1];
        const isBlank = candies[i].classList.contains('blank');

        if (columnOfThree.every(index => candies[index].classList[1] === decidedColor && !isBlank)) {
            score += 3;
            scoreDisplay.innerHTML = score;
            columnOfThree.forEach(index => candies[index].classList.add('blank'));
        }
    }
}

// Drop candies after match
function moveIntoSquareBelow() {
    for (let i = 0; i < 56; i++) {
        if (candies[i + width].classList.contains('blank')) {
            candies[i + width].classList.remove('blank');
            candies[i + width].classList.add(candies[i].classList[1]);
            candies[i].classList.remove(candies[i].classList[1]);
            candies[i].classList.add('blank');
        }
    }
}

// Generate new candies for top row
function fillBlanks() {
    for (let i = 0; i < width; i++) {
        if (candies[i].classList.contains('blank')) {
            let randomColor = Math.floor(Math.random() * candyColors.length);
            candies[i].classList.remove('blank');
            candies[i].classList.add(candyColors[randomColor]);
        }
    }
}

window.setInterval(function() {
    checkRowForThree();
    checkColumnForThree();
    moveIntoSquareBelow();
    fillBlanks();
}, 100);
