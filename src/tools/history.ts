import type { Line } from '../hooks/useWhiteboard';
import type { ImageItem } from './image';
import type { Shape } from './shapes';
import type { TextItem } from './text';

export interface WhiteboardState {
    lines: Line[];
    images: ImageItem[];
    shapes: Shape[];
    texts: TextItem[];
    timestamp: number;
}

export class HistoryManager {
    private history: WhiteboardState[] = [];
    private currentIndex: number = -1;
    private maxHistorySize: number = 50;

    constructor(maxHistorySize: number = 50) {
        this.maxHistorySize = maxHistorySize;
    }

    saveState(state: WhiteboardState): void {
        // Remove any states after current index (when undoing then making new changes)
        this.history = this.history.slice(0, this.currentIndex + 1);
        
        // Add new state
        this.history.push({
            ...state,
            timestamp: Date.now()
        });
        
        // Maintain max history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        } else {
            this.currentIndex++;
        }
    }

    undo(): WhiteboardState | null {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            return this.history[this.currentIndex];
        }
        return null;
    }

    redo(): WhiteboardState | null {
        if (this.currentIndex < this.history.length - 1) {
            this.currentIndex++;
            return this.history[this.currentIndex];
        }
        return null;
    }

    canUndo(): boolean {
        return this.currentIndex > 0;
    }

    canRedo(): boolean {
        return this.currentIndex < this.history.length - 1;
    }

    clear(): void {
        this.history = [];
        this.currentIndex = -1;
    }

    getCurrentState(): WhiteboardState | null {
        if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
            return this.history[this.currentIndex];
        }
        return null;
    }
} 