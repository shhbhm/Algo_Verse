class SleepingBarberSimulator {
    constructor() {
        this.canvas = document.getElementById('barberCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // State variables
        this.isRunning = false;
        this.isPaused = false;
        this.timeElapsed = 0;
        this.customersServed = 0;
        this.customersLeft = 0;
        this.barberBusyTime = 0;
        this.totalWaitTime = 0;
        this.speed = 5;
        
        // Barber shop configuration
        this.waitingChairs = 5;
        this.arrivalRate = 'medium';
        this.waitingQueue = [];
        this.barberState = 'sleeping'; // 'sleeping', 'cutting', 'waiting'
        this.currentCustomer = null;
        this.customers = [];
        this.nextCustomerId = 1;
        
        // Animation variables
        this.animationFrame = null;
        this.lastTime = 0;
        this.customerGenerationTimer = 0;
        this.haircutTimer = 0;
        this.haircutDuration = 3000; // 3 seconds
        
        // Simulation timing
        this.simulationStartTime = 0;
        this.barberStartBusyTime = 0;
        
        this.initializeElements();
        this.setupEventListeners();
        this.updateWaitingRoomDisplay();
        this.draw();
    }

    initializeElements() {
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.stepBtn = document.getElementById('stepBtn');
        this.speedSlider = document.getElementById('speed');
        this.waitingChairsSelect = document.getElementById('waitingChairs');
        this.arrivalRateSelect = document.getElementById('arrivalRate');
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
        
        this.waitingChairsSelect.addEventListener('change', (e) => {
            if (!this.isRunning) {
                this.waitingChairs = parseInt(e.target.value);
                this.updateWaitingRoomDisplay();
                this.draw();
            }
        });
        
        this.arrivalRateSelect.addEventListener('change', (e) => {
            this.arrivalRate = e.target.value;
        });
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
        this.customersServed = 0;
        this.customersLeft = 0;
        this.barberBusyTime = 0;
        this.totalWaitTime = 0;
        this.waitingQueue = [];
        this.barberState = 'sleeping';
        this.currentCustomer = null;
        this.customers = [];
        this.nextCustomerId = 1;
        this.customerGenerationTimer = 0;
        this.haircutTimer = 0;
        this.simulationStartTime = 0;
        this.barberStartBusyTime = 0;
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        this.updateWaitingRoomDisplay();
        this.updateStatistics();
        this.updateBarberStatus();
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
        this.customerGenerationTimer += adjustedDelta;
        
        // Generate new customers based on arrival rate
        this.generateCustomers();
        
        // Update barber behavior
        this.updateBarber(adjustedDelta);
        
        // Update all customers
        this.updateCustomers(adjustedDelta);
        
        // Update statistics
        this.updateStatistics();
    }

    generateCustomers() {
        const rates = {
            'slow': { min: 3000, max: 5000 },
            'medium': { min: 1000, max: 3000 },
            'fast': { min: 500, max: 1500 },
            'very-fast': { min: 200, max: 800 }
        };
        
        const rate = rates[this.arrivalRate];
        const interval = Math.random() * (rate.max - rate.min) + rate.min;
        
        if (this.customerGenerationTimer >= interval) {
            this.customerGenerationTimer = 0;
            this.arriveCustomer();
        }
    }

    arriveCustomer() {
        const customer = {
            id: this.nextCustomerId++,
            arrivalTime: Date.now(),
            startWaitTime: Date.now(),
            x: 50,
            y: 250,
            targetX: 200,
            targetY: 250,
            state: 'entering' // 'entering', 'waiting', 'getting-haircut', 'leaving'
        };
        
        this.customers.push(customer);
        this.log(`👤 Customer ${customer.id} arrived at the shop`);
        
        // Check if barber is sleeping
        if (this.barberState === 'sleeping') {
            this.wakeUpBarber();
        }
        
        // Check if there's space in waiting room
        if (this.waitingQueue.length < this.waitingChairs) {
            this.waitingQueue.push(customer);
            customer.state = 'waiting';
            customer.targetX = 300 + (this.waitingQueue.length - 1) * 60;
            customer.targetY = 350;
            this.log(`🪑 Customer ${customer.id} took a seat in waiting room`);
        } else {
            // No space, customer leaves
            customer.state = 'leaving';
            customer.targetX = 50;
            this.customersLeft++;
            this.log(`🚪 Customer ${customer.id} left - waiting room full!`);
        }
        
        this.updateWaitingRoomDisplay();
    }

    wakeUpBarber() {
        if (this.barberState === 'sleeping') {
            this.barberState = 'waiting';
            this.barberStartBusyTime = Date.now();
            this.log('👨‍💼 Barber woke up!');
            this.updateBarberStatus();
        }
    }

    updateBarber(deltaTime) {
        if (this.barberState === 'cutting') {
            this.haircutTimer += deltaTime;
            
            if (this.haircutTimer >= this.haircutDuration) {
                // Finish haircut
                this.finishHaircut();
            }
        } else if (this.barberState === 'waiting' && this.waitingQueue.length > 0) {
            // Start cutting next customer
            this.startHaircut();
        } else if (this.barberState === 'waiting' && this.waitingQueue.length === 0) {
            // Go to sleep
            this.barberState = 'sleeping';
            if (this.barberStartBusyTime > 0) {
                this.barberBusyTime += Date.now() - this.barberStartBusyTime;
                this.barberStartBusyTime = 0;
            }
            this.log('💤 Barber went to sleep');
            this.updateBarberStatus();
        }
    }

    startHaircut() {
        if (this.waitingQueue.length > 0) {
            const customer = this.waitingQueue.shift();
            this.currentCustomer = customer;
            customer.state = 'getting-haircut';
            customer.targetX = 500;
            customer.targetY = 200;
            
            // Calculate wait time
            const waitTime = Date.now() - customer.startWaitTime;
            this.totalWaitTime += waitTime;
            
            this.barberState = 'cutting';
            this.haircutTimer = 0;
            this.log(`✂️ Barber started cutting Customer ${customer.id}'s hair`);
            this.updateBarberStatus();
            this.updateWaitingRoomDisplay();
        }
    }

    finishHaircut() {
        if (this.currentCustomer) {
            const customer = this.currentCustomer;
            customer.state = 'leaving';
            customer.targetX = 750;
            
            this.customersServed++;
            this.log(`✅ Customer ${customer.id} got haircut and left happy!`);
            
            this.currentCustomer = null;
            this.barberState = 'waiting';
            this.haircutTimer = 0;
            this.updateBarberStatus();
        }
    }

    updateCustomers(deltaTime) {
        this.customers = this.customers.filter(customer => {
            // Move customer towards target
            const dx = customer.targetX - customer.x;
            const dy = customer.targetY - customer.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 5) {
                const speed = 100; // pixels per second
                const moveDistance = speed * deltaTime / 1000;
                customer.x += (dx / distance) * moveDistance;
                customer.y += (dy / distance) * moveDistance;
            } else {
                customer.x = customer.targetX;
                customer.y = customer.targetY;
            }
            
            // Remove customers who have left
            if (customer.state === 'leaving' && customer.x <= 50) {
                return false;
            }
            if (customer.state === 'leaving' && customer.x >= 750) {
                return false;
            }
            
            return true;
        });
    }

    updateWaitingRoomDisplay() {
        const waitingRoomDiv = document.getElementById('waitingRoomDisplay');
        const occupiedChairsSpan = document.getElementById('occupiedChairs');
        const totalChairsSpan = document.getElementById('totalChairs');
        const currentQueueSpan = document.getElementById('currentQueue');
        
        let html = '';
        for (let i = 0; i < this.waitingChairs; i++) {
            const isOccupied = i < this.waitingQueue.length;
            const chairClass = isOccupied ? 'chair-occupied' : 'chair-empty';
            const chairContent = isOccupied ? this.waitingQueue[i].id : '🪑';
            html += `<div class="waiting-chair ${chairClass}">${chairContent}</div>`;
        }
        
        waitingRoomDiv.innerHTML = html;
        occupiedChairsSpan.textContent = this.waitingQueue.length;
        totalChairsSpan.textContent = this.waitingChairs;
        currentQueueSpan.textContent = this.waitingQueue.length;
    }

    updateBarberStatus() {
        const barberStatusDiv = document.getElementById('barberStatus');
        
        let statusText, statusClass, statusIcon;
        switch (this.barberState) {
            case 'sleeping':
                statusText = 'SLEEPING';
                statusClass = 'sleeping';
                statusIcon = '💤';
                break;
            case 'cutting':
                statusText = 'CUTTING HAIR';
                statusClass = 'cutting';
                statusIcon = '✂️';
                break;
            case 'waiting':
                statusText = 'WAITING';
                statusClass = 'cutting';
                statusIcon = '👨‍💼';
                break;
        }
        
        barberStatusDiv.className = `barber-status ${statusClass}`;
        barberStatusDiv.innerHTML = `<span>${statusIcon} Barber</span><span>${statusText}</span>`;
    }

    updateStatistics() {
        const runningTimeSpan = document.getElementById('runningTime');
        const customersServedSpan = document.getElementById('customersServed');
        const customersLeftSpan = document.getElementById('customersLeft');
        const barberBusyTimeSpan = document.getElementById('barberBusyTime');
        const avgWaitTimeSpan = document.getElementById('avgWaitTime');
        
        const totalTime = this.simulationStartTime > 0 ? Date.now() - this.simulationStartTime : 0;
        let totalBusyTime = this.barberBusyTime;
        if (this.barberStartBusyTime > 0) {
            totalBusyTime += Date.now() - this.barberStartBusyTime;
        }
        
        runningTimeSpan.textContent = `${Math.floor(totalTime / 1000)}s`;
        customersServedSpan.textContent = this.customersServed;
        customersLeftSpan.textContent = this.customersLeft;
        
        const busyPercentage = totalTime > 0 ? Math.round((totalBusyTime / totalTime) * 100) : 0;
        barberBusyTimeSpan.textContent = `${busyPercentage}%`;
        
        const avgWait = this.customersServed > 0 ? this.totalWaitTime / this.customersServed : 0;
        avgWaitTimeSpan.textContent = `${Math.floor(avgWait / 1000)}s`;
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.drawBackground();
        
        // Draw barber shop layout
        this.drawBarberShop();
        
        // Draw customers
        this.drawCustomers();
        
        // Draw barber
        this.drawBarber();
    }

    drawBackground() {
        // Shop floor
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Walls
        this.ctx.strokeStyle = '#2c3e50';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(10, 10, this.canvas.width - 20, this.canvas.height - 20);
    }

    drawBarberShop() {
        const ctx = this.ctx;
        
        // Barber chair
        ctx.fillStyle = '#8e44ad';
        ctx.fillRect(470, 180, 60, 60);
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.fillText('💺', 485, 215);
        
        // Waiting chairs
        for (let i = 0; i < this.waitingChairs; i++) {
            const x = 270 + i * 60;
            const y = 330;
            
            ctx.fillStyle = '#3498db';
            ctx.fillRect(x, y, 40, 40);
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px Arial';
            ctx.fillText('🪑', x + 8, y + 28);
        }
        
        // Labels
        ctx.fillStyle = '#2c3e50';
        ctx.font = '14px Arial';
        ctx.fillText('Barber Chair', 450, 170);
        ctx.fillText('Waiting Area', 350, 320);
        ctx.fillText('Entrance', 30, 270);
        ctx.fillText('Exit', 650, 270);
        
        // Door markers
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(20, 240, 30, 60);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(650, 240, 30, 60);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Arial';
        ctx.fillText('🚪', 25, 275);
        ctx.fillText('🚪', 655, 275);
    }

    drawCustomers() {
        const ctx = this.ctx;
        
        this.customers.forEach(customer => {
            ctx.save();
            
            // Customer appearance based on state
            switch (customer.state) {
                case 'entering':
                    ctx.fillStyle = '#3498db';
                    break;
                case 'waiting':
                    ctx.fillStyle = '#f39c12';
                    break;
                case 'getting-haircut':
                    ctx.fillStyle = '#27ae60';
                    break;
                case 'leaving':
                    ctx.fillStyle = '#95a5a6';
                    break;
            }
            
            // Draw customer circle
            ctx.beginPath();
            ctx.arc(customer.x, customer.y, 15, 0, 2 * Math.PI);
            ctx.fill();
            
            // Draw customer ID
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(customer.id, customer.x, customer.y + 4);
            
            ctx.restore();
        });
    }

    drawBarber() {
        const ctx = this.ctx;
        const barberX = 500;
        const barberY = 150;
        
        // Barber appearance based on state
        switch (this.barberState) {
            case 'sleeping':
                ctx.fillStyle = '#3498db';
                break;
            case 'cutting':
                ctx.fillStyle = '#27ae60';
                break;
            case 'waiting':
                ctx.fillStyle = '#f39c12';
                break;
        }
        
        // Draw barber
        ctx.beginPath();
        ctx.arc(barberX, barberY, 20, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw barber icon
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        
        let icon;
        switch (this.barberState) {
            case 'sleeping': icon = '💤'; break;
            case 'cutting': icon = '✂️'; break;
            case 'waiting': icon = '👨‍💼'; break;
        }
        
        ctx.fillText(icon, barberX, barberY + 5);
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
    new SleepingBarberSimulator();
}); 