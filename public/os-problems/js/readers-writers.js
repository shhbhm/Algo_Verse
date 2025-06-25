class ReadersWritersSimulator {
    constructor() {
        this.canvas = document.getElementById('rwCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // State variables
        this.isRunning = false;
        this.isPaused = false;
        this.timeElapsed = 0;
        this.readOperations = 0;
        this.writeOperations = 0;
        this.totalReaderWaitTime = 0;
        this.totalWriterWaitTime = 0;
        this.speed = 5;
        
        // Configuration
        this.readerCount = 3;
        this.writerCount = 2;
        this.solutionType = 'fair';
        
        // Simulation state
        this.readers = [];
        this.writers = [];
        this.waitingQueue = [];
        this.activeReaders = [];
        this.activeWriter = null;
        this.resourceState = 'available'; // 'available', 'reading', 'writing'
        
        // Semaphore simulation
        this.readCount = 0;
        this.writeCount = 0;
        this.mutex = { locked: false, queue: [] };
        this.roomEmpty = { locked: false, queue: [] };
        this.turnstile = { locked: false, queue: [] };
        
        // Animation variables
        this.animationFrame = null;
        this.lastTime = 0;
        this.simulationStartTime = 0;
        
        this.initializeElements();
        this.setupEventListeners();
        this.createThreads();
        this.updateDisplay();
        this.draw();
    }

    initializeElements() {
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.stepBtn = document.getElementById('stepBtn');
        this.speedSlider = document.getElementById('speed');
        this.solutionSelect = document.getElementById('solution');
        this.readerCountSelect = document.getElementById('readerCount');
        this.writerCountSelect = document.getElementById('writerCount');
        this.logPanel = document.getElementById('logPanel');
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.stepBtn.addEventListener('click', () => this.step());
        
        this.speedSlider.addEventListener('input', (e) => {
            this.speed = parseInt(e.target.value);
        });
        
        this.solutionSelect.addEventListener('change', (e) => {
            if (!this.isRunning) {
                this.solutionType = e.target.value;
                this.updateAlgorithmDescription();
                this.reset();
            }
        });
        
        this.readerCountSelect.addEventListener('change', (e) => {
            if (!this.isRunning) {
                this.readerCount = parseInt(e.target.value);
                this.createThreads();
                this.draw();
            }
        });
        
        this.writerCountSelect.addEventListener('change', (e) => {
            if (!this.isRunning) {
                this.writerCount = parseInt(e.target.value);
                this.createThreads();
                this.draw();
            }
        });
    }

    createThreads() {
        this.readers = [];
        this.writers = [];
        
        // Create reader threads
        for (let i = 0; i < this.readerCount; i++) {
            this.readers.push({
                id: `R${i + 1}`,
                type: 'reader',
                state: 'idle', // 'idle', 'wanting', 'reading', 'waiting'
                x: 100 + i * 80,
                y: 100,
                waitStartTime: 0,
                actionTimer: 0,
                actionDuration: this.getRandomActionTime()
            });
        }
        
        // Create writer threads
        for (let i = 0; i < this.writerCount; i++) {
            this.writers.push({
                id: `W${i + 1}`,
                type: 'writer',
                state: 'idle', // 'idle', 'wanting', 'writing', 'waiting'
                x: 100 + i * 120,
                y: 400,
                waitStartTime: 0,
                actionTimer: 0,
                actionDuration: this.getRandomActionTime()
            });
        }
        
        this.updateAlgorithmDescription();
    }

    getRandomActionTime() {
        return 2000 + Math.random() * 3000; // 2-5 seconds
    }

    updateAlgorithmDescription() {
        const descriptions = {
            'first-readers': 'First Readers Priority: Readers have priority over writers. Writers may starve if readers keep arriving.',
            'first-writers': 'First Writers Priority: Writers have priority over readers. Readers may starve if writers keep arriving.',
            'fair': 'Fair Solution: Uses turnstile mechanism to prevent starvation of both readers and writers.'
        };
        
        document.getElementById('algorithmDescription').textContent = descriptions[this.solutionType];
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.isPaused = false;
            this.simulationStartTime = Date.now();
            this.log('🚀 Simulation started');
            this.animate();
        } else if (this.isPaused) {
            this.isPaused = false;
            this.log('▶️ Simulation resumed');
            this.animate();
        }
    }

    pause() {
        if (this.isRunning && !this.isPaused) {
            this.isPaused = true;
            this.log('⏸️ Simulation paused');
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
            }
        }
    }

    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.timeElapsed = 0;
        this.readOperations = 0;
        this.writeOperations = 0;
        this.totalReaderWaitTime = 0;
        this.totalWriterWaitTime = 0;
        
        this.waitingQueue = [];
        this.activeReaders = [];
        this.activeWriter = null;
        this.resourceState = 'available';
        
        this.readCount = 0;
        this.writeCount = 0;
        this.mutex = { locked: false, queue: [] };
        this.roomEmpty = { locked: false, queue: [] };
        this.turnstile = { locked: false, queue: [] };
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        // Reset all threads
        [...this.readers, ...this.writers].forEach(thread => {
            thread.state = 'idle';
            thread.actionTimer = 0;
            thread.waitStartTime = 0;
            thread.actionDuration = this.getRandomActionTime();
        });
        
        this.updateDisplay();
        this.updateStatistics();
        this.draw();
        this.log('🔄 Simulation reset');
    }

    step() {
        if (!this.isRunning) {
            this.start();
            setTimeout(() => this.pause(), 100);
        }
    }

    animate(currentTime = 0) {
        if (!this.isRunning || this.isPaused) return;

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Update simulation
        this.update(deltaTime);
        
        // Draw everything
        this.draw();
        
        // Schedule next frame
        this.animationFrame = requestAnimationFrame((time) => this.animate(time));
    }

    update(deltaTime) {
        const speedMultiplier = this.speed / 5;
        const adjustedDelta = deltaTime * speedMultiplier;
        
        this.timeElapsed += adjustedDelta;
        
        // Update all threads
        [...this.readers, ...this.writers].forEach(thread => {
            this.updateThread(thread, adjustedDelta);
        });
        
        // Process waiting queue
        this.processWaitingQueue();
        
        // Update displays
        this.updateDisplay();
        this.updateStatistics();
    }

    updateThread(thread, deltaTime) {
        thread.actionTimer += deltaTime;
        
        switch (thread.state) {
            case 'idle':
                if (thread.actionTimer >= thread.actionDuration) {
                    thread.state = 'wanting';
                    thread.actionTimer = 0;
                    thread.waitStartTime = Date.now();
                    this.requestAccess(thread);
                }
                break;
                
            case 'reading':
                if (thread.actionTimer >= thread.actionDuration) {
                    this.finishReading(thread);
                }
                break;
                
            case 'writing':
                if (thread.actionTimer >= thread.actionDuration) {
                    this.finishWriting(thread);
                }
                break;
        }
    }

    requestAccess(thread) {
        this.log(`${thread.id} wants to ${thread.type === 'reader' ? 'read' : 'write'}`);
        
        switch (this.solutionType) {
            case 'first-readers':
                this.firstReadersPriority(thread);
                break;
            case 'first-writers':
                this.firstWritersPriority(thread);
                break;
            case 'fair':
                this.fairSolution(thread);
                break;
        }
    }

    firstReadersPriority(thread) {
        if (thread.type === 'reader') {
            this.acquireMutex(thread, () => {
                this.readCount++;
                if (this.readCount === 1) {
                    this.acquireRoomEmpty(thread, () => {
                        this.startReading(thread);
                    });
                } else {
                    this.startReading(thread);
                }
                this.releaseMutex();
            });
        } else {
            this.acquireRoomEmpty(thread, () => {
                this.startWriting(thread);
            });
        }
    }

    firstWritersPriority(thread) {
        if (thread.type === 'writer') {
            this.writeCount++;
            if (this.writeCount === 1) {
                this.acquireMutex(thread, () => {
                    this.acquireRoomEmpty(thread, () => {
                        this.startWriting(thread);
                    });
                });
            } else {
                this.acquireRoomEmpty(thread, () => {
                    this.startWriting(thread);
                });
            }
        } else {
            this.acquireMutex(thread, () => {
                this.readCount++;
                if (this.readCount === 1) {
                    this.acquireRoomEmpty(thread, () => {
                        this.startReading(thread);
                    });
                } else {
                    this.startReading(thread);
                }
                this.releaseMutex();
            });
        }
    }

    fairSolution(thread) {
        this.acquireTurnstile(thread, () => {
            if (thread.type === 'reader') {
                this.acquireMutex(thread, () => {
                    this.readCount++;
                    if (this.readCount === 1) {
                        this.acquireRoomEmpty(thread, () => {
                            this.releaseTurnstile();
                            this.startReading(thread);
                        });
                    } else {
                        this.releaseTurnstile();
                        this.startReading(thread);
                    }
                    this.releaseMutex();
                });
            } else {
                this.acquireRoomEmpty(thread, () => {
                    this.releaseTurnstile();
                    this.startWriting(thread);
                });
            }
        });
    }

    acquireMutex(thread, callback) {
        if (!this.mutex.locked) {
            this.mutex.locked = true;
            callback();
        } else {
            this.mutex.queue.push({ thread, callback });
            thread.state = 'waiting';
            this.waitingQueue.push(thread);
        }
    }

    releaseMutex() {
        if (this.mutex.queue.length > 0) {
            const { thread, callback } = this.mutex.queue.shift();
            thread.state = 'wanting';
            this.waitingQueue = this.waitingQueue.filter(t => t !== thread);
            callback();
        } else {
            this.mutex.locked = false;
        }
    }

    acquireRoomEmpty(thread, callback) {
        if (!this.roomEmpty.locked) {
            this.roomEmpty.locked = true;
            callback();
        } else {
            this.roomEmpty.queue.push({ thread, callback });
            thread.state = 'waiting';
            this.waitingQueue.push(thread);
        }
    }

    releaseRoomEmpty() {
        if (this.roomEmpty.queue.length > 0) {
            const { thread, callback } = this.roomEmpty.queue.shift();
            thread.state = 'wanting';
            this.waitingQueue = this.waitingQueue.filter(t => t !== thread);
            callback();
        } else {
            this.roomEmpty.locked = false;
        }
    }

    acquireTurnstile(thread, callback) {
        if (!this.turnstile.locked) {
            this.turnstile.locked = true;
            callback();
        } else {
            this.turnstile.queue.push({ thread, callback });
            thread.state = 'waiting';
            this.waitingQueue.push(thread);
        }
    }

    releaseTurnstile() {
        if (this.turnstile.queue.length > 0) {
            const { thread, callback } = this.turnstile.queue.shift();
            thread.state = 'wanting';
            this.waitingQueue = this.waitingQueue.filter(t => t !== thread);
            callback();
        } else {
            this.turnstile.locked = false;
        }
    }

    startReading(thread) {
        thread.state = 'reading';
        thread.actionTimer = 0;
        thread.actionDuration = this.getRandomActionTime();
        this.activeReaders.push(thread);
        this.resourceState = 'reading';
        
        if (thread.waitStartTime > 0) {
            this.totalReaderWaitTime += Date.now() - thread.waitStartTime;
            thread.waitStartTime = 0;
        }
        
        this.log(`📖 ${thread.id} started reading`);
    }

    finishReading(thread) {
        thread.state = 'idle';
        thread.actionTimer = 0;
        thread.actionDuration = this.getRandomActionTime();
        this.activeReaders = this.activeReaders.filter(r => r !== thread);
        this.readOperations++;
        
        this.acquireMutex(thread, () => {
            this.readCount--;
            if (this.readCount === 0) {
                this.resourceState = 'available';
                this.releaseRoomEmpty();
            }
            this.releaseMutex();
        });
        
        this.log(`✅ ${thread.id} finished reading`);
    }

    startWriting(thread) {
        thread.state = 'writing';
        thread.actionTimer = 0;
        thread.actionDuration = this.getRandomActionTime();
        this.activeWriter = thread;
        this.resourceState = 'writing';
        
        if (thread.waitStartTime > 0) {
            this.totalWriterWaitTime += Date.now() - thread.waitStartTime;
            thread.waitStartTime = 0;
        }
        
        this.log(`✍️ ${thread.id} started writing`);
    }

    finishWriting(thread) {
        thread.state = 'idle';
        thread.actionTimer = 0;
        thread.actionDuration = this.getRandomActionTime();
        this.activeWriter = null;
        this.resourceState = 'available';
        this.writeOperations++;
        
        if (this.solutionType === 'first-writers') {
            this.writeCount--;
            if (this.writeCount === 0) {
                this.releaseMutex();
            }
        }
        
        this.releaseRoomEmpty();
        this.log(`✅ ${thread.id} finished writing`);
    }

    processWaitingQueue() {
        // This is handled by the semaphore mechanisms above
    }

    updateDisplay() {
        // Update resource status
        const resourceStatusDiv = document.getElementById('resourceStatus');
        const resourceStateSpan = document.getElementById('resourceState');
        
        let statusClass, statusText;
        switch (this.resourceState) {
            case 'available':
                statusClass = 'available';
                statusText = 'AVAILABLE';
                break;
            case 'reading':
                statusClass = 'reading';
                statusText = `READING (${this.activeReaders.length})`;
                break;
            case 'writing':
                statusClass = 'writing';
                statusText = 'WRITING';
                break;
        }
        
        resourceStatusDiv.className = `status-item ${statusClass}`;
        resourceStateSpan.textContent = statusText;
        
        // Update active threads list
        this.updateActiveThreadsList();
        
        // Update waiting queue list
        this.updateWaitingThreadsList();
    }

    updateActiveThreadsList() {
        const activeThreadsDiv = document.getElementById('activeThreadsList');
        
        const activeThreads = [...this.activeReaders];
        if (this.activeWriter) {
            activeThreads.push(this.activeWriter);
        }
        
        if (activeThreads.length === 0) {
            activeThreadsDiv.innerHTML = '<div style="text-align: center; color: #7f8c8d; padding: 20px;">No active threads</div>';
            return;
        }
        
        let html = '';
        activeThreads.forEach(thread => {
            const threadClass = thread.type === 'reader' ? 'reader-thread' : 'writer-thread';
            const action = thread.type === 'reader' ? 'Reading' : 'Writing';
            html += `<div class="thread-item ${threadClass}">
                <span>${thread.id}</span>
                <span>${action}</span>
            </div>`;
        });
        
        activeThreadsDiv.innerHTML = html;
    }

    updateWaitingThreadsList() {
        const waitingThreadsDiv = document.getElementById('waitingThreadsList');
        
        if (this.waitingQueue.length === 0) {
            waitingThreadsDiv.innerHTML = '<div style="text-align: center; color: #7f8c8d; padding: 20px;">No waiting threads</div>';
            return;
        }
        
        let html = '';
        this.waitingQueue.forEach(thread => {
            const action = thread.type === 'reader' ? 'to Read' : 'to Write';
            html += `<div class="thread-item waiting-thread">
                <span>${thread.id}</span>
                <span>Waiting ${action}</span>
            </div>`;
        });
        
        waitingThreadsDiv.innerHTML = html;
    }

    updateStatistics() {
        const runningTimeSpan = document.getElementById('runningTime');
        const readOperationsSpan = document.getElementById('readOperations');
        const writeOperationsSpan = document.getElementById('writeOperations');
        const concurrentReadersSpan = document.getElementById('concurrentReaders');
        const avgReaderWaitSpan = document.getElementById('avgReaderWait');
        const avgWriterWaitSpan = document.getElementById('avgWriterWait');
        
        const totalTime = this.simulationStartTime > 0 ? Date.now() - this.simulationStartTime : 0;
        
        runningTimeSpan.textContent = `${Math.floor(totalTime / 1000)}s`;
        readOperationsSpan.textContent = this.readOperations;
        writeOperationsSpan.textContent = this.writeOperations;
        concurrentReadersSpan.textContent = this.activeReaders.length;
        
        const avgReaderWait = this.readOperations > 0 ? this.totalReaderWaitTime / this.readOperations : 0;
        const avgWriterWait = this.writeOperations > 0 ? this.totalWriterWaitTime / this.writeOperations : 0;
        
        avgReaderWaitSpan.textContent = `${Math.floor(avgReaderWait / 1000)}s`;
        avgWriterWaitSpan.textContent = `${Math.floor(avgWriterWait / 1000)}s`;
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.drawBackground();
        
        // Draw shared resource
        this.drawSharedResource();
        
        // Draw threads
        this.drawThreads();
        
        // Draw connections
        this.drawConnections();
    }

    drawBackground() {
        // Background
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Title areas
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.fillRect(50, 50, this.canvas.width - 100, 80);
        this.ctx.fillRect(50, 350, this.canvas.width - 100, 80);
        
        // Labels
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = '18px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('📖 READER THREADS', this.canvas.width / 2, 75);
        this.ctx.fillText('✍️ WRITER THREADS', this.canvas.width / 2, 375);
    }

    drawSharedResource() {
        const centerX = this.canvas.width / 2;
        const centerY = 250;
        
        // Resource box
        let resourceColor;
        switch (this.resourceState) {
            case 'available': resourceColor = '#27ae60'; break;
            case 'reading': resourceColor = '#3498db'; break;
            case 'writing': resourceColor = '#e74c3c'; break;
        }
        
        this.ctx.fillStyle = resourceColor;
        this.ctx.fillRect(centerX - 60, centerY - 30, 120, 60);
        
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(centerX - 60, centerY - 30, 120, 60);
        
        // Resource label
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('📚 SHARED', centerX, centerY - 5);
        this.ctx.fillText('RESOURCE', centerX, centerY + 15);
    }

    drawThreads() {
        // Draw readers
        this.readers.forEach(reader => {
            this.drawThread(reader);
        });
        
        // Draw writers
        this.writers.forEach(writer => {
            this.drawThread(writer);
        });
    }

    drawThread(thread) {
        const ctx = this.ctx;
        
        // Thread color based on state
        let threadColor;
        switch (thread.state) {
            case 'idle': threadColor = '#95a5a6'; break;
            case 'wanting': threadColor = '#f39c12'; break;
            case 'reading': threadColor = '#3498db'; break;
            case 'writing': threadColor = '#e74c3c'; break;
            case 'waiting': threadColor = '#e67e22'; break;
        }
        
        // Draw thread circle
        ctx.fillStyle = threadColor;
        ctx.beginPath();
        ctx.arc(thread.x, thread.y, 25, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw thread ID
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(thread.id, thread.x, thread.y + 5);
        
        // Draw state indicator
        ctx.fillStyle = '#2c3e50';
        ctx.font = '10px Arial';
        ctx.fillText(thread.state.toUpperCase(), thread.x, thread.y + 45);
    }

    drawConnections() {
        const centerX = this.canvas.width / 2;
        const centerY = 250;
        
        // Draw connections for active threads
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 2;
        
        [...this.activeReaders, ...(this.activeWriter ? [this.activeWriter] : [])].forEach(thread => {
            this.ctx.beginPath();
            this.ctx.moveTo(thread.x, thread.y);
            this.ctx.lineTo(centerX, centerY);
            this.ctx.stroke();
        });
    }

    log(message) {
        const logPanel = document.getElementById('logPanel');
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.textContent = `[${timestamp}] ${message}`;
        
        logPanel.appendChild(logEntry);
        logPanel.scrollTop = logPanel.scrollHeight;
        
        // Limit log entries
        while (logPanel.children.length > 50) {
            logPanel.removeChild(logPanel.firstChild);
        }
    }
}

// Initialize the simulator when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ReadersWritersSimulator();
}); 