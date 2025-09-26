// 贪吃蛇游戏核心代码

// 游戏配置
const config = {
    rows: 20,          // 行数
    cols: 20,          // 列数
    blockSize: 15,     // 方块大小
    initialSpeed: 150, // 初始速度(ms)
    speedIncrement: 5  // 每吃到一次食物增加的速度(ms)
};

// 游戏状态
const gameState = {
    snake: [],         // 蛇的身体部分
    direction: 'right',// 当前移动方向
    nextDirection: 'right', // 下一个移动方向
    food: null,        // 食物位置
    score: 0,          // 分数
    isPlaying: false,  // 是否正在游戏
    isPaused: false,   // 是否暂停
    gameSpeed: config.initialSpeed, // 当前游戏速度
    animationId: null, // requestAnimationFrame ID
    lastFrameTime: 0   // 上一帧的时间
};

// 颜色定义
const COLORS = {
    background: '#1a1a1a',
    snakeHead: '#4CAF50',
    snakeBody: '#8BC34A',
    food: '#F44336',
    grid: '#333333'
};

// DOM元素缓存
const snakeCanvas = document.getElementById('snakeCanvas');
const ctx = snakeCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const lengthElement = document.getElementById('length');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');

// 初始化游戏
function initGame() {
    // 设置画布尺寸
    snakeCanvas.width = config.cols * config.blockSize;
    snakeCanvas.height = config.rows * config.blockSize;
    
    // 初始化蛇
    initSnake();
    
    // 生成食物
    generateFood();
    
    // 绘制初始界面
    drawGame();
    
    // 设置事件监听
    setupEventListeners();
}

// 初始化蛇
function initSnake() {
    // 从中间位置开始
    const centerX = Math.floor(config.cols / 2);
    const centerY = Math.floor(config.rows / 2);
    
    // 初始化蛇的身体（3个方块）
    gameState.snake = [
        { x: centerX, y: centerY },
        { x: centerX - 1, y: centerY },
        { x: centerX - 2, y: centerY }
    ];
    
    // 重置方向
    gameState.direction = 'right';
    gameState.nextDirection = 'right';
}

// 生成食物
function generateFood() {
    let x, y;
    let isOnSnake;
    
    // 确保食物不会出现在蛇身上
    do {
        isOnSnake = false;
        x = Math.floor(Math.random() * config.cols);
        y = Math.floor(Math.random() * config.rows);
        
        // 检查是否与蛇的身体重叠
        for (let segment of gameState.snake) {
            if (segment.x === x && segment.y === y) {
                isOnSnake = true;
                break;
            }
        }
    } while (isOnSnake);
    
    gameState.food = { x, y };
}

// 移动蛇
function moveSnake() {
    const head = { ...gameState.snake[0] };
    
    // 根据方向移动头部
    switch (gameState.direction) {
        case 'up':
            head.y -= 1;
            break;
        case 'down':
            head.y += 1;
            break;
        case 'left':
            head.x -= 1;
            break;
        case 'right':
            head.x += 1;
            break;
    }
    
    // 将新的头部添加到蛇的身体
    gameState.snake.unshift(head);
}

// 检查碰撞
function checkCollision() {
    const head = gameState.snake[0];
    
    // 检查是否撞到墙壁
    if (head.x < 0 || head.x >= config.cols || head.y < 0 || head.y >= config.rows) {
        return true;
    }
    
    // 检查是否撞到自己的身体
    for (let i = 1; i < gameState.snake.length; i++) {
        if (head.x === gameState.snake[i].x && head.y === gameState.snake[i].y) {
            return true;
        }
    }
    
    return false;
}

// 检查是否吃到食物
function checkFood() {
    const head = gameState.snake[0];
    
    if (head.x === gameState.food.x && head.y === gameState.food.y) {
        // 增加分数
        gameState.score += 10;
        
        // 更新显示
        updateScore();
        
        // 生成新的食物
        generateFood();
        
        // 增加游戏速度
        gameState.gameSpeed = Math.max(50, gameState.gameSpeed - config.speedIncrement);
        
        return true; // 吃到食物，不需要移除尾部
    }
    
    return false; // 没吃到食物，需要移除尾部
}

// 更新分数显示
function updateScore() {
    scoreElement.textContent = gameState.score;
    lengthElement.textContent = gameState.snake.length;
}

// 更新速度显示
function updateSpeedDisplay(speedValue) {
    let textValue;
    if (speedValue <= 70) {
        textValue = '最快';
    } else if (speedValue <= 110) {
        textValue = '快速';
    } else if (speedValue <= 170) {
        textValue = '中速';
    } else if (speedValue <= 230) {
        textValue = '慢速';
    } else {
        textValue = '最慢';
    }
    return textValue;
}

// 处理速度变化
function handleSpeedChange(newSpeed) {
    gameState.gameSpeed = parseInt(newSpeed);
    speedValue.textContent = updateSpeedDisplay(gameState.gameSpeed);
    
    // 同步更新滑块值
    speedSlider.value = gameState.gameSpeed;
}

// 绘制游戏
function drawGame() {
    // 清空画布
    ctx.clearRect(0, 0, snakeCanvas.width, snakeCanvas.height);
    
    // 绘制背景网格
    drawGrid();
    
    // 绘制食物
    drawFood();
    
    // 绘制蛇
    drawSnake();
}

// 绘制背景网格
function drawGrid() {
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.5;
    
    // 绘制垂直线
    for (let x = 0; x <= config.cols; x++) {
        ctx.beginPath();
        ctx.moveTo(x * config.blockSize, 0);
        ctx.lineTo(x * config.blockSize, snakeCanvas.height);
        ctx.stroke();
    }
    
    // 绘制水平线
    for (let y = 0; y <= config.rows; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * config.blockSize);
        ctx.lineTo(snakeCanvas.width, y * config.blockSize);
        ctx.stroke();
    }
}

// 绘制食物
function drawFood() {
    if (!gameState.food) return;
    
    ctx.fillStyle = COLORS.food;
    ctx.fillRect(
        gameState.food.x * config.blockSize,
        gameState.food.y * config.blockSize,
        config.blockSize,
        config.blockSize
    );
}

// 绘制蛇
function drawSnake() {
    // 绘制蛇的头部
    const head = gameState.snake[0];
    ctx.fillStyle = COLORS.snakeHead;
    ctx.fillRect(
        head.x * config.blockSize,
        head.y * config.blockSize,
        config.blockSize,
        config.blockSize
    );
    
    // 绘制蛇的身体
    ctx.fillStyle = COLORS.snakeBody;
    for (let i = 1; i < gameState.snake.length; i++) {
        const segment = gameState.snake[i];
        ctx.fillRect(
            segment.x * config.blockSize,
            segment.y * config.blockSize,
            config.blockSize,
            config.blockSize
        );
    }
}

// 游戏主循环 - 使用requestAnimationFrame优化响应速度
function gameLoop(timestamp) {
    if (!gameState.isPlaying || gameState.isPaused) return;
    
    // 如果是第一帧，初始化lastFrameTime
    if (!gameState.lastFrameTime) {
        gameState.lastFrameTime = timestamp;
    }
    
    // 计算时间差
    const elapsed = timestamp - gameState.lastFrameTime;
    
    // 只有当经过的时间大于游戏速度时才更新游戏状态
    if (elapsed >= gameState.gameSpeed) {
        // 立即应用方向变更，而不是等到下一个循环
        gameState.direction = gameState.nextDirection;
        
        // 移动蛇
        moveSnake();
        
        // 检查是否吃到食物
        const ateFood = checkFood();
        
        // 如果没吃到食物，移除尾部
        if (!ateFood) {
            gameState.snake.pop();
        }
        
        // 检查碰撞
        if (checkCollision()) {
            endGame();
            return;
        }
        
        // 绘制游戏
        drawGame();
        
        // 更新最后一帧时间
        gameState.lastFrameTime = timestamp;
    }
    
    // 继续游戏循环
    gameState.animationId = requestAnimationFrame(gameLoop);
}

// 开始游戏
function startGame() {
    // 重置游戏状态
    gameState.score = 0;
    gameState.isPlaying = true;
    gameState.isPaused = false;
    gameState.gameSpeed = config.initialSpeed;
    gameState.lastFrameTime = 0;
    
    // 初始化蛇和食物
    initSnake();
    generateFood();
    
    // 更新显示
    updateScore();
    
    // 更新按钮状态
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    resetBtn.disabled = false;
    
    // 开始游戏循环
    gameState.animationId = requestAnimationFrame(gameLoop);
}

// 暂停游戏
function pauseGame() {
    gameState.isPaused = !gameState.isPaused;
    pauseBtn.textContent = gameState.isPaused ? '继续游戏' : '暂停游戏';
    
    if (!gameState.isPaused && gameState.isPlaying) {
        // 重新开始游戏循环
        gameState.lastFrameTime = 0; // 重置时间，避免暂停后突然移动
        gameState.animationId = requestAnimationFrame(gameLoop);
    } else if (gameState.isPaused && gameState.animationId) {
        cancelAnimationFrame(gameState.animationId);
    }
}

// 重置游戏
function resetGame() {
    // 取消游戏循环
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
    gameState.gameSpeed = config.initialSpeed; // 重置游戏速度
    
    // 初始化游戏
    initSnake();
    generateFood();
    gameState.score = 0;
    
    // 更新显示
    updateScore();
    drawGame();
    
    // 重置速度显示
    handleSpeedChange(config.initialSpeed);
}

// 结束游戏
function endGame() {
    // 取消游戏循环
    if (gameState.animationId) {
        cancelAnimationFrame(gameState.animationId);
        gameState.animationId = null;
    }
    
    // 游戏结束
    gameState.isPlaying = false;
    
    // 更新按钮状态
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    resetBtn.disabled = false;
    
    // 显示游戏结束信息
    alert('游戏结束！你的得分：' + gameState.score + '，蛇的长度：' + gameState.snake.length);
}

// 设置事件监听
function setupEventListeners() {
    // 按钮事件
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', pauseGame);
    resetBtn.addEventListener('click', resetGame);
    
    // 速度滑块事件
    speedSlider.addEventListener('input', (e) => {
        handleSpeedChange(e.target.value);
    });
    
    // 初始化速度显示
    speedValue.textContent = updateSpeedDisplay(config.initialSpeed);
    speedSlider.value = config.initialSpeed;
    
    // 键盘事件
    document.addEventListener('keydown', (e) => {
        // 阻止方向键的默认行为（如页面滚动）
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault();
        }
        
        if (!gameState.isPlaying) return;
        
        // 方向控制 - 确保不能直接反向移动
        switch (e.key) {
            case 'ArrowUp':
                if (gameState.direction !== 'down') {
                    gameState.nextDirection = 'up';
                    // 立即应用方向变更，提高响应速度
                    if (Math.abs(gameState.lastFrameTime - performance.now()) > gameState.gameSpeed * 0.3) {
                        gameState.direction = gameState.nextDirection;
                    }
                }
                break;
            case 'ArrowDown':
                if (gameState.direction !== 'up') {
                    gameState.nextDirection = 'down';
                    // 立即应用方向变更，提高响应速度
                    if (Math.abs(gameState.lastFrameTime - performance.now()) > gameState.gameSpeed * 0.3) {
                        gameState.direction = gameState.nextDirection;
                    }
                }
                break;
            case 'ArrowLeft':
                if (gameState.direction !== 'right') {
                    gameState.nextDirection = 'left';
                    // 立即应用方向变更，提高响应速度
                    if (Math.abs(gameState.lastFrameTime - performance.now()) > gameState.gameSpeed * 0.3) {
                        gameState.direction = gameState.nextDirection;
                    }
                }
                break;
            case 'ArrowRight':
                if (gameState.direction !== 'left') {
                    gameState.nextDirection = 'right';
                    // 立即应用方向变更，提高响应速度
                    if (Math.abs(gameState.lastFrameTime - performance.now()) > gameState.gameSpeed * 0.3) {
                        gameState.direction = gameState.nextDirection;
                    }
                }
                break;
            case ' ':
                // 空格键暂停/继续游戏
                pauseGame();
                break;
        }
    });
}

// 启动游戏
window.addEventListener('load', initGame);