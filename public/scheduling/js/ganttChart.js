/*
 * Gantt Chart Visualization
 * Algorithm Visualizer
 * 
 * Copyright (c) 2025 Shubham Solanki
 * All rights reserved.
 * 
 * This file contains the Gantt chart implementation for visualizing
 * CPU scheduling algorithm execution timelines.
 */

// Gantt Chart Visualization

class GanttChart {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.processColors = [
            'process-color-1', 'process-color-2', 'process-color-3', 'process-color-4',
            'process-color-5', 'process-color-6', 'process-color-7', 'process-color-8'
        ];
        this.processColorMap = new Map();
    }

    render(ganttData) {
        if (!ganttData || ganttData.length === 0) {
            this.container.innerHTML = '<div style="text-align: center; color: #64748b; font-style: italic; padding: 40px;">No data to display. Add processes and simulate an algorithm.</div>';
            return;
        }

        this.container.innerHTML = '';
        this.assignColors(ganttData);

        // Calculate scale and dimensions
        const maxTime = Math.max(...ganttData.map(item => item.endTime));
        const containerWidth = this.container.offsetWidth || 800;
        const availableWidth = containerWidth - 100; // Leave space for labels
        const scale = Math.max(40, availableWidth / maxTime); // Minimum 40px per time unit

        // Create main chart container
        const chartContainer = document.createElement('div');
        chartContainer.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 20px;
            overflow-x: auto;
            min-height: 120px;
        `;

        // Create timeline with process blocks
        const timeline = document.createElement('div');
        timeline.style.cssText = `
            display: flex;
            align-items: center;
            height: 60px;
            margin-bottom: 20px;
            position: relative;
            min-width: ${maxTime * scale + 20}px;
        `;

        // Add process blocks to timeline
        ganttData.forEach((item, index) => {
            const block = document.createElement('div');
            const width = item.duration * scale;
            const left = item.startTime * scale;
            
            block.className = `gantt-process ${this.processColorMap.get(item.processId)}`;
            block.style.cssText = `
                position: absolute;
                left: ${left}px;
                width: ${width}px;
                height: 50px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 600;
                font-size: 14px;
                border-radius: 6px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                transition: all 0.3s ease;
                cursor: pointer;
                z-index: ${10 + index};
            `;
            
            // Add process ID text (only if block is wide enough)
            if (width > 30) {
                block.textContent = item.processId;
            }
            
            // Add tooltip
            block.title = `Process: ${item.processId}\nStart: ${item.startTime}\nEnd: ${item.endTime}\nDuration: ${item.duration}`;
            
            // Add hover effect
            block.addEventListener('mouseenter', () => {
                block.style.transform = 'translateY(-3px)';
                block.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.25)';
                block.style.zIndex = '100';
            });
            
            block.addEventListener('mouseleave', () => {
                block.style.transform = 'translateY(0)';
                block.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
                block.style.zIndex = `${10 + index}`;
            });
            
            timeline.appendChild(block);
        });

        // Create time axis
        const timeAxis = document.createElement('div');
        timeAxis.style.cssText = `
            display: flex;
            align-items: center;
            height: 30px;
            position: relative;
            min-width: ${maxTime * scale + 20}px;
            border-top: 2px solid #e2e8f0;
        `;

        // Add time labels
        for (let i = 0; i <= maxTime; i++) {
            const label = document.createElement('div');
            label.style.cssText = `
                position: absolute;
                left: ${i * scale - 10}px;
                width: 20px;
                text-align: center;
                font-size: 12px;
                color: #64748b;
                font-weight: 500;
            `;
            label.textContent = i;
            
            // Add tick mark
            const tick = document.createElement('div');
            tick.style.cssText = `
                position: absolute;
                left: ${i * scale}px;
                top: -2px;
                width: 1px;
                height: 8px;
                background: #94a3b8;
            `;
            
            timeAxis.appendChild(label);
            timeAxis.appendChild(tick);
        }

        // Add title
        const title = document.createElement('div');
        title.style.cssText = `
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 15px;
            font-size: 16px;
        `;
        title.textContent = 'Process Execution Timeline';

        // Assemble the chart
        chartContainer.appendChild(title);
        chartContainer.appendChild(timeline);
        chartContainer.appendChild(timeAxis);
        
        this.container.appendChild(chartContainer);

        // Add legend
        this.createLegend();

        // Add animation
        this.animateBlocks();
    }

    createLegend() {
        if (this.processColorMap.size === 0) return;

        const legend = document.createElement('div');
        legend.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-top: 20px;
            padding: 15px;
            background: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        `;

        const legendTitle = document.createElement('div');
        legendTitle.style.cssText = `
            width: 100%;
            font-weight: 600;
            color: #374151;
            margin-bottom: 10px;
            font-size: 14px;
        `;
        legendTitle.textContent = 'Process Legend:';
        legend.appendChild(legendTitle);

        this.processColorMap.forEach((colorClass, processId) => {
            const item = document.createElement('div');
            item.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 13px;
                color: #374151;
            `;

            const colorBox = document.createElement('div');
            colorBox.className = colorClass;
            colorBox.style.cssText = `
                width: 20px;
                height: 20px;
                border-radius: 4px;
                border: 1px solid rgba(255, 255, 255, 0.3);
            `;

            const label = document.createElement('span');
            label.textContent = processId;

            item.appendChild(colorBox);
            item.appendChild(label);
            legend.appendChild(item);
        });

        this.container.appendChild(legend);
    }

    assignColors(ganttData) {
        this.processColorMap.clear();
        const uniqueProcesses = [...new Set(ganttData.map(item => item.processId))];
        
        uniqueProcesses.forEach((processId, index) => {
            const colorClass = this.processColors[index % this.processColors.length];
            this.processColorMap.set(processId, colorClass);
        });
    }

    animateBlocks() {
        const blocks = this.container.querySelectorAll('.gantt-process');
        blocks.forEach((block, index) => {
            block.style.opacity = '0';
            block.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                block.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
                block.style.opacity = '1';
                block.style.transform = 'translateY(0)';
            }, index * 150);
        });
    }

    clear() {
        this.container.innerHTML = '<div style="text-align: center; color: #64748b; font-style: italic; padding: 40px;">No data to display. Add processes and simulate an algorithm.</div>';
        this.processColorMap.clear();
    }

    // Get legend for process colors
    getLegend() {
        const legend = [];
        this.processColorMap.forEach((colorClass, processId) => {
            legend.push({ processId, colorClass });
        });
        return legend;
    }
} 