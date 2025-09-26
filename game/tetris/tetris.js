// 游戏配置 - 常量定义优化
const config = {
    rows: 20, // 行数
    cols: 10, // 列数
    blockSize: 30, // 方块大小
    initialSpeed: 1000, // 初始下落速度(ms)
    speedDecrement: 100, // 每升一级减少的速度(ms)
    minSpeed: 100 // 最小下落速度(ms)
};

// 游戏状态 - 对象结构优化
const gameState = {
    board: [], // 游戏板
    currentPiece: null, // 当前方块
    nextPiece: null, // 下一个方块
    score: 0, // 分数
    lines: 0, // 消除的行数
    level: 1, // 等级
    isPlaying: false, // 是否正在游戏
    isPaused: false, // 是否暂停
    dropSpeed: config.initialSpeed, // 当前下落速度
    lastTime: 0, // 上一次渲染时间
    animationId: null // requestAnimationFrame ID
};

// 方块形状定义 - 使用数组直接访问优化性能
const TETROMINOS = [
    [], // 空
    // I
    [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    // J
    [
        [2, 0, 0],
        [2, 2, 2],
        [0, 0, 0]
    ],
    // L
    [
        [0, 0, 3],
        [3, 3, 3],
        [0, 0, 0]
    ],
    // O
    [
        [4, 4],
        [4, 4]
    ],
    // S
    [
        [0, 5, 5],
        [5, 5, 0],
        [0, 0, 0]
    ],
    // T
    [
        [0, 6, 0],
        [6, 6, 6],
        [0, 0, 0]
    ],
    // Z
    [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0]
    ]
];

// 方块颜色 - 预定义优化访问速度
const COLORS = [
    '#000000', // 背景色
    '#00ffff', // I - 青色
    '#0000ff', // J - 蓝色
    '#ff7f00', // L - 橙色
    '#ffff00', // O - 黄色
    '#00ff00', // S - 绿色
    '#800080', // T - 紫色
    '#ff0000'  // Z - 红色
];

// DOM元素缓存 - 避免重复DOM查询
const gameCanvas = document.getElementById('gameCanvas');
const nextCanvas = document.getElementById('nextCanvas');
const gameCtx = gameCanvas.getContext('2d');
const nextCtx = nextCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const linesElement = document.getElementById('lines');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');

// 游戏板尺寸常量
const BOARD_SIZE = config.rows * config.cols;

// 初始化游戏板 - 使用TypedArray优化内存和性能
function initBoard() {
    // 使用一维数组代替二维数组，提高访问速度
    gameState.board = new Uint8Array(BOARD_SIZE);
}

// 游戏板访问辅助函数 - 优化二维访问
function getBoardValue(x, y) {
    return gameState.board[y * config.cols + x];
}

function setBoardValue(x, y, value) {
    gameState.board[y * config.cols + x] = value;
}

// 生成随机方块 - 优化随机数生成和对象创建
function getRandomPiece() {
    // 直接使用数组索引访问，避免Object.keys的开销
    const pieceType = Math.floor(Math.random() * 7) + 1; // 1-7对应不同形状
    const shape = TETROMINOS[pieceType];
    const width = shape[0].length;
    
    return {
        shape: shape,
        color: pieceType,
        x: Math.floor((config.cols - width) / 2),
        y: 0
    };
}

// 旋转方块 - 优化旋转算法
function rotate(piece) {
    const shape = piece.shape;
    const size = shape.length;
    const rotatedShape = [];
    
    // 预分配数组空间
    for (let i = 0; i < size; i++) {
        rotatedShape[i] = new Array(size);
    }
    
    // 优化的旋转算法
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            rotatedShape[x][size - 1 - y] = shape[y][x];
        }
    }
    
    return rotatedShape;
}

// 检查碰撞 - 优化碰撞检测算法，减少不必要的检查
function checkCollision(piece, offsetX = 0, offsetY = 0) {
    const shape = piece.shape;
    const pieceX = piece.x;
    const pieceY = piece.y;
    const shapeHeight = shape.length;
    
    for (let y = 0; y < shapeHeight; y++) {
        const row = shape[y];
        const boardY = pieceY + y + offsetY;
        
        // 修复：只有当boardY >= config.rows并且当前单元格有方块时才返回碰撞
        // 这允许方块底部部分正确地进入最后一行
        if (boardY >= config.rows) {
            // 检查这一行是否有实际的方块
            let hasBlockInRow = false;
            for (let x = 0; x < row.length; x++) {
                if (row[x] !== 0) {
                    const boardX = pieceX + x + offsetX;
                    if (boardX >= 0 && boardX < config.cols) {
                        hasBlockInRow = true;
                        break;
                    }
                }
            }
            if (hasBlockInRow) return true;
            continue; // 如果这一行没有实际方块，继续检查下一行
        }
        
        if (boardY < 0) continue; // 跳过屏幕上方的检查
        
        for (let x = 0; x < row.length; x++) {
            if (row[x] !== 0) {
                const boardX = pieceX + x + offsetX;
                
                // 检查列边界和已存在的方块
                if (boardX < 0 || boardX >= config.cols || getBoardValue(boardX, boardY) !== 0) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

// 锁定当前方块到游戏板 - 优化锁定算法
function lockPiece() {
    const shape = gameState.currentPiece.shape;
    const pieceX = gameState.currentPiece.x;
    const pieceY = gameState.currentPiece.y;
    const color = gameState.currentPiece.color;
    
    for (let y = 0; y < shape.length; y++) {
        const row = shape[y];
        const boardY = pieceY + y;
        
        // 确保方块底部部分能被正确锁定到游戏板
        for (let x = 0; x < row.length; x++) {
            if (row[x] !== 0) {
                const boardX = pieceX + x;
                // 只在有效范围内设置值，但允许boardY刚好等于最后一行
                if (boardX >= 0 && boardX < config.cols && boardY >= 0 && boardY < config.rows) {
                    setBoardValue(boardX, boardY, color);
                }
            }
        }
    }
}

// 消除完整的行 - 优化消行算法
function clearLines() {
    let linesCleared = 0;
    let writeRow = config.rows - 1;
    
    // 从底部向上扫描
    for (let readRow = config.rows - 1; readRow >= 0; readRow--) {
        let isFullLine = true;
        
        // 检查当前行是否已满
        for (let x = 0; x < config.cols; x++) {
            if (getBoardValue(x, readRow) === 0) {
                isFullLine = false;
                break; // 提前退出循环
            }
        }
        
        if (!isFullLine) {
            // 如果不是满行，复制到写入位置
            if (readRow !== writeRow) {
                for (let x = 0; x < config.cols; x++) {
                    setBoardValue(x, writeRow, getBoardValue(x, readRow));
                }
            }
            writeRow--;
        } else {
            linesCleared++;
        }
    }
    
    // 填充顶部的空行
    while (writeRow >= 0) {
        for (let x = 0; x < config.cols; x++) {
            setBoardValue(x, writeRow, 0);
        }
        writeRow--;
    }
    
    if (linesCleared > 0) {
        // 计算得分 (1行: 100, 2行: 300, 3行: 500, 4行: 800)
        const linePoints = [0, 100, 300, 500, 800];
        gameState.score += linePoints[linesCleared] * gameState.level;
        gameState.lines += linesCleared;
        
        // 更新等级
        const newLevel = Math.floor(gameState.lines / 10) + 1;
        if (newLevel > gameState.level) {
            gameState.level = newLevel;
            gameState.dropSpeed = Math.max(
                config.initialSpeed - (gameState.level - 1) * config.speedDecrement, 
                config.minSpeed
            );
        }
        
        updateScore();
    }
}

// 检查游戏是否结束
function checkGameOver() {
    return checkCollision(gameState.nextPiece);
}

// 生成新方块
function spawnNewPiece() {
    gameState.currentPiece = gameState.nextPiece;
    gameState.nextPiece = getRandomPiece();
    
    if (checkGameOver()) {
        endGame();
    } else {
        drawNextPiece();
    }
}

// 移动方块 - 优化移动逻辑
function movePiece(dirX, dirY) {
    if (!checkCollision(gameState.currentPiece, dirX, dirY)) {
        gameState.currentPiece.x += dirX;
        gameState.currentPiece.y += dirY;
        return true;
    }
    return false;
}

// 旋转方块 - 优化旋转逻辑，减少碰撞检查次数
function rotatePiece() {
    const piece = gameState.currentPiece;
    const originalShape = piece.shape;
    const rotatedShape = rotate(piece);
    
    // 尝试直接旋转
    piece.shape = rotatedShape;
    
    // 如果旋转后碰撞，尝试墙踢
    if (checkCollision(piece)) {
        // 尝试向左移动
        if (!checkCollision(piece, -1, 0)) {
            piece.x--;
        } 
        // 尝试向右移动
        else if (!checkCollision(piece, 1, 0)) {
            piece.x++;
        } 
        // 尝试向下移动
        else if (!checkCollision(piece, 0, 1)) {
            piece.y++;
        } 
        // 无法旋转，恢复原状
        else {
            piece.shape = originalShape;
        }
    }
}

// 硬下落（直接落地） - 优化下落算法
function hardDrop() {
    const piece = gameState.currentPiece;
    let dropDistance = 0;
    
    // 计算可以下落的最大距离 - 确保方块能完全下落到最底部
    while (!checkCollision(piece, 0, dropDistance + 1)) {
        dropDistance++;
    }
    
    // 直接下落到位
    piece.y += dropDistance;
    
    // 硬下落加分
    gameState.score += 2 * dropDistance;
    updateScore();
    
    lockAndCheck();
}

// 锁定方块并检查消除
function lockAndCheck() {
    lockPiece();
    clearLines();
    spawnNewPiece();
}

// 绘制单个方块 - 优化Canvas绘制
function drawCell(x, y, color) {
    const blockSize = config.blockSize;
    const xPos = x * blockSize;
    const yPos = y * blockSize;
    
    // 填充方块
    gameCtx.fillStyle = COLORS[color];
    gameCtx.fillRect(xPos, yPos, blockSize - 1, blockSize - 1);
    
    // 添加边框效果
    gameCtx.strokeStyle = '#ffffff';
    gameCtx.lineWidth = 1;
    gameCtx.strokeRect(xPos, yPos, blockSize - 1, blockSize - 1);
}

// 绘制游戏板 - 优化渲染性能，使用批量绘制
function drawBoard() {
    // 清空画布
    gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // 绘制背景网格
    gameCtx.strokeStyle = '#333333'; // 网格线颜色
    gameCtx.lineWidth = 0.5;
    
    const blockSize = config.blockSize;
    const width = config.cols * blockSize;
    const height = config.rows * blockSize;
    
    // 绘制垂直线
    for (let x = 0; x <= width; x += blockSize) {
        gameCtx.beginPath();
        gameCtx.moveTo(x, 0);
        gameCtx.lineTo(x, height);
        gameCtx.stroke();
    }
    
    // 绘制水平线
    for (let y = 0; y <= height; y += blockSize) {
        gameCtx.beginPath();
        gameCtx.moveTo(0, y);
        gameCtx.lineTo(width, y);
        gameCtx.stroke();
    }
    
    // 批量绘制游戏板上的方块
    for (let y = 0; y < config.rows; y++) {
        for (let x = 0; x < config.cols; x++) {
            const color = getBoardValue(x, y);
            if (color !== 0) { // 只绘制非空方块
                drawCell(x, y, color);
            }
        }
    }
    
    // 绘制当前方块
    if (gameState.currentPiece) {
        const shape = gameState.currentPiece.shape;
        const pieceX = gameState.currentPiece.x;
        const pieceY = gameState.currentPiece.y;
        const color = gameState.currentPiece.color;
        
        for (let y = 0; y < shape.length; y++) {
            const row = shape[y];
            const boardY = pieceY + y;
            
            if (boardY >= 0) { // 只绘制屏幕内的部分
                for (let x = 0; x < row.length; x++) {
                    if (row[x] !== 0) {
                        const boardX = pieceX + x;
                        if (boardX >= 0 && boardX < config.cols) { // 检查水平边界
                            drawCell(boardX, boardY, color);
                        }
                    }
                }
            }
        }
    }
}

// 绘制下一个方块 - 优化绘制性能
function drawNextPiece() {
    // 清空画布
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    if (gameState.nextPiece) {
        const shape = gameState.nextPiece.shape;
        const color = gameState.nextPiece.color;
        const blockSize = config.blockSize;
        const width = shape[0].length * blockSize;
        const height = shape.length * blockSize;
        const centerX = (nextCanvas.width - width) / 2;
        const centerY = (nextCanvas.height - height) / 2;
        
        for (let y = 0; y < shape.length; y++) {
            const row = shape[y];
            for (let x = 0; x < row.length; x++) {
                if (row[x] !== 0) {
                    const xPos = centerX + x * blockSize;
                    const yPos = centerY + y * blockSize;
                    
                    // 填充方块
                    nextCtx.fillStyle = COLORS[color];
                    nextCtx.fillRect(xPos, yPos, blockSize - 1, blockSize - 1);
                    
                    // 添加边框
                    nextCtx.strokeStyle = '#ffffff';
                    nextCtx.lineWidth = 1;
                    nextCtx.strokeRect(xPos, yPos, blockSize - 1, blockSize - 1);
                }
            }
        }
    }
}

// 更新分数显示 - 最小化DOM操作
function updateScore() {
    scoreElement.textContent = gameState.score;
    levelElement.textContent = gameState.level;
    linesElement.textContent = gameState.lines;
}

// 游戏主循环 - 使用requestAnimationFrame优化动画性能
function gameLoop(currentTime) {
    // 初始化lastTime
    if (!gameState.lastTime) {
        gameState.lastTime = currentTime;
    }
    
    // 基于时间的游戏循环，而不是固定间隔
    const deltaTime = currentTime - gameState.lastTime;
    
    if (!gameState.isPaused && deltaTime >= gameState.dropSpeed) {
        gameState.lastTime = currentTime;
        
        if (!movePiece(0, 1)) {
            lockAndCheck();
        }
        
        // 只在必要时绘制
        drawBoard();
    }
    
    // 继续游戏循环
    if (gameState.isPlaying) {
        gameState.animationId = requestAnimationFrame(gameLoop);
    }
}

// 开始游戏
function startGame() {
    // 重置游戏状态
    gameState.score = 0;
    gameState.lines = 0;
    gameState.level = 1;
    gameState.dropSpeed = config.initialSpeed;
    gameState.isPlaying = true;
    gameState.isPaused = false;
    gameState.lastTime = 0;
    
    // 初始化游戏板和方块
    initBoard();
    gameState.nextPiece = getRandomPiece();
    spawnNewPiece();
    
    // 更新UI
    updateScore();
    drawBoard();
    drawNextPiece();
    
    // 更新按钮状态
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    resetBtn.disabled = false;
    
    // 开始游戏循环 - 使用requestAnimationFrame代替setInterval
    gameState.animationId = requestAnimationFrame(gameLoop);
}

// 暂停游戏
function pauseGame() {
    gameState.isPaused = !gameState.isPaused;
    pauseBtn.textContent = gameState.isPaused ? '继续游戏' : '暂停游戏';
    
    // 暂停时重绘一次屏幕
    if (!gameState.isPaused) {
        gameState.lastTime = 0; // 重置时间，避免暂停后的瞬间移动
        drawBoard();
    }
}

// 重置游戏
function resetGame() {
    // 取消动画帧
    if (gameState.animationId) {
        cancelAnimationFrame(gameState.animationId);
        gameState.animationId = null;
    }
    
    // 重置按钮状态
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    resetBtn.disabled = true;
    pauseBtn.textContent = '暂停游戏';
    
    // 重置游戏状态
    gameState.isPlaying = false;
    gameState.isPaused = false;
    
    // 清空游戏板
    initBoard();
    drawBoard();
    drawNextPiece();
}

// 结束游戏
function endGame() {
    // 取消动画帧
    if (gameState.animationId) {
        cancelAnimationFrame(gameState.animationId);
        gameState.animationId = null;
    }
    
    gameState.isPlaying = false;
    
    // 更新按钮状态
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    resetBtn.disabled = false;
    
    alert('游戏结束！你的得分：' + gameState.score + '，消除行数：' + gameState.lines + '，等级：' + gameState.level);
}

// 键盘按键状态缓存 - 防止按键重复触发
const keyState = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowDown: false,
    ArrowUp: false,
    ' ': false
};

// 按键重复触发的时间间隔
const KEY_REPEAT_DELAY = 100;
let lastKeyPressTime = 0;

// 设置事件监听 - 优化事件处理
function setupEventListeners() {
    // 按钮事件
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', pauseGame);
    resetBtn.addEventListener('click', resetGame);
    
    // 键盘按下事件
    document.addEventListener('keydown', (e) => {
        if (!gameState.isPlaying || gameState.isPaused) return;
        
        // 阻止方向键和空格的默认行为（如页面滚动）
        if (keyState.hasOwnProperty(e.key)) {
            e.preventDefault();
            
            // 避免按键重复触发过快
            const currentTime = Date.now();
            if (currentTime - lastKeyPressTime < KEY_REPEAT_DELAY) {
                return;
            }
            
            lastKeyPressTime = currentTime;
            
            switch (e.key) {
                case 'ArrowLeft':
                    if (movePiece(-1, 0)) {
                        drawBoard();
                    }
                    break;
                case 'ArrowRight':
                    if (movePiece(1, 0)) {
                        drawBoard();
                    }
                    break;
                case 'ArrowDown':
                    if (movePiece(0, 1)) {
                        gameState.score += 1; // 下移加分
                        updateScore();
                        drawBoard();
                    }
                    break;
                case 'ArrowUp':
                    rotatePiece();
                    drawBoard();
                    break;
                case ' ':
                    hardDrop();
                    drawBoard();
                    break;
            }
        }
    });
}

// 初始化游戏
function initGame() {
    initBoard();
    setupEventListeners();
    drawBoard();
    drawNextPiece();
}

// 启动游戏
initGame();