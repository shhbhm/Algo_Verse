/*
 * Main Application Logic for Scheduling Algorithms
 * Algorithm Visualizer
 * 
 * Copyright (c) 2025 Shubham Solanki
 * All rights reserved.
 * 
 * This file contains the main application logic and UI management
 * for the CPU scheduling algorithms section.
 */

class SchedulingApp {
    constructor() {
        this.processes = [];
        this.processCounter = 1;
        this.ganttChart = new GanttChart('ganttChart');
        this.currentResults = null;
        this.currentGantt = null;
        
        this.initializeEventListeners();
        this.updateUI();
    }

    initializeEventListeners() {
        // Algorithm selection change
        document.getElementById('algorithm').addEventListener('change', (e) => {
            this.handleAlgorithmChange(e.target.value);
        });

        // Add process button
        document.getElementById('addProcessBtn').addEventListener('click', () => {
            this.addProcess();
        });

        // Simulate button
        document.getElementById('simulateBtn').addEventListener('click', () => {
            this.simulate();
        });

        // Clear button
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearAll();
        });

        // Enter key support for input fields
        ['processId', 'arrivalTime', 'burstTime', 'priority', 'timeQuantum'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && id !== 'timeQuantum') {
                        this.addProcess();
                    }
                });
            }
        });
    }

    handleAlgorithmChange(algorithm) {
        const quantumSection = document.getElementById('quantumSection');
        const priorityInputs = document.querySelectorAll('.priority-input');
        const priorityColumns = document.querySelectorAll('.priority-column');

        // Show/hide time quantum input for Round Robin
        if (algorithm === 'rr') {
            quantumSection.style.display = 'block';
        } else {
            quantumSection.style.display = 'none';
        }

        // Show/hide priority inputs for priority algorithms
        const showPriority = algorithm === 'priority';
        priorityInputs.forEach(input => {
            input.style.display = showPriority ? 'block' : 'none';
        });
        priorityColumns.forEach(column => {
            column.style.display = showPriority ? 'table-cell' : 'none';
        });

        // Clear previous results
        this.clearResults();
    }

    addProcess() {
        const processId = document.getElementById('processId').value.trim() || `P${this.processCounter}`;
        const arrivalTime = parseInt(document.getElementById('arrivalTime').value) || 0;
        const burstTime = parseInt(document.getElementById('burstTime').value) || 1;
        const priority = parseInt(document.getElementById('priority').value) || 1;

        // Validate input
        if (burstTime <= 0) {
            alert('Burst time must be greater than 0');
            return;
        }

        if (arrivalTime < 0) {
            alert('Arrival time cannot be negative');
            return;
        }

        // Check for duplicate process IDs
        if (this.processes.some(p => p.processId === processId)) {
            alert('Process ID already exists. Please use a different ID.');
            return;
        }

        // Add process
        const process = {
            processId,
            arrivalTime,
            burstTime,
            priority
        };

        this.processes.push(process);
        this.processCounter++;

        // Update UI
        this.updateProcessTable();
        this.clearInputs();
        this.clearResults();
        
        // Auto-focus on process ID for next entry
        document.getElementById('processId').focus();
    }

    updateProcessTable() {
        const tableBody = document.querySelector('#processTable tbody');
        const algorithm = document.getElementById('algorithm').value;
        const showPriority = algorithm === 'priority';

        tableBody.innerHTML = '';

        this.processes.forEach((process, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${process.processId}</td>
                <td>${process.arrivalTime}</td>
                <td>${process.burstTime}</td>
                <td class="priority-column" style="display: ${showPriority ? 'table-cell' : 'none'}">${process.priority}</td>
                <td>
                    <button class="delete-btn" onclick="app.removeProcess(${index})">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    removeProcess(index) {
        this.processes.splice(index, 1);
        this.updateProcessTable();
        this.clearResults();
    }

    simulate() {
        if (this.processes.length === 0) {
            alert('Please add at least one process');
            return;
        }

        const algorithm = document.getElementById('algorithm').value;
        const timeQuantum = parseInt(document.getElementById('timeQuantum').value) || 2;

        let result;
        try {
            switch (algorithm) {
                case 'fcfs':
                    result = SchedulingAlgorithms.fcfs(this.processes);
                    break;
                case 'sjf':
                    result = SchedulingAlgorithms.sjf(this.processes);
                    break;
                case 'srtf':
                    result = SchedulingAlgorithms.srtf(this.processes);
                    break;
                case 'rr':
                    result = SchedulingAlgorithms.roundRobin(this.processes, timeQuantum);
                    break;
                case 'priority':
                    result = SchedulingAlgorithms.priorityNonPreemptive(this.processes);
                    break;
                default:
                    alert('Please select an algorithm');
                    return;
            }

            this.currentResults = result.result;
            this.currentGantt = result.gantt;

            // Update UI with results
            this.displayResults();
            this.ganttChart.render(this.currentGantt);

        } catch (error) {
            console.error('Simulation error:', error);
            alert('An error occurred during simulation. Please check your input data.');
        }
    }

    displayResults() {
        if (!this.currentResults) return;

        // Calculate averages
        const averages = SchedulingAlgorithms.calculateAverages(this.currentResults);
        const cpuUtilization = SchedulingAlgorithms.calculateCpuUtilization(this.currentGantt);

        // Update metric cards
        document.getElementById('avgWaitingTime').textContent = averages.avgWaiting.toFixed(2);
        document.getElementById('avgTurnaroundTime').textContent = averages.avgTurnaround.toFixed(2);
        document.getElementById('avgResponseTime').textContent = averages.avgResponse.toFixed(2);
        document.getElementById('cpuUtilization').textContent = cpuUtilization.toFixed(2) + '%';

        // Update results table
        const resultsTableBody = document.querySelector('#resultsTable tbody');
        resultsTableBody.innerHTML = '';

        this.currentResults.forEach(process => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${process.processId}</td>
                <td>${process.arrivalTime}</td>
                <td>${process.burstTime}</td>
                <td>${process.completionTime}</td>
                <td>${process.turnaroundTime}</td>
                <td>${process.waitingTime}</td>
                <td>${process.responseTime}</td>
            `;
            resultsTableBody.appendChild(row);
        });
    }

    clearResults() {
        // Clear metric cards
        document.getElementById('avgWaitingTime').textContent = '-';
        document.getElementById('avgTurnaroundTime').textContent = '-';
        document.getElementById('avgResponseTime').textContent = '-';
        document.getElementById('cpuUtilization').textContent = '-';

        // Clear results table
        document.querySelector('#resultsTable tbody').innerHTML = '';

        // Clear Gantt chart
        this.ganttChart.clear();

        this.currentResults = null;
        this.currentGantt = null;
    }

    clearInputs() {
        document.getElementById('processId').value = '';
        document.getElementById('arrivalTime').value = '0';
        document.getElementById('burstTime').value = '1';
        document.getElementById('priority').value = '1';
    }

    clearAll() {
        this.processes = [];
        this.processCounter = 1;
        this.updateProcessTable();
        this.clearInputs();
        this.clearResults();
    }

    updateUI() {
        this.updateProcessTable();
        this.handleAlgorithmChange(document.getElementById('algorithm').value);
    }

    // Add some sample processes for demonstration
    addSampleProcesses() {
        const sampleProcesses = [
            { processId: 'P1', arrivalTime: 0, burstTime: 5, priority: 3 },
            { processId: 'P2', arrivalTime: 1, burstTime: 3, priority: 1 },
            { processId: 'P3', arrivalTime: 2, burstTime: 8, priority: 4 },
            { processId: 'P4', arrivalTime: 3, burstTime: 6, priority: 2 }
        ];

        this.processes = sampleProcesses;
        this.processCounter = 5;
        this.updateProcessTable();
    }
}

// Initialize the application when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new SchedulingApp();
    
    // Add some sample data for demonstration (optional)
    // app.addSampleProcesses();
}); 