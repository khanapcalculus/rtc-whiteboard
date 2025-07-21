export interface SelectionState {
    selectedId: string | null;
    selectedType: 'image' | 'shape' | 'text' | null;
}

export class SelectionTool {
    static getInitialState(): SelectionState {
        return {
            selectedId: null,
            selectedType: null
        };
    }

    static handleSelection(
        target: any,
        currentSelection: SelectionState,
        onSelectionChange: (selection: SelectionState) => void
    ): void {
        console.log('SelectionTool.handleSelection called with target:', target?.getType?.(), 'name:', target?.name?.(), 'id:', target?.id?.());
        
        if (!target) {
            console.log('No target, deselecting');
            // Clicked on empty space, deselect
            onSelectionChange({
                selectedId: null,
                selectedType: null
            });
            return;
        }

        const targetId = target.id();
        const targetName = target.name();
        
        console.log('Target ID:', targetId, 'Target Name:', targetName);

        if (targetId && (targetName === 'image' || targetName === 'shape' || targetName === 'text')) {
            console.log('Selecting item:', targetId, targetName);
            // Select the clicked item
            onSelectionChange({
                selectedId: targetId,
                selectedType: targetName as 'image' | 'shape' | 'text'
            });
        } else {
            console.log('Clicked on something else, deselecting');
            // Clicked on something else, deselect
            onSelectionChange({
                selectedId: null,
                selectedType: null
            });
        }
    }

    static handleTransform(
        target: any,
        selectedType: 'image' | 'shape' | 'text',
        onUpdate: (id: string, updates: any) => void
    ): void {
        if (!target) return;

        const id = target.id();
        
        // For shapes and images, we need to handle scale differently to prevent jumping
        if (selectedType === 'image') {
            const scaleX = target.scaleX();
            const scaleY = target.scaleY();
            
            // Calculate new dimensions
            const newWidth = target.width() * scaleX;
            const newHeight = target.height() * scaleY;
            
            // Update the target immediately to prevent jumping
            target.width(newWidth);
            target.height(newHeight);
            target.scaleX(1);
            target.scaleY(1);
            
            const updates: any = {
                x: target.x(),
                y: target.y(),
                width: newWidth,
                height: newHeight,
                scaleX: 1,
                scaleY: 1,
                rotation: target.rotation()
            };
            
            onUpdate(id, updates);
        } else if (selectedType === 'shape') {
            const shapeType = target.getClassName();
            const scaleX = target.scaleX();
            const scaleY = target.scaleY();
            
            const updates: any = {
                x: target.x(),
                y: target.y(),
                scaleX: 1,
                scaleY: 1,
                rotation: target.rotation()
            };
            
            if (shapeType === 'Rect') {
                const newWidth = target.width() * scaleX;
                const newHeight = target.height() * scaleY;
                
                // Update the target immediately
                target.width(newWidth);
                target.height(newHeight);
                target.scaleX(1);
                target.scaleY(1);
                
                updates.width = newWidth;
                updates.height = newHeight;
            } else if (shapeType === 'Circle') {
                const newRadius = target.radius() * Math.max(scaleX, scaleY);
                
                // Update the target immediately
                target.radius(newRadius);
                target.scaleX(1);
                target.scaleY(1);
                
                updates.radius = newRadius;
            } else if (shapeType === 'Ellipse') {
                const newRadiusX = target.radiusX() * scaleX;
                const newRadiusY = target.radiusY() * scaleY;
                
                // Update the target immediately
                target.radiusX(newRadiusX);
                target.radiusY(newRadiusY);
                target.scaleX(1);
                target.scaleY(1);
                
                updates.radiusX = newRadiusX;
                updates.radiusY = newRadiusY;
            } else if (shapeType === 'Line') {
                const points = target.points();
                const scaledPoints = [];
                
                for (let i = 0; i < points.length; i += 2) {
                    scaledPoints.push(points[i] * scaleX);
                    scaledPoints.push(points[i + 1] * scaleY);
                }
                
                // Update the target immediately
                target.points(scaledPoints);
                target.scaleX(1);
                target.scaleY(1);
                
                updates.points = scaledPoints;
            }
            
            onUpdate(id, updates);
        } else if (selectedType === 'text') {
            // For text, just update position and scale
            const updates: any = {
                x: target.x(),
                y: target.y(),
                scaleX: target.scaleX(),
                scaleY: target.scaleY(),
                rotation: target.rotation()
            };
            
            onUpdate(id, updates);
        }
    }
} 