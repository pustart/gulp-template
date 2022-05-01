function testWebP(callback) {
    var webP = new Image();
    webP.onload = webP.onerror = function () {
        callback(webP.height === 2);
    };
    webP.src = "data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA";
}

testWebP(function (support) {
    if (support == true) {
        document.querySelector('body').classList.add('webp');
    } else {
        document.querySelector('body').classList.add('no-webp');
    }
});

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const LINES_PER_LEVEL = 10;

const KEY = {
	LEFT: 'ArrowLeft',
	RIGHT: 'ArrowRight',
	DOWN: 'ArrowDown',
	UP: 'ArrowUp',
	SPACE: 'Space',
};
Object.freeze(KEY);

const POINTS = {
	SINGLE: 100,
	DOUBLE: 300,
	TRIPLE: 500,
	TETRIS: 800,
	SOFT_DROP: 1,
	HARD_DROP: 2,
};
Object.freeze(POINTS);

const LEVEL = {
	0: 800,
	1: 720,
	2: 630,
	3: 550,
};
Object.freeze(LEVEL);

const COLORS = [
	'cyan',
	'blue',
	'orange',
	'yellow',
	'green',
	'purple',
	'red',
];

const SHAPES = [
	[[1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
	[[2, 0, 0], [2, 2, 2], [0, 0, 0]],
	[[0, 0, 3], [3, 3, 3], [0, 0, 0]],
	[[4, 4], [4, 4]],
	[[0, 5, 5], [5, 5, 0], [0, 0, 0]],
	[[0, 6, 0], [6, 6, 6], [0, 0, 0]],
	[[7, 7, 0], [0, 7, 7], [0, 0, 0]],
];
class Board {
	constructor(ctx, ctxNext) {
		this.ctx = ctx;
		this.ctxNext = ctxNext;
		this.piece = null;
		this.next = null;
	}

	reset() {
		this.grid = this.getEmptyBoard();
		this.piece = new Piece(this.ctx);
		this.piece.setStartPosition();
		this.getNewPiece();
	}

	getNewPiece() {
		this.next = new Piece(this.ctxNext);
		this.ctxNext.clearRect(
			0,
			0,
			this.ctxNext.canvas.width,
			this.ctxNext.canvas.height
		);
		//this.next.setStartPosition();
		this.next.draw();
	}

	getEmptyBoard() {
		//Create and fill new array with 0
		return Array.from(
			{length: ROWS}, () => Array(COLS).fill(0)
		);
	}

	rotate(piece) {
		let clonePiece = JSON.parse(JSON.stringify(piece));
		//Используем синтаксис деструктуризации массива
		//Транспонируем матрицу
		for (let y = 0; y < piece.shape.length; y++) {
			for (let x = 0; x < y; x++) {
				piece.shape[x][y] = clonePiece.shape[y][x];
				piece.shape[y][x] = clonePiece.shape[x][y];
				/*[piece.shape[x][y], piece.shape[y][x]] =
					[piece.shape[y][x], piece.shape[x][y]];*/
			}
		}

		console.log('transponated: ');
		console.table(piece.shape);

		piece.shape.forEach(row => row.reverse());

		console.log('rotated: ');
		console.table(piece.shape);
		return clonePiece;
	}

	clearLines() {
		let lines = 0;
		this.grid.forEach((row, y) => {
			if (row.every(value => value > 0)) {
				lines++;
				this.grid.slice(y, 1);
				this.grid.unshift(Array(COLS).fill(0));
			}
		});

		if (lines > 0) {
			account.score += this.getLineClearPoints(lines, account.level);
			account.lines += lines;

			if (account.lines >= LINES_PER_LEVEL) {
				account.level++;
				account.lines -= LINES_PER_LEVEL;
				time.level = LEVEL[account.level];
			}
		}
	}

	getLineClearPoints(lines, level) {
		const lineClearPoints = lines === 1 ? POINTS.SINGLE :
			lines === 2 ? POINTS.DOUBLE :
				lines === 3 ? POINTS.TRIPLE :
					lines === 4 ? POINTS.TETRIS :
						0;

		return (level + 1) * lineClearPoints;
	}

	draw() {
		this.piece.draw();
		this.drawBoard();
	}

	drawBoard() {
		this.grid.forEach((row, y) => {
			row.forEach((value, x) => {
				if (value > 0) {
					this.ctx.fillStyle = COLORS[value - 1];
					this.ctx.fillRect(x, y, 1, 1);
				}
			});
		});
	}

	drop() {
		let newPlacement = moves[KEY.DOWN](this.piece);
		if (this.valid(newPlacement)) {
			this.piece.move(newPlacement);
		} else {
			this.freeze();
			this.clearLines();
			console.table(this.grid);

			if (this.piece.y === 0) {
				console.log('Y coord = ' + this.piece.y);
				return false;
			}

			this.piece = this.next;
			this.piece.ctx = this.ctx;
			this.piece.setStartPosition();
			this.getNewPiece();
		}

		return true;
	}

	freeze() {
		this.piece.shape.forEach((row, y) => {
			row.forEach((value, x) => {
				if (value > 0) {
					this.grid[y + this.piece.y][x + this.piece.x] = value;
				}
			});
		});
	}

	valid(newPlacement) {
		return newPlacement.shape.every((row, dy) => {
			return row.every((value, dx) => {
				let x = newPlacement.x + dx;
				let y = newPlacement.y + dy;

				return value === 0 ||
					(this.insideWalls(x) && this.aboveFloor(y) && this.isCellFree(x, y));
			});
		});
	}

	insideWalls(x) {
		return x >= 0 && COLS;
	}

	aboveFloor(y) {
		return y <= ROWS;
	}

	isCellFree(x, y) {
		return this.grid[y] && this.grid[y][x] === 0;
	}
}
class Piece {
	constructor(ctx) {
		this.ctx = ctx;
		this.spawn();
		this.setStartPosition();
	}

	draw() {
		this.ctx.fillStyle = this.color;
		this.shape.forEach((row, y) => {
			row.forEach((value, x) => {
				if (value > 0) {
					// this.x, this.y - левый верхний угол фигурки на игровом поле
					// x, y - координаты ячейки относительно матрицы фигурки (3х3)
					// this.x + x - координаты ячейки на игровом поле
					this.ctx.fillRect(this.x + x, this.y + y, 1, 1);
				}
			});
		});
	}

	move(newPlacement) {
		this.x = newPlacement.x;
		this.y = newPlacement.y;
	}

	spawn() {
		this.typeId = this.randomizeTetraminoChoice(COLORS.length);
		this.shape = SHAPES[this.typeId];
		this.color = COLORS[this.typeId];
		this.x = 0;
		this.y = 0;
	}

	//Howe does it work?
	randomizeTetraminoChoice(numberOfTypes) {
		return Math.floor(Math.random() * numberOfTypes);
	}

	setStartPosition() {
		this.x = this.typeId === 4 ? 4 : 3;
	}
}
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const canvasNext = document.getElementById('next');
const ctxNext = canvasNext.getContext('2d');
const time = {start: 0, elapsed: 0, level: 1000};
const moves = {
	[KEY.LEFT]: piece => ({...piece, x: piece.x - 1}),
	[KEY.RIGHT]: piece => ({...piece, x: piece.x + 1}),
	[KEY.DOWN]: piece => ({...piece, y: piece.y + 1}),
	[KEY.UP]: piece => board.rotate(piece),
	[KEY.SPACE]: piece => ({...piece, y: piece.y + 1}),
};

ctx.canvas.width = COLS * BLOCK_SIZE;
ctx.canvas.height = ROWS * BLOCK_SIZE;
ctx.scale(BLOCK_SIZE, BLOCK_SIZE);

ctxNext.canvas.width = 4 * BLOCK_SIZE;
ctxNext.canvas.height = 4 * BLOCK_SIZE;
ctxNext.scale(BLOCK_SIZE, BLOCK_SIZE);

let board = new Board(ctx, ctxNext);
let accountValues = {
	score: 0,
	lines: 0,
	level: 0,
};
let requestId;

function play() {
	resetGame();
	animate();
	//piece.draw();
	//Logging our current board in console
	console.table(board.grid);
}

function resetGame() {
	account.score = 0;
	account.lines = 0;
	account.level = 0;
	board.reset();
	//board.piece = new Piece(ctx);
	//board.piece.setStartPosition();
}

function gameOver() {
	cancelAnimationFrame(requestId);
	ctx.fillStyle = 'black';
	ctx.fillRect(1, 3, 8, 1.2);
	ctx.font = '1px Arial';
	ctx.fillStyle = 'red';
	ctx.fillText('GAME OVER', 1.8, 4);
}

function animate(now = 0) {
	//refresh elapsed time
	time.elapsed = now - time.start;
	//Если отображение текущего фрейма прошло
	if (time.elapsed > time.level) {
		//Начинаем отсчет с начала
		time.start = now;
		//Роняем активную фигурку
		if (!board.drop()) {
			gameOver();
			return;
		}
	}

	clearCanvas();
	//Отрисовываем поле
	board.draw();
	//requestAnimationFrame(animate);
	requestId = requestAnimationFrame(animate);
}

function updateAccount(key, value) {
	let element = document.getElementById(key);
	if (element) {
		element.textContent = value;
	}
}

let account = new Proxy(accountValues, {
	set: (target, key, value) => {
		target[key] = value;
		updateAccount(key, value);
		return true;
	}
});

window.addEventListener('keydown', function (event) {
	console.log('key code: ' + event.code);

	if (moves[event.code]) {
		console.log('into first if');
		// отмена действий по умолчанию
		event.preventDefault();

		let placement = moves[event.code](board.piece);
		//console.table(placement.shape);

		if (event.code === KEY.SPACE) {
			while (board.valid(placement)) {
				account.score += POINTS.HARD_DROP;
				board.piece.move(placement);
				clearCanvas();
				board.piece.draw();
				placement = moves[KEY.DOWN](board.piece);
			}
		} else if (board.valid(placement)) {
			console.log('into else block');

			if (event.code === KEY.DOWN) {
				account.score += POINTS.SOFT_DROP;
			}

			board.piece.move(placement);
			//console.log('board piece: ');
			//console.table(board.piece.shape);

			clearCanvas();
			board.piece.draw();
		}
	}
});

function clearCanvas() {
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiIiwic291cmNlcyI6WyJzY3JpcHQuanMiXSwic291cmNlc0NvbnRlbnQiOlsiQEBpbmNsdWRlKCdzdXBwb3J0V2VicC5qcycpXHJcbkBAaW5jbHVkZSgnY29uc3RhbnRzLmpzJylcclxuQEBpbmNsdWRlKCdib2FyZC5qcycpXHJcbkBAaW5jbHVkZSgncGllY2UuanMnKVxyXG5AQGluY2x1ZGUoJ21haW4uanMnKVxyXG4iXSwiZmlsZSI6InNjcmlwdC5qcyJ9
