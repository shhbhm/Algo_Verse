class DiningPhilosophers {
    constructor() {
        this.canvas = document.getElementById('philosophersCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.numPhilosophers = 5;
        this.philosophers = [];
        this.forks = [];
        this.isRunning = false;
        this.isPaused = false;
        this.speed = 5;
        this.algorithm = 'resource-hierarchy';
        this.startTime = null;
        this.statistics = {
            totalMeals: 0,
            deadlocks: 0,
            maxWaitTime: 0,
            runningTime: 0
        };
        this.animationId = null;
        this.lastFrameTime = 0;
        this.logPanel = document.getElementById('logPanel');
        
        this.initializePhilosophers();
        this.setupEventListeners();
        this.updateAlgorithmDescription();
        this.draw();
        
        // Log the correct fork assignments for verification
        this.log('🍴 Fork assignments (Fixed):');
        this.philosophers.forEach(p => {
            this.log(`📍 Philosopher ${p.id}: Left fork F${p.leftFork}, Right fork F${p.rightFork}`);
        });
    }

    initializePhilosophers() {
        this.philosophers = [];
        this.forks = [];
        
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = 200;
        
        // Initialize philosophers
        for (let i = 0; i < this.numPhilosophers; i++) {
            const angle = (i * 2 * Math.PI) / this.numPhilosophers - Math.PI / 2;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            
            this.philosophers.push({
                id: i,
                x: x,
                y: y,
                state: 'thinking', // thinking, hungry, eating, waiting
                timeInState: 0,
                totalWaitTime: 0,
                mealsEaten: 0,
                leftFork: i,
                rightFork: (i - 1 + this.numPhilosophers) % this.numPhilosophers,
                hasLeftFork: false,
                hasRightFork: false,
                lastStateChange: Date.now()
            });
        }
        
        // Initialize forks
        for (let i = 0; i < this.numPhilosophers; i++) {
            const angle = ((i + 0.5) * 2 * Math.PI) / this.numPhilosophers - Math.PI / 2;
            const forkRadius = radius + 40;
            const x = centerX + forkRadius * Math.cos(angle);
            const y = centerY + forkRadius * Math.sin(angle);
            
            this.forks.push({
                id: i,
                x: x,
                y: y,
                available: true,
                ownedBy: null
            });
        }
        
        this.updatePhilosopherStatuses();
        this.updateForkStates();
    }

    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pause());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('stepBtn').addEventListener('click', () => this.step());
        
        document.getElementById('philosophers').addEventListener('change', (e) => {
            this.numPhilosophers = parseInt(e.target.value);
            this.reset();
        });
        
        document.getElementById('algorithm').addEventListener('change', (e) => {
            this.algorithm = e.target.value;
            this.updateAlgorithmDescription();
            this.reset();
        });
        
        document.getElementById('speed').addEventListener('input', (e) => {
            this.speed = parseInt(e.target.value);
        });
    }

    updateAlgorithmDescription() {
        const description = 'Resource Hierarchy: Philosophers acquire forks in ascending order of fork IDs to prevent circular wait and deadlock. Each philosopher has specific left/right fork assignments based on their circular table position.';
        
        document.getElementById('algorithmDescription').innerHTML = 
            `<small style="color: #7f8c8d;">${description}</small>`;
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.isPaused = false;
            this.startTime = Date.now();
            this.log('🚀 Simulation started with ' + this.algorithm + ' algorithm');
            this.animate();
        }
    }

    pause() {
        this.isPaused = !this.isPaused;
        if (!this.isPaused && this.isRunning) {
            this.animate();
            this.log('▶️ Simulation resumed');
        } else {
            this.log('⏸️ Simulation paused');
        }
    }

    reset() {
        this.isRunning = false;
        this.isPaused = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.statistics = {
            totalMeals: 0,
            deadlocks: 0,
            maxWaitTime: 0,
            runningTime: 0
        };
        this.initializePhilosophers();
        this.updateStatistics();
        this.log('🔄 Simulation reset');
        this.draw();
    }

    step() {
        if (!this.isRunning) {
            this.updatePhilosophers();
            this.draw();
            this.log('👣 Single step executed');
        }
    }

    animate() {
        if (!this.isRunning || this.isPaused) return;
        
        const currentTime = Date.now();
        if (currentTime - this.lastFrameTime >= (1000 / this.speed)) {
            this.updatePhilosophers();
            this.updateStatistics();
            this.checkDeadlock();
            this.lastFrameTime = currentTime;
        }
        
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    updatePhilosophers() {
        const currentTime = Date.now();
        
        this.philosophers.forEach(philosopher => {
            philosopher.timeInState = currentTime - philosopher.lastStateChange;
            
            switch (philosopher.state) {
                case 'thinking':
                    this.handleThinking(philosopher);
                    break;
                case 'hungry':
                    this.handleHungry(philosopher);
                    break;
                case 'eating':
                    this.handleEating(philosopher);
                    break;
                case 'waiting':
                    this.handleWaiting(philosopher);
                    break;
            }
        });
        
        this.updatePhilosopherStatuses();
        this.updateForkStates();
    }

    handleThinking(philosopher) {
        // Think for 1-3 seconds
        if (philosopher.timeInState > 1000 + Math.random() * 2000) {
            this.changePhilosopherState(philosopher, 'hungry');
            this.log(`🤔 Philosopher ${philosopher.id} is now hungry`);
        }
    }

    handleHungry(philosopher) {
        this.tryToGetForks(philosopher);
    }

    handleEating(philosopher) {
        // Eat for 1-2 seconds
        if (philosopher.timeInState > 1000 + Math.random() * 1000) {
            this.releaseForks(philosopher);
            philosopher.mealsEaten++;
            this.statistics.totalMeals++;
            this.changePhilosopherState(philosopher, 'thinking');
            this.log(`🍽️ Philosopher ${philosopher.id} finished eating (meal #${philosopher.mealsEaten})`);
        }
    }

    handleWaiting(philosopher) {
        philosopher.totalWaitTime += 50; // Add frame time
        this.statistics.maxWaitTime = Math.max(this.statistics.maxWaitTime, philosopher.totalWaitTime);
        this.tryToGetForks(philosopher);
    }

    tryToGetForks(philosopher) {
        this.tryResourceHierarchy(philosopher);
    }

    tryResourceHierarchy(philosopher) {
        const leftFork = Math.min(philosopher.leftFork, philosopher.rightFork);
        const rightFork = Math.max(philosopher.leftFork, philosopher.rightFork);
        
        if (!philosopher.hasLeftFork && this.forks[leftFork].available) {
            this.acquireFork(philosopher, leftFork, true);
        }
        
        if (philosopher.hasLeftFork && !philosopher.hasRightFork && this.forks[rightFork].available) {
            this.acquireFork(philosopher, rightFork, false);
        }
        
        if (philosopher.hasLeftFork && philosopher.hasRightFork) {
            this.changePhilosopherState(philosopher, 'eating');
            this.log(`🍴 Philosopher ${philosopher.id} started eating`);
        } else if (!philosopher.hasLeftFork || !philosopher.hasRightFork) {
            this.changePhilosopherState(philosopher, 'waiting');
        }
    }



    acquireFork(philosopher, forkId, isLeft) {
        this.forks[forkId].available = false;
        this.forks[forkId].ownedBy = philosopher.id;
        if (isLeft) {
            philosopher.hasLeftFork = true;
        } else {
            philosopher.hasRightFork = true;
        }
    }

    releaseForks(philosopher) {
        if (philosopher.hasLeftFork) {
            this.forks[philosopher.leftFork].available = true;
            this.forks[philosopher.leftFork].ownedBy = null;
            philosopher.hasLeftFork = false;
        }
        if (philosopher.hasRightFork) {
            this.forks[philosopher.rightFork].available = true;
            this.forks[philosopher.rightFork].ownedBy = null;
            philosopher.hasRightFork = false;
        }
    }

    changePhilosopherState(philosopher, newState) {
        philosopher.state = newState;
        philosopher.lastStateChange = Date.now();
        philosopher.timeInState = 0;
        if (newState === 'thinking') {
            philosopher.totalWaitTime = 0;
        }
    }

    checkDeadlock() {
        const waitingPhilosophers = this.philosophers.filter(p => p.state === 'waiting');
        if (waitingPhilosophers.length === this.numPhilosophers) {
            this.statistics.deadlocks++;
            this.log(`💀 DEADLOCK DETECTED! All philosophers are waiting.`);
            
            // Break deadlock by forcing one philosopher to release forks
            const victim = waitingPhilosophers[0];
            this.releaseForks(victim);
            this.changePhilosopherState(victim, 'thinking');
            this.log(`🔄 Deadlock resolved: Philosopher ${victim.id} released forks`);
        }
    }

    updateStatistics() {
        if (this.startTime) {
            this.statistics.runningTime = Math.floor((Date.now() - this.startTime) / 1000);
        }
        
        document.getElementById('runningTime').textContent = this.statistics.runningTime + 's';
        document.getElementById('totalMeals').textContent = this.statistics.totalMeals;
        document.getElementById('deadlockCount').textContent = this.statistics.deadlocks;
        document.getElementById('maxWaitTime').textContent = Math.floor(this.statistics.maxWaitTime / 1000) + 's';
    }

    updatePhilosopherStatuses() {
        const statusDiv = document.getElementById('philosopherStatuses');
        statusDiv.innerHTML = '';
        
        this.philosophers.forEach(philosopher => {
            const statusEl = document.createElement('div');
            statusEl.className = `philosopher-status ${philosopher.state}`;
            statusEl.innerHTML = `
                <span>Philosopher ${philosopher.id}</span>
                <span>${philosopher.state.toUpperCase()} (${philosopher.mealsEaten} meals)</span>
            `;
            statusDiv.appendChild(statusEl);
        });
    }

    updateForkStates() {
        const forkDiv = document.getElementById('forkStates');
        forkDiv.innerHTML = '';
        
        this.forks.forEach(fork => {
            const forkEl = document.createElement('div');
            forkEl.style.cssText = 'display: flex; justify-content: space-between; margin: 2px 0; padding: 4px; border-radius: 3px;';
            forkEl.style.backgroundColor = fork.available ? '#d5f4e6' : '#ffeaa7';
            forkEl.innerHTML = `
                <span>Fork ${fork.id}</span>
                <span>${fork.available ? '⚪ Available' : '🔴 Philosopher ' + fork.ownedBy}</span>
            `;
            forkDiv.appendChild(forkEl);
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw table
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 8;
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 150, 0, 2 * Math.PI);
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#DEB887';
        this.ctx.fill();
        
        // Draw forks
        this.forks.forEach(fork => {
            this.ctx.fillStyle = fork.available ? '#C0C0C0' : '#FF6B6B';
            this.ctx.beginPath();
            this.ctx.arc(fork.x, fork.y, 8, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Fork ID
            this.ctx.fillStyle = '#000';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`F${fork.id}`, fork.x, fork.y - 15);
        });
        
        // Draw philosophers
        this.philosophers.forEach(philosopher => {
            const colors = {
                thinking: '#3498db',
                hungry: '#f39c12',
                eating: '#27ae60',
                waiting: '#e74c3c'
            };
            
            this.ctx.fillStyle = colors[philosopher.state];
            this.ctx.beginPath();
            this.ctx.arc(philosopher.x, philosopher.y, 25, 0, 2 * Math.PI);
            this.ctx.fill();
            
            // Add border for emphasis
            this.ctx.strokeStyle = '#2c3e50';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Philosopher ID
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(philosopher.id.toString(), philosopher.x, philosopher.y + 5);
            
            // Draw fork connections
            if (philosopher.hasLeftFork) {
                this.drawForkConnection(philosopher, this.forks[philosopher.leftFork]);
            }
            if (philosopher.hasRightFork) {
                this.drawForkConnection(philosopher, this.forks[philosopher.rightFork]);
            }
        });
        
        // Draw title
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🍽️ Dining Philosophers Problem', centerX, 30);
    }

    drawForkConnection(philosopher, fork) {
        this.ctx.strokeStyle = '#e74c3c';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(philosopher.x, philosopher.y);
        this.ctx.lineTo(fork.x, fork.y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    log(message) {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        this.logPanel.appendChild(logEntry);
        this.logPanel.scrollTop = this.logPanel.scrollHeight;
    }
}

// Initialize the visualization when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new DiningPhilosophers();
});