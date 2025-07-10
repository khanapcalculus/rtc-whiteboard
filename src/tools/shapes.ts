export interface Shape {
    id: string;
    type: 'rectangle' | 'circle' | 'line' | 'ellipse';
    x: number;
    y: number;
    width?: number;
    height?: number;
    radius?: number;
    radiusX?: number;
    radiusY?: number;
    points?: number[];
    color: string;
    strokeWidth: number;
    fill?: string;
    scaleX?: number;
    scaleY?: number;
    rotation?: number;
}

export type ShapeType = 'rectangle' | 'circle' | 'line' | 'ellipse';

export class ShapeTool {
    static generateUniqueId(): string {
        const sessionId = Math.random().toString(36).substr(2, 9);
        const timestamp = Date.now();
        const counter = Math.floor(Math.random() * 1000);
        return `shape-${sessionId}-${timestamp}-${counter}`;
    }

    static startDrawing(
        shapeType: ShapeType,
        e: any,
        stagePos: { x: number; y: number },
        color: string,
        strokeWidth: number
    ): Shape | null {
        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();
        if (!pos) return null;

        const adjustedX = pos.x - stagePos.x;
        const adjustedY = pos.y - stagePos.y;

        const baseShape = {
            id: this.generateUniqueId(),
            type: shapeType,
            x: adjustedX,
            y: adjustedY,
            color,
            strokeWidth,
        };

        switch (shapeType) {
            case 'rectangle':
                return {
                    ...baseShape,
                    width: 0,
                    height: 0,
                } as Shape;
            case 'circle':
                return {
                    ...baseShape,
                    radius: 0,
                } as Shape;
            case 'ellipse':
                return {
                    ...baseShape,
                    radiusX: 0,
                    radiusY: 0,
                } as Shape;
            case 'line':
                return {
                    ...baseShape,
                    points: [adjustedX, adjustedY, adjustedX, adjustedY],
                    width: Math.abs(adjustedX - adjustedX),  // Will be 0 initially
                    height: Math.abs(adjustedY - adjustedY)  // Will be 0 initially
                } as Shape;
            default:
                return null;
        }
    }

    static updateDrawing(
        currentShape: Shape,
        e: any,
        stagePos: { x: number; y: number }
    ): Shape {
        const stage = e.target.getStage();
        const pos = stage.getPointerPosition();
        if (!pos) return currentShape;

        const adjustedX = pos.x - stagePos.x;
        const adjustedY = pos.y - stagePos.y;

        switch (currentShape.type) {
            case 'rectangle':
                return {
                    ...currentShape,
                    width: adjustedX - currentShape.x,
                    height: adjustedY - currentShape.y,
                };
            case 'circle':
                const radius = Math.sqrt(
                    Math.pow(adjustedX - currentShape.x, 2) +
                    Math.pow(adjustedY - currentShape.y, 2)
                );
                return {
                    ...currentShape,
                    radius,
                };
            case 'ellipse':
                return {
                    ...currentShape,
                    radiusX: Math.abs(adjustedX - currentShape.x),
                    radiusY: Math.abs(adjustedY - currentShape.y),
                };
            case 'line':
                if (!currentShape.points || currentShape.points.length < 4) return currentShape;
                const startX = currentShape.points[0];
                const startY = currentShape.points[1];
                return {
                    ...currentShape,
                    points: [startX, startY, adjustedX, adjustedY],
                    width: Math.abs(adjustedX - startX),
                    height: Math.abs(adjustedY - startY)
                };
            default:
                return currentShape;
        }
    }

    static shouldSyncShape(shape: Shape): boolean {
        switch (shape.type) {
            case 'rectangle':
                return Math.abs(shape.width || 0) > 5 && Math.abs(shape.height || 0) > 5;
            case 'circle':
                return (shape.radius || 0) > 5;
            case 'ellipse':
                return (shape.radiusX || 0) > 5 && (shape.radiusY || 0) > 5;
            case 'line':
                if (!shape.points || shape.points.length < 4) return false;
                const distance = Math.sqrt(
                    Math.pow(shape.points[2] - shape.points[0], 2) +
                    Math.pow(shape.points[3] - shape.points[1], 2)
                );
                return distance > 5;
            default:
                return false;
        }
    }
} 