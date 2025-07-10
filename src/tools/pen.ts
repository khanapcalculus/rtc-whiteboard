import type { Line } from '../hooks/useWhiteboard';

export class PenTool {
    private static lastPosition: { x: number; y: number } | null = null;
    private static lastTime: number = 0;
    private static minTimeBetweenPoints: number = 16; // ~60fps
    private static minDistanceBetweenPoints: number = 2; // Minimum 2px between points
    
    static generateUniqueId(): string {
        return `line-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    static handleMouseDown(
        e: any, 
        stagePos: { x: number; y: number },
        color: string,
        strokeWidth: number
    ): Line | null {
        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();
        if (!pos) return null;

        const adjustedX = pos.x - stagePos.x;
        const adjustedY = pos.y - stagePos.y;

        this.lastPosition = { x: adjustedX, y: adjustedY };
        this.lastTime = Date.now();

        return {
            id: this.generateUniqueId(),
            tool: 'pen',
            points: [adjustedX, adjustedY],
            color,
            strokeWidth,
        };
    }

    static handleMouseMove(
        e: any, 
        currentLine: Line, 
        stagePos: { x: number; y: number }
    ): Line {
        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();
        if (!pos) return currentLine;

        const adjustedX = pos.x - stagePos.x;
        const adjustedY = pos.y - stagePos.y;
        
        // Time-based throttling
        const currentTime = Date.now();
        if (currentTime - this.lastTime < this.minTimeBetweenPoints) {
            return currentLine;
        }

        // Distance-based throttling
        if (this.lastPosition) {
            const dx = adjustedX - this.lastPosition.x;
            const dy = adjustedY - this.lastPosition.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.minDistanceBetweenPoints) {
                return currentLine;
            }
        }

        // Update last position and time
        this.lastPosition = { x: adjustedX, y: adjustedY };
        this.lastTime = currentTime;
        
        // Add new point
        const newPoints = [...currentLine.points, adjustedX, adjustedY];
        
        return {
            ...currentLine,
            points: newPoints
        };
    }

    static shouldSyncLine(line: Line): boolean {
        return line.points.length >= 4;
    }

    static reset(): void {
        this.lastPosition = null;
        this.lastTime = 0;
    }
} 