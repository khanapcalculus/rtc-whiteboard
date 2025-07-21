import type { Line } from '../hooks/useWhiteboard';

// Advanced fluid smoothing using cubic Bezier curves
const smoothPointsFluid = (points: number[]): number[] => {
    if (points.length < 8) return points; // Need at least 4 points for cubic Bezier
    
    const smoothed: number[] = [];
    
    // Add first two points
    smoothed.push(points[0], points[1], points[2], points[3]);
    
    // Process points using cubic Bezier curves for fluid motion
    for (let i = 4; i < points.length - 4; i += 2) {
        const p0x = points[i - 4], p0y = points[i - 3];
        const p1x = points[i - 2], p1y = points[i - 1];
        const p2x = points[i], p2y = points[i + 1];
        const p3x = points[i + 2], p3y = points[i + 3];
        const p4x = points[i + 4], p4y = points[i + 5];
        
        // Calculate control points for fluid motion
        const cp1x = p1x + (p2x - p0x) * 0.25;
        const cp1y = p1y + (p2y - p0y) * 0.25;
        const cp2x = p2x - (p4x - p1x) * 0.25;
        const cp2y = p2y - (p4y - p1y) * 0.25;
        
        // Create smooth curve using cubic Bezier with more steps
        const steps = 8; // More steps for ultra-smooth curves
        for (let t = 0; t <= steps; t++) {
            const u = t / steps;
            const u2 = u * u;
            const u3 = u2 * u;
            const oneMinusU = 1 - u;
            const oneMinusU2 = oneMinusU * oneMinusU;
            const oneMinusU3 = oneMinusU2 * oneMinusU;
            
            // Cubic Bezier formula: (1-t)³P0 + 3(1-t)²tP1 + 3(1-t)t²P2 + t³P3
            const x = oneMinusU3 * p1x + 3 * oneMinusU2 * u * cp1x + 3 * oneMinusU * u2 * cp2x + u3 * p2x;
            const y = oneMinusU3 * p1y + 3 * oneMinusU2 * u * cp1y + 3 * oneMinusU * u2 * cp2y + u3 * p2y;
            
            smoothed.push(x, y);
        }
    }
    
    // Add last two points
    smoothed.push(points[points.length - 4], points[points.length - 3], points[points.length - 2], points[points.length - 1]);
    
    return smoothed;
};

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
        
        // Calculate control point as the midpoint between current and next
        const controlX = (currX + nextX) / 2;
        const controlY = (currY + nextY) / 2;
        
        // Create smooth curve using quadratic Bezier
        const steps = 6; // More steps for smoother curves
        for (let t = 0; t <= steps; t++) {
            const u = t / steps;
            const u2 = u * u;
            const oneMinusU = 1 - u;
            const oneMinusU2 = oneMinusU * oneMinusU;
            
            // Quadratic Bezier formula: (1-t)²P0 + 2(1-t)tP1 + t²P2
            const x = oneMinusU2 * prevX + 2 * oneMinusU * u * controlX + u2 * currX;
            const y = oneMinusU2 * prevY + 2 * oneMinusU * u * controlY + u2 * currY;
            
            smoothed.push(x, y);
        }
    }
    
    // Add last point
    smoothed.push(points[points.length - 2], points[points.length - 1]);
    
    return smoothed;
};

// Smooth points using Catmull-Rom spline interpolation
const smoothPoints = (points: number[], tension: number = 0.5): number[] => {
    if (points.length < 6) return points; // Need at least 3 points for smoothing
    
    const smoothed: number[] = [];
    
    // Add first point
    smoothed.push(points[0], points[1]);
    
    // Process points in groups of 4 for Catmull-Rom spline
    for (let i = 2; i < points.length - 2; i += 2) {
        const p0x = points[i - 2], p0y = points[i - 1];
        const p1x = points[i], p1y = points[i + 1];
        const p2x = points[i + 2], p2y = points[i + 3];
        const p3x = points[i + 4] || p2x, p3y = points[i + 5] || p2y;
        
        // Add interpolated points between p1 and p2
        const steps = 5; // More steps for smoother curves
        for (let t = 0; t <= steps; t++) {
            const u = t / steps;
            const u2 = u * u;
            const u3 = u2 * u;
            
            // Catmull-Rom spline formula
            const x = 0.5 * (
                2 * p1x +
                (-p0x + p2x) * u +
                (2 * p0x - 5 * p1x + 4 * p2x - p3x) * u2 +
                (-p0x + 3 * p1x - 3 * p2x + p3x) * u3
            );
            
            const y = 0.5 * (
                2 * p1y +
                (-p0y + p2y) * u +
                (2 * p0y - 5 * p1y + 4 * p2y - p3y) * u2 +
                (-p0y + 3 * p1y - 3 * p2y + p3y) * u3
            );
            
            smoothed.push(x, y);
        }
    }
    
    // Add last point
    smoothed.push(points[points.length - 2], points[points.length - 1]);
    
    return smoothed;
};

// Optimize points by removing points that are too close together
const optimizePoints = (points: number[], minDistance: number = 1.0): number[] => {
    if (points.length < 4) return points;
    
    const optimized = [points[0], points[1]]; // Always keep first point
    
    for (let i = 2; i < points.length; i += 2) {
        const prevX = optimized[optimized.length - 2];
        const prevY = optimized[optimized.length - 1];
        const currX = points[i];
        const currY = points[i + 1];
        
        const distance = Math.sqrt(
            Math.pow(currX - prevX, 2) + Math.pow(currY - prevY, 2)
        );
        
        if (distance >= minDistance) {
            optimized.push(currX, currY);
        }
    }
    
    // Always keep the last point if it's different from the last added
    const lastX = points[points.length - 2];
    const lastY = points[points.length - 1];
    const lastOptX = optimized[optimized.length - 2];
    const lastOptY = optimized[optimized.length - 1];
    
    if (lastX !== lastOptX || lastY !== lastOptY) {
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
                const x = prevX + (currX - prevX) * t;
                const y = prevY + (currY - prevY) * t;
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
    
    static generateUniqueId(): string {
        const sessionId = Math.random().toString(36).substr(2, 9);
        const timestamp = Date.now();
        const counter = Math.floor(Math.random() * 1000);
        return `line-${sessionId}-${timestamp}-${counter}`;
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
        const point = stage.getPointerPosition();
        if (!point) return currentLine;

        const adjustedX = point.x - stagePos.x;
        const adjustedY = point.y - stagePos.y;
        
        // Calculate speed for velocity-based smoothing
        const currentTime = Date.now();
        const timeDelta = currentTime - this.lastTimestamp;
        
        let velocity = 0;
        if (this.lastPosition && timeDelta > 0) {
            const distance = Math.sqrt(
                Math.pow(adjustedX - this.lastPosition.x, 2) + 
                Math.pow(adjustedY - this.lastPosition.y, 2)
            );
            velocity = distance / timeDelta;
            
            // Keep velocity history for smoothing decisions
            this.velocityHistory.push(velocity);
            if (this.velocityHistory.length > 8) {
                this.velocityHistory.shift();
            }
        }
        
        // Calculate average velocity
        const avgVelocity = this.velocityHistory.length > 0 
            ? this.velocityHistory.reduce((a, b) => a + b, 0) / this.velocityHistory.length 
            : 0;
        
        // Update tracking variables
        this.lastTimestamp = currentTime;
        this.lastPosition = { x: adjustedX, y: adjustedY };
        
        const newPoints = [...currentLine.points, adjustedX, adjustedY];
        
        // Apply different smoothing based on drawing speed for fluid motion
        let processedPoints = newPoints;
        
        // For very fast drawing, use aggressive interpolation and fluid smoothing
        if (avgVelocity > 1.2) {
            // High speed: maximum fluidity
            processedPoints = interpolatePoints(newPoints, 6);
            processedPoints = optimizePoints(processedPoints, 0.8);
            processedPoints = processedPoints.length > 8 ? 
                smoothPointsFluid(processedPoints) : processedPoints;
        } else if (avgVelocity > 0.6) {
            // Medium-high speed: enhanced fluidity
            processedPoints = interpolatePoints(newPoints, 8);
            processedPoints = optimizePoints(processedPoints, 1.0);
            processedPoints = processedPoints.length > 6 ? 
                smoothPointsAdvanced(processedPoints) : processedPoints;
        } else if (avgVelocity > 0.2) {
            // Medium speed: balanced fluidity
            processedPoints = interpolatePoints(newPoints, 10);
            processedPoints = optimizePoints(processedPoints, 1.2);
            processedPoints = processedPoints.length > 6 ? 
                smoothPoints(processedPoints, 0.6) : processedPoints;
        } else {
            // Slow speed: maximum precision with fluidity
            processedPoints = interpolatePoints(newPoints, 12);
            processedPoints = optimizePoints(processedPoints, 1.5);
            processedPoints = processedPoints.length > 6 ? 
                smoothPoints(processedPoints, 0.4) : processedPoints;
        }
        
        return { 
            ...currentLine, 
            points: processedPoints
        };
    }

    static shouldSyncLine(line: Line): boolean {
        return line.points.length >= 4; // Need at least 2 coordinate pairs
    }
} 