import { CookieHandler } from "../utils/cookieHandler";
import { drawLine, drawRectangle } from "../utils/canvasUtils";
import { NeuralNetwork } from "./neuralNetwork";
import { Stadium } from "./stadium";
import { UI } from "@lib/UI";

export class Garage {

    /* ----------------------------------- UI ----------------------------------- */

    private static garageCanvas = document.getElementById('garageCanvas') as HTMLCanvasElement;
    private static garageCtx = this.garageCanvas.getContext('2d') as CanvasRenderingContext2D;

    public static readonly GARAGE_CAR_COLOUR = '#ffa0a0';

    private static probeAnglesInput = document.getElementById('probeAngles') as HTMLTextAreaElement;
    public static probeAngles: number[] = [];
    private static onProbeAnglesInput() {
        this.probeAngles = this.probeAnglesInput.value.trim().split('\n')
            .map(angle => parseFloat(angle.trim()) * (Math.PI / 180))
            .filter(angle => !isNaN(angle));
        this.redraw();
        NeuralNetwork.redraw();

        if (CookieHandler.cookie === null) { CookieHandler.cookie = {}; }
        CookieHandler.cookie.probeAngles = this.probeAngles.map(angle => Math.round(angle * (180 / Math.PI) * 100000) / 100000);
        CookieHandler.updateCookie();
    }

    private static redraw() {
        const CAR_SCALE = 2;
        Garage.redrawCarProbes(CAR_SCALE);
    }

    public static redrawCarProbes(CAR_SCALE: number, probeAngles: number[] = this.probeAngles, carColour: string = this.GARAGE_CAR_COLOUR, canvas: HTMLCanvasElement = this.garageCanvas, ctx: CanvasRenderingContext2D = this.garageCtx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 2);

        const scaledCarWidth = Stadium.CAR_WIDTH * CAR_SCALE;
        const scaledCarHeight = Stadium.CAR_HEIGHT * CAR_SCALE;
        drawRectangle(ctx, -scaledCarWidth / 2, -scaledCarHeight / 2, scaledCarWidth, scaledCarHeight, carColour);

        probeAngles.forEach(angle => {
            drawLine(ctx, 0, 0, Math.cos(angle) * 100, Math.sin(angle) * 100, 2, carColour);
        });

        drawRectangle(ctx, -scaledCarWidth / 2, -scaledCarHeight / 2, scaledCarWidth, scaledCarHeight, '#000000', true);

        ctx.restore();
    }

    /* ---------------------------------- Code ---------------------------------- */

    public static init() {
        this.garageCanvas.width = 300;
        this.garageCanvas.height = 300;

        UI.lockableElements.push(this.probeAnglesInput);

        document.addEventListener('DOMContentLoaded', () => {
            if (CookieHandler.cookie?.probeAngles) {
                this.probeAnglesInput.value = CookieHandler.cookie.probeAngles.join('\n');
            }
            this.onProbeAnglesInput();
        });
        this.probeAnglesInput.addEventListener('input', () => {
            if (UI.inputsLocked) { return; }
            this.probeAnglesInput.value = this.probeAnglesInput.value
                .replace(/[^0-9-+.\n]/g, '')
                .replace(/--/g, '+')
                .replace(/\+-/g, '-')
                .replace(/-\+/g, '-')
                .replace(/\++/g, '+')
                .replace(/\.+/g, '.')
                .replace(/([+-])0+/gm, '$10')
                .replace(/^0+/gm, '0')

                .replace(/(?<=[0-9.])([\+-])/g, '\n$1');
            this.onProbeAnglesInput();
        });
        this.probeAnglesInput.addEventListener('blur', () => {
            if (UI.inputsLocked) { return; }
            this.probeAnglesInput.value = this.probeAnglesInput.value
                .replace(/([\+-])\./g, '$10.')
                .replace(/^\./gm, '0.')
                .replace(/\.$/gm, '');
            this.onProbeAnglesInput();
        });
    }
}