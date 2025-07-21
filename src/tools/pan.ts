export interface PanState {
    x: number;
    y: number;
}

export class PanTool {
    static handleDragEnd(e: any, onViewStateChange: (x: number, y: number) => void) {
        const newX = e.target.x();
        const newY = e.target.y();
        onViewStateChange(newX, newY);
    }

    static getInitialState(): PanState {
        return { x: 0, y: 0 };
    }
} 