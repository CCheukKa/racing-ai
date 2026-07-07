import { MathExtra } from "./mathExtra";

export function drawRectangle(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, colour: string, hollow?: boolean) {
    if (hollow) {
        ctx.strokeStyle = colour;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
    } else {
        ctx.fillStyle = colour;
        ctx.fillRect(x, y, width, height);
    }
}

export function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, colour: string, hollow?: boolean, hollowWidth = 2) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    if (hollow) {
        ctx.strokeStyle = colour;
        ctx.lineWidth = hollowWidth;
        ctx.stroke();
    } else {
        ctx.fillStyle = colour;
        ctx.fill();
    }
    ctx.closePath();
}

export function drawLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, width: number, colour: string) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.closePath();
}

export function drawPath(ctx: CanvasRenderingContext2D, path: Array<{ x: number, y: number }>, width: number, colour: string) {
    ctx.beginPath();
    ctx.moveTo(path[0]!.x, path[0]!.y);
    for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i]!.x, path[i]!.y);
    }
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.closePath();
}

type textOptions = {
    textAlign?: CanvasTextAlign;
    textBaseline?: CanvasTextBaseline;
    fontSize?: number;
    bold?: boolean;
    font?: string;
    strokeWidth?: number;
}
export function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, colour: string, options: textOptions = {}) {
    ctx.fillStyle = colour;
    ctx.font = `${options.bold ? 'bold' : ''} ${options.fontSize ?? 20}px ${options.font ?? 'Roboto'}`;
    ctx.textAlign = options.textAlign ?? 'center';
    ctx.textBaseline = options.textBaseline ?? 'middle';
    if (options.strokeWidth && options.strokeWidth > 0) {
        ctx.strokeStyle = colour;
        ctx.lineWidth = options.strokeWidth;
        ctx.strokeText(text, x, y);
    }
    ctx.fillText(text, x, y);
}

export function getRandomColour(): string {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function mutateColour(colour: string, scale: number): string {
    const r = parseInt(colour.slice(1, 3), 16);
    const g = parseInt(colour.slice(3, 5), 16);
    const b = parseInt(colour.slice(5, 7), 16);

    const newR = MathExtra.clamp(Math.round(r + (Math.random() - 0.5) * scale), 0, 255);
    const newG = MathExtra.clamp(Math.round(g + (Math.random() - 0.5) * scale), 0, 255);
    const newB = MathExtra.clamp(Math.round(b + (Math.random() - 0.5) * scale), 0, 255);

    return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
}

const canvasPointCache = new WeakMap<HTMLCanvasElement, { rect: DOMRect, scaleX: number, scaleY: number }>();
export function recacheCanvasPointCache(canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    canvasPointCache.set(canvas, { rect, scaleX, scaleY });
    return { rect, scaleX, scaleY };
}
export function getCanvasPoint(canvas: HTMLCanvasElement, clientX: number, clientY: number, recache?: boolean) {
    if (recache || !canvasPointCache.has(canvas)) {
        const { rect, scaleX, scaleY } = recacheCanvasPointCache(canvas);
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
        };
    } else {
        const { rect, scaleX, scaleY } = canvasPointCache.get(canvas)!;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
        };
    }
}
