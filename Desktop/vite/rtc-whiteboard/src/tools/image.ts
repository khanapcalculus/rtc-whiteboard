export interface ImageItem {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    src: string;
    name?: string;
    scaleX?: number;
    scaleY?: number;
    rotation?: number;
}

export class ImageTool {
    static generateUniqueId(): string {
        const sessionId = Math.random().toString(36).substr(2, 9);
        const timestamp = Date.now();
        const counter = Math.floor(Math.random() * 1000);
        return `image-${sessionId}-${timestamp}-${counter}`;
    }

    static createFileInput(): HTMLInputElement {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.style.display = 'none';
        return input;
    }

    static async loadImage(file: File): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };
            
            img.src = url;
        });
    }

    static async convertToDataURL(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve(e.target?.result as string);
            };
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            reader.readAsDataURL(file);
        });
    }

    static async handleImageUpload(
        stagePos: { x: number; y: number },
        onImageAdd: (image: ImageItem) => void
    ): Promise<void> {
        const input = this.createFileInput();
        
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
                const img = await this.loadImage(file);
                const dataURL = await this.convertToDataURL(file);
                
                // Calculate reasonable size (max 300px while maintaining aspect ratio)
                const maxSize = 300;
                const aspectRatio = img.width / img.height;
                let width = img.width;
                let height = img.height;
                
                if (width > maxSize || height > maxSize) {
                    if (width > height) {
                        width = maxSize;
                        height = maxSize / aspectRatio;
                    } else {
                        height = maxSize;
                        width = maxSize * aspectRatio;
                    }
                }

                const imageItem: ImageItem = {
                    id: this.generateUniqueId(),
                    x: 100 - stagePos.x, // Place at a reasonable position
                    y: 100 - stagePos.y,
                    width,
                    height,
                    src: dataURL,
                    name: file.name
                };

                onImageAdd(imageItem);
            } catch (error) {
                console.error('Error loading image:', error);
                alert('Failed to load image. Please try again.');
            }
        };

        input.click();
    }
} 