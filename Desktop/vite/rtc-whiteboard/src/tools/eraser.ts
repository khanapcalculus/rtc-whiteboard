export interface EraserState {
    isErasing: boolean;
    eraserPath: number[];
}

export class EraserTool {
    static getInitialState(): EraserState {
        return {
            isErasing: false,
            eraserPath: []
        };
    }

    static handleMouseDown(e: any, stagePos: { x: number; y: number }): EraserState {
        const pos = e.target.getStage().getPointerPosition();
        if (!pos) return EraserTool.getInitialState();

        const adjustedPos = {
            x: pos.x - stagePos.x,
            y: pos.y - stagePos.y
        };

        return {
            isErasing: true,
            eraserPath: [adjustedPos.x, adjustedPos.y]
        };
    }

    static handleMouseMove(e: any, currentState: EraserState, stagePos: { x: number; y: number }): EraserState {
        if (!currentState.isErasing) return currentState;

        const pos = e.target.getStage().getPointerPosition();
        if (!pos) return currentState;

        const adjustedPos = {
            x: pos.x - stagePos.x,
            y: pos.y - stagePos.y
        };

        return {
            ...currentState,
            eraserPath: [...currentState.eraserPath, adjustedPos.x, adjustedPos.y]
        };
    }

    static handleMouseUp(currentState: EraserState): EraserState {
        return {
            ...currentState,
            isErasing: false
        };
    }

    // Check if a point is inside a rectangle
    static isPointInRect(px: number, py: number, rx: number, ry: number, rw: number, rh: number): boolean {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    }

    // Check if a point is inside a circle
    static isPointInCircle(px: number, py: number, cx: number, cy: number, radius: number): boolean {
        const dx = px - cx;
        const dy = py - cy;
        return dx * dx + dy * dy <= radius * radius;
    }

    // Check if a point is inside an ellipse
    static isPointInEllipse(px: number, py: number, cx: number, cy: number, radiusX: number, radiusY: number): boolean {
        const dx = px - cx;
        const dy = py - cy;
        return (dx * dx) / (radiusX * radiusX) + (dy * dy) / (radiusY * radiusY) <= 1;
    }

    // Check if eraser path intersects with a line
    static doesEraserIntersectLine(eraserPath: number[], linePoints: number[], threshold: number = 10): boolean {
        if (eraserPath.length < 4 || linePoints.length < 4) return false;

        // Check each segment of the eraser path against each segment of the line
        for (let i = 0; i < eraserPath.length - 2; i += 2) {
            const ex1 = eraserPath[i];
            const ey1 = eraserPath[i + 1];
            const ex2 = eraserPath[i + 2];
            const ey2 = eraserPath[i + 3];

            for (let j = 0; j < linePoints.length - 2; j += 2) {
                const lx1 = linePoints[j];
                const ly1 = linePoints[j + 1];
                const lx2 = linePoints[j + 2];
                const ly2 = linePoints[j + 3];

                // Check if the eraser segment is close to the line segment
                if (EraserTool.distanceToLineSegment(ex1, ey1, lx1, ly1, lx2, ly2) < threshold ||
                    EraserTool.distanceToLineSegment(ex2, ey2, lx1, ly1, lx2, ly2) < threshold) {
                    return true;
                }
            }
        }

        return false;
    }

    // Calculate distance from a point to a line segment
    static distanceToLineSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
        
        const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (length * length)));
        const projection = { x: x1 + t * dx, y: y1 + t * dy };
        
        return Math.sqrt((px - projection.x) * (px - projection.x) + (py - projection.y) * (py - projection.y));
    }

    // Check if eraser path intersects with any object
    static checkCollisions(
        eraserPath: number[],
        objects: {
            lines: any[],
            shapes: any[],
            images: any[],
            texts: any[]
        }
    ): {
        linesToDelete: string[],
        shapesToDelete: string[],
        imagesToDelete: string[],
        textsToDelete: string[]
    } {
        const linesToDelete: string[] = [];
        const shapesToDelete: string[] = [];
        const imagesToDelete: string[] = [];
        const textsToDelete: string[] = [];

        if (eraserPath.length < 4) return { linesToDelete, shapesToDelete, imagesToDelete, textsToDelete };

        // Check lines
        objects.lines.forEach(line => {
            if (EraserTool.doesEraserIntersectLine(eraserPath, line.points)) {
                linesToDelete.push(line.id);
            }
        });

        // Check shapes
        objects.shapes.forEach(shape => {
            let intersects = false;

            // Check if any point of the eraser path intersects with the shape
            for (let i = 0; i < eraserPath.length - 1; i += 2) {
                const px = eraserPath[i];
                const py = eraserPath[i + 1];

                switch (shape.type) {
                    case 'rectangle':
                        if (EraserTool.isPointInRect(px, py, shape.x, shape.y, shape.width || 0, shape.height || 0)) {
                            intersects = true;
                        }
                        break;
                    case 'circle':
                        if (EraserTool.isPointInCircle(px, py, shape.x, shape.y, shape.radius || 0)) {
                            intersects = true;
                        }
                        break;
                    case 'ellipse':
                        if (EraserTool.isPointInEllipse(px, py, shape.x, shape.y, shape.radiusX || 0, shape.radiusY || 0)) {
                            intersects = true;
                        }
                        break;
                    case 'line':
                        if (EraserTool.doesEraserIntersectLine(eraserPath, shape.points || [])) {
                            intersects = true;
                        }
                        break;
                }

                if (intersects) break;
            }

            if (intersects) {
                shapesToDelete.push(shape.id);
            }
        });

        // Check images
        objects.images.forEach(image => {
            for (let i = 0; i < eraserPath.length - 1; i += 2) {
                const px = eraserPath[i];
                const py = eraserPath[i + 1];

                if (EraserTool.isPointInRect(px, py, image.x, image.y, image.width, image.height)) {
                    imagesToDelete.push(image.id);
                    break;
                }
            }
        });

        // Check texts
        objects.texts.forEach(text => {
            for (let i = 0; i < eraserPath.length - 1; i += 2) {
                const px = eraserPath[i];
                const py = eraserPath[i + 1];

                // Approximate text bounds (this is a simple approximation)
                const textWidth = text.text.length * text.fontSize * 0.6;
                const textHeight = text.fontSize;

                if (EraserTool.isPointInRect(px, py, text.x, text.y, textWidth, textHeight)) {
                    textsToDelete.push(text.id);
                    break;
                }
            }
        });

        return { linesToDelete, shapesToDelete, imagesToDelete, textsToDelete };
    }
} 