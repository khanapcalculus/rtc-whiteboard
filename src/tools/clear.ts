import * as Y from 'yjs';
import type { Line } from '../hooks/useWhiteboard';

export class ClearTool {
    static clearCanvas(
        yLines: Y.Array<string>,
        setSyncedLines: (lines: Line[]) => void,
        setCurrentLine: (line: Line | null) => void
    ) {
        // Clear all lines from the shared document
        yLines.delete(0, yLines.length);
        // Clear local state
        setSyncedLines([]);
        setCurrentLine(null);
    }
} 