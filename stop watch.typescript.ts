/**
 * Stopwatch Application - TypeScript Version
 * Complete working stopwatch with lap functionality
 */

// Type definitions
interface StopwatchState {
    startTime: number;
    elapsedTime: number;
    running: boolean;
    timerInterval: NodeJS.Timeout | null;
    lapCount: number;
    lastLapTime: number;
}

// DOM Element interfaces
interface StopwatchElements {
    display: HTMLElement;
    startBtn: HTMLButtonElement;
    stopBtn: HTMLButtonElement;
    resetBtn: HTMLButtonElement;
    lapBtn: HTMLButtonElement;
    lapList: HTMLElement;
}

class Stopwatch {
    private elements: StopwatchElements;
    private state: StopwatchState;
    private readonly UPDATE_INTERVAL: number = 10; // Update every 10ms

    constructor() {
        // Initialize DOM elements
        this.elements = {
            display: document.getElementById('display') as HTMLElement,
            startBtn: document.getElementById('startBtn') as HTMLButtonElement,
            stopBtn: document.getElementById('stopBtn') as HTMLButtonElement,
            resetBtn: document.getElementById('resetBtn') as HTMLButtonElement,
            lapBtn: document.getElementById('lapBtn') as HTMLButtonElement,
            lapList: document.getElementById('lapList') as HTMLElement
        };

        // Initialize state
        this.state = {
            startTime: 0,
            elapsedTime: 0,
            running: false,
            timerInterval: null,
            lapCount: 0,
            lastLapTime: 0
        };

        // Initialize the application
        this.init();
    }

    /**
     * Format time for main display (with HTML for milliseconds)
     */
    private formatTime(ms: number): string {
        if (ms < 0) ms = 0;
        
        const hours: number = Math.floor(ms / 3600000);
        const minutes: number = Math.floor((ms % 3600000) / 60000);
        const seconds: number = Math.floor((ms % 60000) / 1000);
        const centiseconds: number = Math.floor((ms % 1000) / 10);

        const pad = (n: number): string => String(n).padStart(2, '0');
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}<span class="milliseconds">.${String(centiseconds).padStart(2, '0')}</span>`;
    }

    /**
     * Format time for lap display (plain text)
     */
    private formatLapTime(ms: number): string {
        if (ms < 0) ms = 0;
        
        const hours: number = Math.floor(ms / 3600000);
        const minutes: number = Math.floor((ms % 3600000) / 60000);
        const seconds: number = Math.floor((ms % 60000) / 1000);
        const centiseconds: number = Math.floor((ms % 1000) / 10);

        const pad = (n: number): string => String(n).padStart(2, '0');
        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${String(centiseconds).padStart(2, '0')}`;
    }

    /**
     * Get current elapsed time
     */
    private getCurrentTime(): number {
        if (this.state.running) {
            return this.state.elapsedTime + (Date.now() - this.state.startTime);
        }
        return this.state.elapsedTime;
    }

    /**
     * Update the display with current time
     */
    private updateDisplay(): void {
        this.elements.display.innerHTML = this.formatTime(this.getCurrentTime());
    }

    /**
     * Main timer loop
     */
    private timerLoop(): void {
        this.updateDisplay();
    }

    /**
     * Start the stopwatch
     */
    private startStopwatch = (): void => {
        if (this.state.running) return;
        
        this.state.startTime = Date.now();
        this.state.running = true;
        
        // Update button states
        this.elements.startBtn.disabled = true;
        this.elements.stopBtn.disabled = false;
        this.elements.lapBtn.disabled = false;
        
        // Clear any existing interval
        if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
        }
        
        // Start the timer
        this.state.timerInterval = setInterval(() => this.timerLoop(), this.UPDATE_INTERVAL);
        this.updateDisplay();
    }

    /**
     * Stop/pause the stopwatch
     */
    private stopStopwatch = (): void => {
        if (!this.state.running) return;
        
        // Add the elapsed time since last start
        this.state.elapsedTime += Date.now() - this.state.startTime;
        this.state.running = false;
        
        // Clear interval
        if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
            this.state.timerInterval = null;
        }
        
        // Update button states
        this.elements.startBtn.disabled = false;
        this.elements.stopBtn.disabled = true;
        this.elements.lapBtn.disabled = true;
        
        this.updateDisplay();
    }

    /**
     * Reset the stopwatch
     */
    private resetStopwatch = (): void => {
        // Stop if running
        if (this.state.running) {
            this.state.running = false;
            if (this.state.timerInterval) {
                clearInterval(this.state.timerInterval);
                this.state.timerInterval = null;
            }
        }
        
        // Reset all values
        this.state.startTime = 0;
        this.state.elapsedTime = 0;
        this.state.lastLapTime = 0;
        this.state.lapCount = 0;
        
        // Clear laps from storage
        localStorage.removeItem('stopwatch_laps');
        
        // Update UI
        this.updateDisplay();
        this.renderLaps();
        
        // Update button states
        this.elements.startBtn.disabled = false;
        this.elements.stopBtn.disabled = true;
        this.elements.lapBtn.disabled = true;
    }

    /**
     * Record a lap
     */
    private recordLap = (): void => {
        if (!this.state.running) {
            alert('Start the stopwatch first!');
            return;
        }
        
        // Get current total time
        const currentTime: number = this.getCurrentTime();
        
        // Calculate lap time (difference from last lap)
        let lapTime: number;
        if (this.state.lastLapTime === 0) {
            // First lap - time from start
            lapTime = currentTime;
        } else {
            // Subsequent laps - time since last lap
            lapTime = currentTime - this.state.lastLapTime;
        }
        
        // Format lap time
        const formattedLapTime: string = this.formatLapTime(lapTime);
        
        // Get existing laps from localStorage
        let laps: string[] = [];
        try {
            const stored: string | null = localStorage.getItem('stopwatch_laps');
            if (stored) {
                laps = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Error reading laps:', e);
        }
        
        // Add new lap
        laps.push(formattedLapTime);
        
        // Save to localStorage
        try {
            localStorage.setItem('stopwatch_laps', JSON.stringify(laps));
        } catch (e) {
            console.error('Error saving laps:', e);
        }
        
        // Update last lap time
        this.state.lastLapTime = currentTime;
        this.state.lapCount++;
        
        // Render laps
        this.renderLaps();
    }

    /**
     * Render laps from localStorage
     */
    private renderLaps(): void {
        let laps: string[] = [];
        try {
            const stored: string | null = localStorage.getItem('stopwatch_laps');
            if (stored) {
                laps = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Error reading laps:', e);
        }
        
        this.elements.lapList.innerHTML = '';
        
        if (!laps || laps.length === 0) {
            this.elements.lapList.innerHTML = '<li class="empty-lap">— no laps recorded —</li>';
            return;
        }
        
        // Display laps in reverse order (newest first)
        for (let i = laps.length - 1; i >= 0; i--) {
            const li: HTMLLIElement = document.createElement('li');
            li.className = 'lap-item';
            
            const numberSpan: HTMLSpanElement = document.createElement('span');
            numberSpan.className = 'lap-number';
            numberSpan.textContent = `Lap ${i + 1}`;
            
            const timeSpan: HTMLSpanElement = document.createElement('span');
            timeSpan.className = 'lap-time';
            timeSpan.textContent = laps[i];
            
            li.appendChild(numberSpan);
            li.appendChild(timeSpan);
            this.elements.lapList.appendChild(li);
        }
    }

    /**
     * Initialize the stopwatch
     */
    private init(): void {
        // Check if there are saved laps
        let laps: string[] = [];
        try {
            const stored: string | null = localStorage.getItem('stopwatch_laps');
            if (stored) {
                laps = JSON.parse(stored);
            }
        } catch (e) {
            console.error('Error reading laps:', e);
        }
        
        // Render laps if any exist
        if (laps && laps.length > 0) {
            this.renderLaps();
        }
        
        // Reset timer display
        this.state.elapsedTime = 0;
        this.state.lastLapTime = 0;
        this.updateDisplay();
        
        // Set button states
        this.elements.startBtn.disabled = false;
        this.elements.stopBtn.disabled = true;
        this.elements.lapBtn.disabled = true;
        
        // Attach event listeners
        this.elements.startBtn.addEventListener('click', this.startStopwatch);
        this.elements.stopBtn.addEventListener('click', this.stopStopwatch);
        this.elements.resetBtn.addEventListener('click', this.resetStopwatch);
        this.elements.lapBtn.addEventListener('click', this.recordLap);
    }
}

// Initialize the stopwatch when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new Stopwatch();
});