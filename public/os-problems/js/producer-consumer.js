class ProducerConsumer {
    constructor() {
        this.canvas = document.getElementById('producerConsumerCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.bufferSize = 8;
        this.numProducers = 2;
        this.numConsumers = 3;
        this.buffer = [];
        this.inPointer = 0;
        this.outPointer = 0;
        this.itemCount = 0;
        this.producers = [];
        this.consumers = [];
        this.isRunning = false;
        this.isPaused = false;
        this.speed = 5;
        this.startTime = null;
        this.statistics = {
            itemsProduced: 0,
            itemsConsumed: 0,
            bufferOverflows: 0,
            bufferUnderflows: 0,
            runningTime: 0
        };
        this.animationId = null;
        this.lastFrameTime = 0;
        this.logPanel = document.getElementById('logPanel');
        this.nextItemId = 1;
        
        // Semaphores
        this.emptySlots = this.bufferSize; // Available empty slots
        this.fullSlots = 0; // Available items to consume
        this.mutex = true; // Mutual exclusion for buffer access
        
        this.initializeSystem();
        this.setupEventListeners();
        this.updateBufferDisplay();
        this.draw();
    }

    initializeSystem() {
        this.buffer = new Array(this.bufferSize).fill(null);
        this.inPointer = 0;
        this.outPointer = 0;
        this.itemCount = 0;
        this.emptySlots = this.bufferSize;
        this.fullSlots = 0;
        this.mutex = true;
        this.producers = [];
        this.consumers = [];
        
        // Initialize producers
        for (let i = 0; i < this.numProducers; i++) {
            this.producers.push({
                id: i,
                state: 'idle', // idle, producing, waiting, blocked
                timeInState: 0,
                lastStateChange: Date.now(),
                x: 100 + (i * 80),
                y: 150,
                producedItems: 0,
                currentItem: null
            });
        }
        
        // Initialize consumers
        for (let i = 0; i < this.numConsumers; i++) {
            this.consumers.push({
                id: i,
                state: 'idle', // idle, consuming, waiting, blocked
                timeInState: 0,
                lastStateChange: Date.now(),
                x: 500 + (i * 80),
                y: 350,
                consumedItems: 0,
                currentItem: null
            });
        }
        
        this.updateThreadStatuses();
    }

    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pause());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        document.getElementById('stepBtn').addEventListener('click', () => this.step());
        
        document.getElementById('bufferSize').addEventListener('change', (e) => {
            this.bufferSize = parseInt(e.target.value);
            this.reset();
        });
        
        document.getElementById('producers').addEventListener('change', (e) => {
            this.numProducers = parseInt(e.target.value);
            this.reset();
        });
        
        document.getElementById('consumers').addEventListener('change', (e) => {
            this.numConsumers = parseInt(e.target.value);
            this.reset();
        });
        
        document.getElementById('speed').addEventListener('input', (e) => {
            this.speed = parseInt(e.target.value);
        });
    }

    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.isPaused = false;
            this.startTime = Date.now();
            this.log('🚀 Producer-Consumer simulation started');
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
            itemsProduced: 0,
            itemsConsumed: 0,
            bufferOverflows: 0,
            bufferUnderflows: 0,
            runningTime: 0
        };
        this.nextItemId = 1;
        this.initializeSystem();
        this.updateStatistics();
        this.updateBufferDisplay();
        this.log('🔄 System reset');
        this.draw();
    }

    step() {
        if (!this.isRunning) {
            this.updateSystem();
            this.updateBufferDisplay();
            this.draw();
            this.log('👣 Single step executed');
        }
    }

    animate() {
        if (!this.isRunning || this.isPaused) return;
        
        const currentTime = Date.now();
        if (currentTime - this.lastFrameTime >= (1000 / this.speed)) {
            this.updateSystem();
            this.updateStatistics();
            this.updateBufferDisplay();
            this.lastFrameTime = currentTime;
        }
        
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    updateSystem() {
        const currentTime = Date.now();
        
        // Update producers
        this.producers.forEach(producer => {
            producer.timeInState = currentTime - producer.lastStateChange;
            this.updateProducer(producer);
        });
        
        // Update consumers
        this.consumers.forEach(consumer => {
            consumer.timeInState = currentTime - consumer.lastStateChange;
            this.updateConsumer(consumer);
        });
        
        this.updateThreadStatuses();
    }

    updateProducer(producer) {
        switch (producer.state) {
            case 'idle':
                // Start producing after random delay
                if (producer.timeInState > 500 + Math.random() * 1000) {
                    this.changeThreadState(producer, 'producing');
                    producer.currentItem = {
                        id: this.nextItemId++,
                        value: Math.floor(Math.random() * 100) + 1,
                        color: this.getRandomColor()
                    };
                    this.log(`🏭 Producer ${producer.id} started creating item ${producer.currentItem.id}`);
                }
                break;
                
            case 'producing':
                // Finish producing after delay
                if (producer.timeInState > 800 + Math.random() * 700) {
                    this.tryToProduce(producer);
                }
                break;
                
            case 'waiting':
                // Try to acquire resources again
                this.tryToProduce(producer);
                break;
                
            case 'blocked':
                // Check if can proceed
                if (this.emptySlots > 0 && this.mutex) {
                    this.changeThreadState(producer, 'waiting');
                }
                break;
        }
    }

    updateConsumer(consumer) {
        switch (consumer.state) {
            case 'idle':
                // Start consuming after random delay
                if (consumer.timeInState > 300 + Math.random() * 800) {
                    this.tryToConsume(consumer);
                }
                break;
                
            case 'consuming':
                // Finish consuming after delay
                if (consumer.timeInState > 600 + Math.random() * 600) {
                    consumer.consumedItems++;
                    this.statistics.itemsConsumed++;
                    this.log(`👥 Consumer ${consumer.id} finished consuming item ${consumer.currentItem.id}`);
                    consumer.currentItem = null;
                    this.changeThreadState(consumer, 'idle');
                }
                break;
                
            case 'waiting':
                // Try to acquire resources again
                this.tryToConsume(consumer);
                break;
                
            case 'blocked':
                // Check if can proceed
                if (this.fullSlots > 0 && this.mutex) {
                    this.changeThreadState(consumer, 'waiting');
                }
                break;
        }
    }

    tryToProduce(producer) {
        // Semaphore-like behavior: wait for empty slot
        if (this.emptySlots <= 0) {
            this.changeThreadState(producer, 'blocked');
            this.log(`⏳ Producer ${producer.id} blocked - buffer full`);
            this.statistics.bufferOverflows++;
            return;
        }
        
        // Acquire mutex
        if (!this.mutex) {
            this.changeThreadState(producer, 'waiting');
            return;
        }
        
        this.mutex = false; // Acquire mutex
        
        // Critical section: add item to buffer
        if (this.itemCount < this.bufferSize) {
            this.buffer[this.inPointer] = producer.currentItem;
            this.inPointer = (this.inPointer + 1) % this.bufferSize;
            this.itemCount++;
            this.emptySlots--;
            this.fullSlots++;
            
            producer.producedItems++;
            this.statistics.itemsProduced++;
            this.log(`📦 Producer ${producer.id} added item ${producer.currentItem.id} to buffer`);
            
            producer.currentItem = null;
            this.changeThreadState(producer, 'idle');
        } else {
            this.statistics.bufferOverflows++;
            this.log(`❌ Producer ${producer.id} failed - buffer full`);
            this.changeThreadState(producer, 'blocked');
        }
        
        this.mutex = true; // Release mutex
    }

    tryToConsume(consumer) {
        // Semaphore-like behavior: wait for filled slot
        if (this.fullSlots <= 0) {
            this.changeThreadState(consumer, 'blocked');
            this.log(`⏳ Consumer ${consumer.id} blocked - buffer empty`);
            this.statistics.bufferUnderflows++;
            return;
        }
        
        // Acquire mutex
        if (!this.mutex) {
            this.changeThreadState(consumer, 'waiting');
            return;
        }
        
        this.mutex = false; // Acquire mutex
        
        // Critical section: remove item from buffer
        if (this.itemCount > 0) {
            consumer.currentItem = this.buffer[this.outPointer];
            this.buffer[this.outPointer] = null;
            this.outPointer = (this.outPointer + 1) % this.bufferSize;
            this.itemCount--;
            this.emptySlots++;
            this.fullSlots--;
            
            this.log(`📤 Consumer ${consumer.id} took item ${consumer.currentItem.id} from buffer`);
            this.changeThreadState(consumer, 'consuming');
        } else {
            this.statistics.bufferUnderflows++;
            this.log(`❌ Consumer ${consumer.id} failed - buffer empty`);
            this.changeThreadState(consumer, 'blocked');
        }
        
        this.mutex = true; // Release mutex
    }

    changeThreadState(thread, newState) {
        thread.state = newState;
        thread.lastStateChange = Date.now();
        thread.timeInState = 0;
    }

    getRandomColor() {
        const colors = ['#e74c3c', '#3498db', '#f39c12', '#27ae60', '#9b59b6', '#e67e22'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    updateStatistics() {
        if (this.startTime) {
            this.statistics.runningTime = Math.floor((Date.now() - this.startTime) / 1000);
        }
        
        const throughput = this.statistics.runningTime > 0 ? 
            (this.statistics.itemsConsumed / this.statistics.runningTime).toFixed(1) : '0';
        
        document.getElementById('runningTime').textContent = this.statistics.runningTime + 's';
        document.getElementById('itemsProduced').textContent = this.statistics.itemsProduced;
        document.getElementById('itemsConsumed').textContent = this.statistics.itemsConsumed;
        document.getElementById('bufferOverflows').textContent = this.statistics.bufferOverflows;
        document.getElementById('bufferUnderflows').textContent = this.statistics.bufferUnderflows;
        document.getElementById('throughput').textContent = throughput + '/s';
    }

    updateThreadStatuses() {
        // Update producer statuses
        const producerDiv = document.getElementById('producerStatuses');
        producerDiv.innerHTML = '';
        
        this.producers.forEach(producer => {
            const statusEl = document.createElement('div');
            statusEl.className = `thread-status ${producer.state === 'producing' ? 'working' : 
                                                  producer.state === 'blocked' || producer.state === 'waiting' ? 'waiting' : 'producer'}`;
            statusEl.innerHTML = `
                <span>Producer ${producer.id}</span>
                <span>${producer.state.toUpperCase()} (${producer.producedItems})</span>
            `;
            producerDiv.appendChild(statusEl);
        });
        
        // Update consumer statuses
        const consumerDiv = document.getElementById('consumerStatuses');
        consumerDiv.innerHTML = '';
        
        this.consumers.forEach(consumer => {
            const statusEl = document.createElement('div');
            statusEl.className = `thread-status ${consumer.state === 'consuming' ? 'working' : 
                                                  consumer.state === 'blocked' || consumer.state === 'waiting' ? 'waiting' : 'consumer'}`;
            statusEl.innerHTML = `
                <span>Consumer ${consumer.id}</span>
                <span>${consumer.state.toUpperCase()} (${consumer.consumedItems})</span>
            `;
            consumerDiv.appendChild(statusEl);
        });
    }

    updateBufferDisplay() {
        const slotsDiv = document.getElementById('bufferSlots');
        slotsDiv.innerHTML = '';
        
        for (let i = 0; i < this.bufferSize; i++) {
            const slotEl = document.createElement('div');
            slotEl.className = `buffer-slot ${this.buffer[i] ? 'filled' : 'empty'}`;
            slotEl.textContent = this.buffer[i] ? this.buffer[i].id : '-';
            
            if (i === this.inPointer && i === this.outPointer) {
                slotEl.style.border = '3px solid #9b59b6'; // Both pointers
                slotEl.title = 'In/Out pointer';
            } else if (i === this.inPointer) {
                slotEl.style.border = '3px solid #3498db'; // In pointer
                slotEl.title = 'In pointer';
            } else if (i === this.outPointer) {
                slotEl.style.border = '3px solid #e74c3c'; // Out pointer
                slotEl.title = 'Out pointer';
            }
            
            slotsDiv.appendChild(slotEl);
        }
        
        document.getElementById('inPointer').textContent = this.inPointer;
        document.getElementById('outPointer').textContent = this.outPointer;
        document.getElementById('itemCount').textContent = this.itemCount;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw title
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🏭 Producer-Consumer Problem', this.canvas.width / 2, 30);
        
        // Draw conveyor belt (buffer visualization)
        this.drawConveyorBelt();
        
        // Draw producers
        this.producers.forEach(producer => this.drawProducer(producer));
        
        // Draw consumers
        this.consumers.forEach(consumer => this.drawConsumer(consumer));
        
        // Draw buffer status
        this.drawBufferStatus();
        
        // Draw semaphore status
        this.drawSemaphoreStatus();
    }

    drawConveyorBelt() {
        const beltY = 250;
        const beltWidth = 600;
        const beltHeight = 60;
        const beltX = (this.canvas.width - beltWidth) / 2;
        
        // Draw belt background
        this.ctx.fillStyle = '#34495e';
        this.ctx.fillRect(beltX, beltY, beltWidth, beltHeight);
        
        // Draw belt slots
        const slotWidth = beltWidth / this.bufferSize;
        for (let i = 0; i < this.bufferSize; i++) {
            const x = beltX + (i * slotWidth);
            
            // Slot border
            this.ctx.strokeStyle = '#ecf0f1';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, beltY, slotWidth, beltHeight);
            
            // Draw item if exists
            if (this.buffer[i]) {
                this.ctx.fillStyle = this.buffer[i].color;
                this.ctx.fillRect(x + 5, beltY + 5, slotWidth - 10, beltHeight - 10);
                
                // Item ID
                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(this.buffer[i].id.toString(), x + slotWidth/2, beltY + beltHeight/2 + 5);
            }
            
            // Slot number
            this.ctx.fillStyle = '#bdc3c7';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(i.toString(), x + slotWidth/2, beltY + beltHeight + 15);
        }
        
        // Draw direction arrows
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('→', beltX + beltWidth + 10, beltY + beltHeight/2 + 5);
    }

    drawProducer(producer) {
        const stateColors = {
            idle: '#95a5a6',
            producing: '#3498db',
            waiting: '#f39c12',
            blocked: '#e74c3c'
        };
        
        // Producer circle
        this.ctx.fillStyle = stateColors[producer.state];
        this.ctx.beginPath();
        this.ctx.arc(producer.x, producer.y, 30, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Border
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Producer ID
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`P${producer.id}`, producer.x, producer.y + 5);
        
        // State label
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(producer.state.toUpperCase(), producer.x, producer.y + 50);
        
        // Current item being produced
        if (producer.currentItem) {
            this.ctx.fillStyle = producer.currentItem.color;
            this.ctx.beginPath();
            this.ctx.arc(producer.x + 25, producer.y - 25, 12, 0, 2 * Math.PI);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.fillText(producer.currentItem.id.toString(), producer.x + 25, producer.y - 21);
        }
        
        // Arrow to belt
        if (producer.state === 'producing' || producer.state === 'waiting') {
            this.drawArrow(producer.x, producer.y + 30, producer.x, 220, '#3498db');
        }
    }

    drawConsumer(consumer) {
        const stateColors = {
            idle: '#95a5a6',
            consuming: '#e74c3c',
            waiting: '#f39c12',
            blocked: '#e74c3c'
        };
        
        // Consumer circle
        this.ctx.fillStyle = stateColors[consumer.state];
        this.ctx.beginPath();
        this.ctx.arc(consumer.x, consumer.y, 30, 0, 2 * Math.PI);
        this.ctx.fill();
        
        // Border
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();
        
        // Consumer ID
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`C${consumer.id}`, consumer.x, consumer.y + 5);
        
        // State label
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(consumer.state.toUpperCase(), consumer.x, consumer.y + 50);
        
        // Current item being consumed
        if (consumer.currentItem) {
            this.ctx.fillStyle = consumer.currentItem.color;
            this.ctx.beginPath();
            this.ctx.arc(consumer.x + 25, consumer.y - 25, 12, 0, 2 * Math.PI);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.fillText(consumer.currentItem.id.toString(), consumer.x + 25, consumer.y - 21);
        }
        
        // Arrow from belt
        if (consumer.state === 'consuming' || consumer.state === 'waiting') {
            this.drawArrow(consumer.x, 340, consumer.x, consumer.y - 30, '#e74c3c');
        }
    }

    drawBufferStatus() {
        const x = 50;
        const y = 400;
        
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Buffer Status:', x, y);
        
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`Capacity: ${this.bufferSize}`, x, y + 20);
        this.ctx.fillText(`Items: ${this.itemCount}`, x, y + 35);
        this.ctx.fillText(`Empty: ${this.emptySlots}`, x, y + 50);
    }

    drawSemaphoreStatus() {
        const x = 650;
        const y = 400;
        
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Semaphores:', x, y);
        
        this.ctx.font = '12px Arial';
        this.ctx.fillText(`Empty Slots: ${this.emptySlots}`, x, y + 20);
        this.ctx.fillText(`Full Slots: ${this.fullSlots}`, x, y + 35);
        this.ctx.fillText(`Mutex: ${this.mutex ? 'Available' : 'Locked'}`, x, y + 50);
    }

    drawArrow(x1, y1, x2, y2, color) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
        
        // Arrowhead
        const angle = Math.atan2(y2 - y1, x2 - x1);
        this.ctx.setLineDash([]);
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(x2, y2);
        this.ctx.lineTo(x2 - 10 * Math.cos(angle - Math.PI/6), y2 - 10 * Math.sin(angle - Math.PI/6));
        this.ctx.lineTo(x2 - 10 * Math.cos(angle + Math.PI/6), y2 - 10 * Math.sin(angle + Math.PI/6));
        this.ctx.fill();
    }

    log(message) {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        this.logPanel.appendChild(logEntry);
        this.logPanel.scrollTop = this.logPanel.scrollHeight;
        
        // Keep only last 50 entries
        while (this.logPanel.children.length > 50) {
            this.logPanel.removeChild(this.logPanel.firstChild);
        }
    }
}

// Initialize the visualization when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new ProducerConsumer();
});