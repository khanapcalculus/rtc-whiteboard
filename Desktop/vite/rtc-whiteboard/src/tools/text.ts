
export interface TextItem {
    id: string;
    x: number;
    y: number;
    text: string;
    fontSize: number;
    fontFamily: string;
    color: string;
    width?: number;
    height?: number;
    scaleX?: number;
    scaleY?: number;
    rotation?: number;
    isEditing?: boolean;
    fontWeight?: string;
    fontStyle?: string;
}

export const FONT_FAMILIES = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'Verdana',
    'Courier New',
    'Comic Sans MS',
    'Impact',
    'Trebuchet MS',
    'Palatino'
];

export const FONT_SIZES = [
    8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 56, 64, 72
];

export class TextTool {
    static createText(
        x: number,
        y: number,
        text: string = '',
        color: string = '#000000',
        fontSize: number = 16,
        fontFamily: string = 'Arial',
        fontWeight: string = 'normal',
        fontStyle: string = 'normal'
    ): TextItem {
        return {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            x,
            y,
            text,
            fontSize,
            fontFamily,
            color,
            width: undefined,
            height: undefined,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            isEditing: true, // Start in editing mode
            fontWeight,
            fontStyle
        };
    }

    static handleDoubleClick(
        target: any,
        texts: TextItem[],
        onUpdate: (texts: TextItem[]) => void
    ): void {
        const textId = target.id();
        const updatedTexts = texts.map(text => 
            text.id === textId 
                ? { ...text, isEditing: true }
                : { ...text, isEditing: false }
        );
        onUpdate(updatedTexts);
    }

    static finishEditing(
        textId: string,
        newText: string,
        texts: TextItem[],
        onUpdate: (texts: TextItem[]) => void
    ): void {
        const updatedTexts = texts.map(text => 
            text.id === textId 
                ? { ...text, text: newText, isEditing: false }
                : text
        );
        onUpdate(updatedTexts);
    }

    static updateText(
        textId: string,
        updates: Partial<TextItem>,
        texts: TextItem[],
        onUpdate: (texts: TextItem[]) => void
    ): void {
        const updatedTexts = texts.map(text => 
            text.id === textId 
                ? { ...text, ...updates }
                : text
        );
        onUpdate(updatedTexts);
    }
} 