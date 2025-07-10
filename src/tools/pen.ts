import type { Line } from '../hooks/useWhiteboard';

export class PenTool {
    private static lastPosition: { x: number; y: number } | null = null;
    
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
} 