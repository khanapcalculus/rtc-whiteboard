import type { Line } from '../hooks/useWhiteboard';

// Advanced smoothing using quadratic Bezier curves for better rapid drawing
const smoothPointsAdvanced = (points: number[]): number[] => {
    if (points.length < 6) return points; // Need at least 3 points for smoothing
    
    const smoothed: number[] = [];
    
    // Add first point
    smoothed.push(points[0], points[1]);
    
    // Process points using quadratic Bezier curves
    for (let i = 2; i < points.length - 2; i += 2) {
        const prevX = points[i - 2], prevY = points[i - 1];
        const currX = points[i], currY = points[i + 1];
        const nextX = points[i + 2], nextY = points[i + 3];
        
        // Calculate control points using weighted average
        const controlX1 = prevX + (currX - prevX) * 0.6;
        const controlY1 = prevY + (currY - prevY) * 0.6;
        const controlX2 = currX + (nextX - currX) * 0.4;
        const controlY2 = currY + (nextY - currY) * 0.4;
        
        // Create smooth curve using cubic Bezier
        const steps = 8; // More steps for smoother curves
        for (let t = 0; t <= steps; t++) {
            const u = t / steps;
            const u2 = u * u;
            const u3 = u2 * u;
            const oneMinusU = 1 - u;
            const oneMinusU2 = oneMinusU * oneMinusU;
            const oneMinusU3 = oneMinusU2 * oneMinusU;
            
            // Cubic Bezier formula
            const x = oneMinusU3 * prevX + 
                     3 * oneMinusU2 * u * controlX1 + 
                     3 * oneMinusU * u2 * controlX2 + 
                     u3 * currX;
            const y = oneMinusU3 * prevY + 
                     3 * oneMinusU2 * u * controlY1 + 
                     3 * oneMinusU * u2 * controlY2 + 
                     u3 * currY;
            
            smoothed.push(x, y);
        }
    }
    
    // Add last point
    smoothed.push(points[points.length - 2], points[points.length - 1]);
    
    return smoothed;
};

// Optimize points by removing points that are too close together
const optimizePoints = (points: number[], minDistance: number = 2): number[] => {
    if (points.length < 4) return points;
    
    const optimized = [points[0], points[1]]; // Always keep first point
    let lastAddedX = points[0];
    let lastAddedY = points[1];
    
    for (let i = 2; i < points.length; i += 2) {
        const currX = points[i];
        const currY = points[i + 1];
        
        const distance = Math.sqrt(
            Math.pow(currX - lastAddedX, 2) + Math.pow(currY - lastAddedY, 2)
        );
        
        if (distance >= minDistance) {
            optimized.push(currX, currY);
            lastAddedX = currX;
            lastAddedY = currY;
        }
    }
    
    // Always keep the last point
    const lastX = points[points.length - 2];
    const lastY = points[points.length - 1];
    if (lastX !== lastAddedX || lastY !== lastAddedY) {
        optimized.push(lastX, lastY);
    }
    
    return optimized;
};

// Interpolate points between distant mouse positions with adaptive density
const interpolatePoints = (points: number[], maxDistance: number = 8): number[] => {
    if (points.length < 4) return points;
    
    const interpolated = [points[0], points[1]];
    
    for (let i = 2; i < points.length; i += 2) {
        const prevX = interpolated[interpolated.length - 2];
        const prevY = interpolated[interpolated.length - 1];
        const currX = points[i];
        const currY = points[i + 1];
        
        const distance = Math.sqrt(
            Math.pow(currX - prevX, 2) + Math.pow(currY - prevY, 2)
        );
        
        if (distance > maxDistance) {
            // Add more interpolated points for longer distances
            const steps = Math.ceil(distance / maxDistance);
            for (let step = 1; step <= steps; step++) {
                const t = step / steps;
                // Use cubic easing for smoother transitions
                const tt = t * t;
                const ttt = tt * t;
                const u = 3 * tt - 2 * ttt; // Cubic easing
                const x = prevX + (currX - prevX) * u;
                const y = prevY + (currY - prevY) * u;
                interpolated.push(x, y);
            }
        } else {
            interpolated.push(currX, currY);
        }
    }
    
    return interpolated;
};

export class PenTool {
    private static lastTimestamp: number = 0;
    private static lastPosition: { x: number; y: number } | null = null;
    private static velocityHistory: number[] = [];
    private static readonly VELOCITY_HISTORY_SIZE = 5;
    private static readonly MIN_VELOCITY = 0.1;
    private static readonly MAX_VELOCITY = 10;
    
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

        // Reset tracking variables
        this.lastTimestamp = Date.now();
        this.lastPosition = { x: adjustedX, y: adjustedY };
        this.velocityHistory = [];

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
        
        // Calculate velocity
        const timestamp = Date.now();
        const timeDelta = timestamp - this.lastTimestamp;
        let velocity = 0;
        
        if (this.lastPosition) {
            const distance = Math.sqrt(
                Math.pow(adjustedX - this.lastPosition.x, 2) + 
                Math.pow(adjustedY - this.lastPosition.y, 2)
            );
            velocity = distance / Math.max(timeDelta, 1);
            
            // Update velocity history
            this.velocityHistory.push(velocity);
            if (this.velocityHistory.length > this.VELOCITY_HISTORY_SIZE) {
                this.velocityHistory.shift();
            }
        }
        
        // Update tracking variables
        this.lastTimestamp = timestamp;
        this.lastPosition = { x: adjustedX, y: adjustedY };
        
        // Add new point
        const newPoints = [...currentLine.points, adjustedX, adjustedY];
        
        // Apply smoothing based on velocity
        const avgVelocity = this.velocityHistory.reduce((a, b) => a + b, 0) / 
                           Math.max(this.velocityHistory.length, 1);
        const normalizedVelocity = Math.min(Math.max(avgVelocity, this.MIN_VELOCITY), this.MAX_VELOCITY);
        const smoothingSteps = Math.max(4, Math.floor(12 - normalizedVelocity));
        
        // Process points
        let processedPoints = interpolatePoints(newPoints, 8);
        processedPoints = optimizePoints(processedPoints, 2);
        processedPoints = smoothPointsAdvanced(processedPoints);
        
        return {
            ...currentLine,
            points: processedPoints
        };
    }

    static shouldSyncLine(line: Line): boolean {
        return line.points.length >= 4;
    }
} 