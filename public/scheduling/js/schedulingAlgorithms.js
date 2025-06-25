/*
 * CPU Scheduling Algorithms Implementation
 * Algorithm Visualizer
 * 
 * Copyright (c) 2025 Shubham Solanki
 * All rights reserved.
 * 
 * This file contains implementations of various CPU scheduling algorithms
 * including FCFS, SJF, SRTF, Round Robin, and Priority Scheduling.
 */

// CPU Scheduling Algorithms Implementation

class SchedulingAlgorithms {
    
    // First Come First Serve (FCFS)
    static fcfs(processes) {
        const result = [];
        const gantt = [];
        let currentTime = 0;

        // Sort by arrival time
        const sortedProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);

        for (const process of sortedProcesses) {
            const startTime = Math.max(currentTime, process.arrivalTime);
            const completionTime = startTime + process.burstTime;
            const turnaroundTime = completionTime - process.arrivalTime;
            const waitingTime = turnaroundTime - process.burstTime;
            const responseTime = startTime - process.arrivalTime;

            result.push({
                processId: process.processId,
                arrivalTime: process.arrivalTime,
                burstTime: process.burstTime,
                completionTime,
                turnaroundTime,
                waitingTime,
                responseTime
            });

            gantt.push({
                processId: process.processId,
                startTime,
                endTime: completionTime,
                duration: process.burstTime
            });

            currentTime = completionTime;
        }

        return { result, gantt };
    }

    // Shortest Job First (SJF) - Non-preemptive
    static sjf(processes) {
        const result = [];
        const gantt = [];
        const readyQueue = [];
        const remaining = [...processes];
        let currentTime = 0;
        let completed = 0;

        while (completed < processes.length) {
            // Add processes that have arrived to ready queue
            for (let i = remaining.length - 1; i >= 0; i--) {
                if (remaining[i].arrivalTime <= currentTime) {
                    readyQueue.push(remaining[i]);
                    remaining.splice(i, 1);
                }
            }

            if (readyQueue.length === 0) {
                // If no process is ready, jump to next arrival
                if (remaining.length > 0) {
                    currentTime = Math.min(...remaining.map(p => p.arrivalTime));
                }
                continue;
            }

            // Select process with shortest burst time
            readyQueue.sort((a, b) => a.burstTime - b.burstTime);
            const currentProcess = readyQueue.shift();

            const startTime = currentTime;
            const completionTime = startTime + currentProcess.burstTime;
            const turnaroundTime = completionTime - currentProcess.arrivalTime;
            const waitingTime = turnaroundTime - currentProcess.burstTime;
            const responseTime = startTime - currentProcess.arrivalTime;

            result.push({
                processId: currentProcess.processId,
                arrivalTime: currentProcess.arrivalTime,
                burstTime: currentProcess.burstTime,
                completionTime,
                turnaroundTime,
                waitingTime,
                responseTime
            });

            gantt.push({
                processId: currentProcess.processId,
                startTime,
                endTime: completionTime,
                duration: currentProcess.burstTime
            });

            currentTime = completionTime;
            completed++;
        }

        return { result, gantt };
    }

    // Shortest Remaining Time First (SRTF) - Preemptive SJF
    static srtf(processes) {
        const result = [];
        const gantt = [];
        const processInfo = processes.map(p => ({
            ...p,
            remainingTime: p.burstTime,
            completionTime: 0,
            startTime: -1
        }));

        let currentTime = 0;
        let completed = 0;
        let lastProcess = null;

        while (completed < processes.length) {
            // Find available processes
            const available = processInfo.filter(p => 
                p.arrivalTime <= currentTime && p.remainingTime > 0
            );

            if (available.length === 0) {
                // Jump to next arrival time
                const nextArrival = Math.min(...processInfo
                    .filter(p => p.remainingTime > 0)
                    .map(p => p.arrivalTime)
                );
                currentTime = nextArrival;
                continue;
            }

            // Select process with shortest remaining time
            const currentProcess = available.reduce((min, p) => 
                p.remainingTime < min.remainingTime ? p : min
            );

            // Record start time for response time calculation
            if (currentProcess.startTime === -1) {
                currentProcess.startTime = currentTime;
            }

            // If different process is running, update Gantt chart
            if (lastProcess !== currentProcess.processId) {
                if (gantt.length > 0 && gantt[gantt.length - 1].processId === lastProcess) {
                    gantt[gantt.length - 1].endTime = currentTime;
                    gantt[gantt.length - 1].duration = currentTime - gantt[gantt.length - 1].startTime;
                }
                
                gantt.push({
                    processId: currentProcess.processId,
                    startTime: currentTime,
                    endTime: currentTime + 1,
                    duration: 1
                });
                lastProcess = currentProcess.processId;
            } else if (gantt.length > 0) {
                gantt[gantt.length - 1].endTime = currentTime + 1;
                gantt[gantt.length - 1].duration++;
            }

            currentProcess.remainingTime--;
            currentTime++;

            if (currentProcess.remainingTime === 0) {
                currentProcess.completionTime = currentTime;
                completed++;
            }
        }

        // Calculate metrics
        for (const process of processInfo) {
            const turnaroundTime = process.completionTime - process.arrivalTime;
            const waitingTime = turnaroundTime - process.burstTime;
            const responseTime = process.startTime - process.arrivalTime;

            result.push({
                processId: process.processId,
                arrivalTime: process.arrivalTime,
                burstTime: process.burstTime,
                completionTime: process.completionTime,
                turnaroundTime,
                waitingTime,
                responseTime
            });
        }

        return { result, gantt };
    }

    // Round Robin (RR)
    static roundRobin(processes, timeQuantum) {
        const result = [];
        const gantt = [];
        const queue = [];
        const processInfo = processes.map(p => ({
            ...p,
            remainingTime: p.burstTime,
            completionTime: 0,
            startTime: -1
        }));

        let currentTime = 0;
        let completed = 0;
        
        // Add initial processes to queue
        const sortedProcesses = [...processInfo].sort((a, b) => a.arrivalTime - b.arrivalTime);
        let processIndex = 0;

        // Add first arrived process
        if (sortedProcesses.length > 0 && sortedProcesses[0].arrivalTime <= currentTime) {
            queue.push(sortedProcesses[processIndex++]);
        }

        while (completed < processes.length || queue.length > 0) {
            if (queue.length === 0) {
                // Jump to next arrival
                currentTime = sortedProcesses[processIndex].arrivalTime;
                queue.push(sortedProcesses[processIndex++]);
                continue;
            }

            const currentProcess = queue.shift();
            
            // Record start time for response time calculation
            if (currentProcess.startTime === -1) {
                currentProcess.startTime = currentTime;
            }

            const executionTime = Math.min(timeQuantum, currentProcess.remainingTime);
            const startTime = currentTime;
            currentTime += executionTime;
            currentProcess.remainingTime -= executionTime;

            gantt.push({
                processId: currentProcess.processId,
                startTime,
                endTime: currentTime,
                duration: executionTime
            });

            // Add newly arrived processes to queue
            while (processIndex < sortedProcesses.length && 
                   sortedProcesses[processIndex].arrivalTime <= currentTime) {
                queue.push(sortedProcesses[processIndex++]);
            }

            if (currentProcess.remainingTime === 0) {
                currentProcess.completionTime = currentTime;
                completed++;
            } else {
                queue.push(currentProcess);
            }
        }

        // Calculate metrics
        for (const process of processInfo) {
            const turnaroundTime = process.completionTime - process.arrivalTime;
            const waitingTime = turnaroundTime - process.burstTime;
            const responseTime = process.startTime - process.arrivalTime;

            result.push({
                processId: process.processId,
                arrivalTime: process.arrivalTime,
                burstTime: process.burstTime,
                completionTime: process.completionTime,
                turnaroundTime,
                waitingTime,
                responseTime
            });
        }

        return { result, gantt };
    }

    // Priority Scheduling (Non-preemptive)
    static priorityNonPreemptive(processes) {
        const result = [];
        const gantt = [];
        const readyQueue = [];
        const remaining = [...processes];
        let currentTime = 0;
        let completed = 0;

        while (completed < processes.length) {
            // Add processes that have arrived to ready queue
            for (let i = remaining.length - 1; i >= 0; i--) {
                if (remaining[i].arrivalTime <= currentTime) {
                    readyQueue.push(remaining[i]);
                    remaining.splice(i, 1);
                }
            }

            if (readyQueue.length === 0) {
                if (remaining.length > 0) {
                    currentTime = Math.min(...remaining.map(p => p.arrivalTime));
                }
                continue;
            }

            // Select process with highest priority (lower number = higher priority)
            readyQueue.sort((a, b) => a.priority - b.priority);
            const currentProcess = readyQueue.shift();

            const startTime = currentTime;
            const completionTime = startTime + currentProcess.burstTime;
            const turnaroundTime = completionTime - currentProcess.arrivalTime;
            const waitingTime = turnaroundTime - currentProcess.burstTime;
            const responseTime = startTime - currentProcess.arrivalTime;

            result.push({
                processId: currentProcess.processId,
                arrivalTime: currentProcess.arrivalTime,
                burstTime: currentProcess.burstTime,
                priority: currentProcess.priority,
                completionTime,
                turnaroundTime,
                waitingTime,
                responseTime
            });

            gantt.push({
                processId: currentProcess.processId,
                startTime,
                endTime: completionTime,
                duration: currentProcess.burstTime
            });

            currentTime = completionTime;
            completed++;
        }

        return { result, gantt };
    }

    // Priority Scheduling (Preemptive)
    static priorityPreemptive(processes) {
        const result = [];
        const gantt = [];
        const processInfo = processes.map(p => ({
            ...p,
            remainingTime: p.burstTime,
            completionTime: 0,
            startTime: -1
        }));

        let currentTime = 0;
        let completed = 0;
        let lastProcess = null;

        while (completed < processes.length) {
            // Find available processes
            const available = processInfo.filter(p => 
                p.arrivalTime <= currentTime && p.remainingTime > 0
            );

            if (available.length === 0) {
                const nextArrival = Math.min(...processInfo
                    .filter(p => p.remainingTime > 0)
                    .map(p => p.arrivalTime)
                );
                currentTime = nextArrival;
                continue;
            }

            // Select process with highest priority (lower number = higher priority)
            const currentProcess = available.reduce((min, p) => 
                p.priority < min.priority ? p : min
            );

            // Record start time for response time calculation
            if (currentProcess.startTime === -1) {
                currentProcess.startTime = currentTime;
            }

            // Update Gantt chart
            if (lastProcess !== currentProcess.processId) {
                if (gantt.length > 0 && gantt[gantt.length - 1].processId === lastProcess) {
                    gantt[gantt.length - 1].endTime = currentTime;
                    gantt[gantt.length - 1].duration = currentTime - gantt[gantt.length - 1].startTime;
                }
                
                gantt.push({
                    processId: currentProcess.processId,
                    startTime: currentTime,
                    endTime: currentTime + 1,
                    duration: 1
                });
                lastProcess = currentProcess.processId;
            } else if (gantt.length > 0) {
                gantt[gantt.length - 1].endTime = currentTime + 1;
                gantt[gantt.length - 1].duration++;
            }

            currentProcess.remainingTime--;
            currentTime++;

            if (currentProcess.remainingTime === 0) {
                currentProcess.completionTime = currentTime;
                completed++;
            }
        }

        // Calculate metrics
        for (const process of processInfo) {
            const turnaroundTime = process.completionTime - process.arrivalTime;
            const waitingTime = turnaroundTime - process.burstTime;
            const responseTime = process.startTime - process.arrivalTime;

            result.push({
                processId: process.processId,
                arrivalTime: process.arrivalTime,
                burstTime: process.burstTime,
                priority: process.priority,
                completionTime: process.completionTime,
                turnaroundTime,
                waitingTime,
                responseTime
            });
        }

        return { result, gantt };
    }

    // Calculate average metrics
    static calculateAverages(results) {
        const n = results.length;
        if (n === 0) return { avgWaiting: 0, avgTurnaround: 0, avgResponse: 0 };

        const avgWaiting = results.reduce((sum, p) => sum + p.waitingTime, 0) / n;
        const avgTurnaround = results.reduce((sum, p) => sum + p.turnaroundTime, 0) / n;
        const avgResponse = results.reduce((sum, p) => sum + p.responseTime, 0) / n;

        return {
            avgWaiting: Math.round(avgWaiting * 100) / 100,
            avgTurnaround: Math.round(avgTurnaround * 100) / 100,
            avgResponse: Math.round(avgResponse * 100) / 100
        };
    }

    // Calculate CPU utilization
    static calculateCpuUtilization(gantt) {
        if (gantt.length === 0) return 0;
        
        const totalTime = Math.max(...gantt.map(g => g.endTime));
        const busyTime = gantt.reduce((sum, g) => sum + g.duration, 0);
        
        return Math.round((busyTime / totalTime) * 10000) / 100; // Percentage with 2 decimal places
    }
} 