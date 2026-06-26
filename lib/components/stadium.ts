import { NaturalSelection } from "./naturalSelection";
import { NeuralNetwork } from "./neuralNetwork";
import { Car } from "../cars";
import { Garage } from "./garage";
import { MathExtra } from "../utils/mathExtra";
import { drawCircle, drawLine, drawRectangle, getCanvasPoint } from "@lib/utils/canvasUtils";

export class Stadium {

    /* ---------------------------------- Logic --------------------------------- */

    public static readonly CAR_WIDTH = 20;
    public static readonly CAR_HEIGHT = 10;
    public static cars: Car[] = [];
    public static isRaceMode = false;

    // Tracks the active requestAnimationFrame ID to allow cancellation/resets
    private static animationFrameId: number | null = null;

    // Hint variables used to throttle high-frequency pointer moves
    private static hintX = NaN;
    private static hintY = NaN;
    private static altStyle = false;
    private static isHintActive = false;

    public static tickDo() {
        NaturalSelection.updateTickCounter();
        this.processCars();
        this.drawCars();
        this.cars.forEach(this.updateRoadScore);
    }

    /**
     * The unified update & render pipeline loop tied to screen refresh rate
     */
    private static loop() {
        // Only progress cars and logic if running simulation/race mode
        if (Stadium.isRaceMode) {
            Stadium.tickDo();
        } else {
            // Even if the race hasn't started, keep drawing cars when spawning/static
            Stadium.drawCars();
        }

        // Handle the deferred UI/Crosshair render tick
        if (Stadium.isHintActive) {
            Stadium.redrawHintCanvas(Stadium.hintX, Stadium.hintY, Stadium.altStyle);
        } else {
            Stadium.redrawHintCanvas(NaN, NaN);
        }

        Stadium.animationFrameId = requestAnimationFrame(() => Stadium.loop());
    }

    private static processCars() {
        this.cars.forEach(car => {
            car.updateProbes();
            [car.engineInput, car.steerInput] = car.network.predict(NeuralNetwork.getInputLayerValues(car, car.inputLayerOptions));
            car.move();
        });
    }

    private static spawnCar(x: number, y: number) {
        if (x < 0 || x >= Stadium.STADIUM_WIDTH || y < 0 || y >= Stadium.STADIUM_HEIGHT) {
            console.warn('Spawn coordinates out of bounds');
            return;
        }

        const car = new Car(x, y, Garage.probeAngles);
        this.cars.push(car);
    }

    private static updateTrackData() {
        Stadium.trackData = Stadium.trackCtx.getImageData(0, 0, Stadium.STADIUM_WIDTH, Stadium.STADIUM_HEIGHT).data;
    }

    /* ----------------------------------- UI ----------------------------------- */

    private static stadiumContainer = null as unknown as HTMLDivElement;
    public static STADIUM_WIDTH: number;
    public static STADIUM_HEIGHT: number;
    public static trackCanvas = null as unknown as HTMLCanvasElement;
    private static trackCtx = null as unknown as CanvasRenderingContext2D;
    private static carCanvas = null as unknown as HTMLCanvasElement;
    private static carCtx = null as unknown as CanvasRenderingContext2D;
    private static hintCanvas = null as unknown as HTMLCanvasElement;
    private static hintCtx = null as unknown as CanvasRenderingContext2D;

    private static clearStadiumButton = null as unknown as HTMLButtonElement;

    public static readonly TRACK_COLOUR = '#e0e0e0';
    private static readonly TRACK_WIDTH = 50;

    public static TRACK_START_X = NaN;
    public static TRACK_START_Y = NaN;

    private static trackData: Uint8ClampedArray<ArrayBufferLike> = new Uint8ClampedArray();


    private static redrawHintCanvas(x: number, y: number, altCrosshairStyle?: boolean) {
        Stadium.hintCtx.clearRect(0, 0, Stadium.STADIUM_WIDTH, Stadium.STADIUM_HEIGHT);
        drawCircle(Stadium.hintCtx, this.TRACK_START_X, this.TRACK_START_Y, 5, '#ff0000'); // Track start
        drawCircle(Stadium.hintCtx, this.TRACK_START_X, this.TRACK_START_Y, 5, '#000000', true); // Track start
        drawCircle(Stadium.hintCtx, Stadium.STADIUM_WIDTH / 2, Stadium.STADIUM_HEIGHT / 2, 5, '#000000', true); // Track center

        const CURSOR_CROSSHAIR_LENGTH = 6;
        const CURSOR_CROSSHAIR_WIDTH = 1;
        drawCircle(Stadium.hintCtx, x, y, this.TRACK_WIDTH / 2, '#ffffff', true); // Cursor
        if (!altCrosshairStyle) {
            drawLine(Stadium.hintCtx, x - CURSOR_CROSSHAIR_LENGTH, y, x + CURSOR_CROSSHAIR_LENGTH, y, CURSOR_CROSSHAIR_WIDTH, '#ffffff'); // Cursor crosshair
            drawLine(Stadium.hintCtx, x, y - CURSOR_CROSSHAIR_LENGTH, x, y + CURSOR_CROSSHAIR_LENGTH, CURSOR_CROSSHAIR_WIDTH, '#ffffff'); // Cursor crosshair
        } else {
            drawLine(Stadium.hintCtx, x - CURSOR_CROSSHAIR_LENGTH * Math.SQRT1_2, y - CURSOR_CROSSHAIR_LENGTH * Math.SQRT1_2, x + CURSOR_CROSSHAIR_LENGTH * Math.SQRT1_2, y + CURSOR_CROSSHAIR_LENGTH * Math.SQRT1_2, CURSOR_CROSSHAIR_WIDTH, '#ffffff'); // Cursor alt crosshair
            drawLine(Stadium.hintCtx, x - CURSOR_CROSSHAIR_LENGTH * Math.SQRT1_2, y + CURSOR_CROSSHAIR_LENGTH * Math.SQRT1_2, x + CURSOR_CROSSHAIR_LENGTH * Math.SQRT1_2, y - CURSOR_CROSSHAIR_LENGTH * Math.SQRT1_2, CURSOR_CROSSHAIR_WIDTH, '#ffffff'); // Cursor alt crosshair
        }
    }

    public static drawCars() {
        this.carCtx.clearRect(0, 0, this.STADIUM_WIDTH, this.STADIUM_HEIGHT);
        this.carCtx.save();

        this.cars.forEach(car => {
            this.carCtx.translate(car.x, car.y);
            this.carCtx.rotate(car.angle);

            car.probes.forEach(probe => {
                const probeLength = probe.distance;
                const probeX = Math.cos(probe.angle) * probeLength;
                const probeY = Math.sin(probe.angle) * probeLength;

                this.carCtx.strokeStyle = `${car.colour}60`;
                this.carCtx.lineWidth = 2;
                this.carCtx.beginPath();
                this.carCtx.moveTo(0, 0);
                this.carCtx.lineTo(probeX, probeY);
                this.carCtx.stroke();
            });

            drawRectangle(this.carCtx, -Stadium.CAR_WIDTH / 2, -Stadium.CAR_HEIGHT / 2, Stadium.CAR_WIDTH, Stadium.CAR_HEIGHT, car.colour);
            drawRectangle(this.carCtx, -Stadium.CAR_WIDTH / 2, -5, Stadium.CAR_WIDTH, Stadium.CAR_HEIGHT, '#000000', true);
            this.carCtx.resetTransform();
        });

        this.carCtx.restore();
    }

    public static raycastDistance(car: Car, angle: number): number {
        const rayOrigin = { x: car.x, y: car.y };
        const cosAngle = Math.cos(car.angle + angle);
        const sinAngle = Math.sin(car.angle + angle);
        const maxDistance = 200;
        const stepSize = 1;

        for (let distance = 0; distance < maxDistance; distance += stepSize) {
            const rayEnd = {
                x: rayOrigin.x + cosAngle * distance,
                y: rayOrigin.y + sinAngle * distance
            };
            if (!this.isOnTrack(rayEnd)) {
                return distance;
            }
        }
        return maxDistance;
    }

    public static isOnTrack(point: { x: number, y: number }): boolean {
        if (point.x < 0 || point.x >= this.STADIUM_WIDTH || point.y < 0 || point.y >= this.STADIUM_HEIGHT) {
            return false; // Out of bounds
        }

        const x = Math.floor(point.x);
        const y = Math.floor(point.y);
        const index = (y * this.STADIUM_WIDTH + x) * 4;
        return this.trackData[index + 3] !== 0; // Check alpha channel
    }

    private static updateRoadScore(car: Car) {
        car.score += car.isOnTrack ? 0.2 : -5;
        if (car.isOnTrack) {
            car.score += MathExtra.interpolate(car.speed, [-1, 0, 1, 5], [-3, -2, 1, 4]);
        }

        if (car.previousOriginAngle) {
            let deltaAngle = car.originAngle - car.previousOriginAngle;
            if (deltaAngle < -Math.PI) {
                deltaAngle += 2 * Math.PI;
            } else if (deltaAngle > Math.PI) {
                deltaAngle -= 2 * Math.PI;
            }
            car.lapCount += deltaAngle / (2 * Math.PI);
        }
        car.previousOriginAngle = car.originAngle;

        car.grassTicks += +!car.isOnTrack;
        car.speedSum += car.speed;

        // console.log(`Car at (${car.x.toFixed(2)}, ${car.y.toFixed(2)}) - Speed: ${car.speed.toFixed(2)}, Score: ${car.score.toFixed(2)}, Lap Count: ${car.lapCount.toFixed(2)}`);
    }

    public static getPerformanceScore(car: Car, atTick: number) {
        let score = 0;
        score += car.lapCount * ((atTick - car.grassTicks) / atTick) ** 2 * 100;
        score += MathExtra.interpolate(car.speedSum / atTick, [0, 1], [-100, 100]);
        return score;
    }

    public static recalculateCanvasSizes() {
        this.TRACK_START_X = Stadium.STADIUM_WIDTH / 2;
        this.TRACK_START_Y = Stadium.STADIUM_HEIGHT / 4;
        this.stadiumContainer.style.width = `${this.STADIUM_WIDTH}px`;
        this.stadiumContainer.style.height = `${this.STADIUM_HEIGHT}px`;
        this.trackCanvas.width = this.STADIUM_WIDTH;
        this.trackCanvas.height = this.STADIUM_HEIGHT;
        this.carCanvas.width = this.STADIUM_WIDTH;
        this.carCanvas.height = this.STADIUM_HEIGHT;
        this.hintCanvas.width = this.STADIUM_WIDTH;
        this.hintCanvas.height = this.STADIUM_HEIGHT;

        Stadium.hintX = NaN;
        Stadium.hintY = NaN;
        Stadium.isHintActive = false;

        Stadium.updateTrackData();
    }

    /* ---------------------------------- Code ---------------------------------- */

    public static init() {
        const stadiumContainer = document.getElementById('stadiumContainer') as HTMLDivElement | null;
        const trackCanvas = document.getElementById('trackCanvas') as HTMLCanvasElement | null;
        const carCanvas = document.getElementById('carCanvas') as HTMLCanvasElement | null;
        const hintCanvas = document.getElementById('hintCanvas') as HTMLCanvasElement | null;
        const clearStadiumButton = document.getElementById('clearStadiumButton') as HTMLButtonElement | null;
        const trackCtx = trackCanvas?.getContext('2d', { willReadFrequently: true }) ?? null;
        const carCtx = carCanvas?.getContext('2d') ?? null;
        const hintCtx = hintCanvas?.getContext('2d') ?? null;

        if (!stadiumContainer || !trackCanvas || !carCanvas || !hintCanvas || !clearStadiumButton || !trackCtx || !carCtx || !hintCtx) {
            throw new Error('Failed to initialise stadium UI elements.');
        }

        this.stadiumContainer = stadiumContainer;
        this.trackCanvas = trackCanvas;
        this.trackCtx = trackCtx;
        this.carCanvas = carCanvas;
        this.carCtx = carCtx;
        this.hintCanvas = hintCanvas;
        this.hintCtx = hintCtx;
        this.clearStadiumButton = clearStadiumButton;
        this.STADIUM_WIDTH = this.stadiumContainer.clientWidth;
        this.STADIUM_HEIGHT = this.stadiumContainer.clientHeight;

        document.addEventListener('DOMContentLoaded', () => {
            this.recalculateCanvasSizes();
            // Kick off the loop animation cycle once canvases are ready
            if (!Stadium.animationFrameId) {
                Stadium.loop();
            }
        });

        window.addEventListener('blur', () => {
            Stadium.isHintActive = false;
        });

        let isLeftMouseDown = false;
        let isRightMouseDown = false;
        let previousX: number | undefined;
        let previousY: number | undefined;

        document.addEventListener('contextmenu', (event: MouseEvent) => {
            event.preventDefault();
        });

        document.addEventListener('pointerdown', (event: PointerEvent) => {
            if (!stadiumContainer.contains(event.target as Node)) { return; }
            const { x, y } = getCanvasPoint(this.trackCanvas, event.clientX, event.clientY, true);

            switch (event.button) {
                case 0: // Left button
                    handleLeftClick(x, y, event.target);
                    break;
                case 1: // Middle button
                    Stadium.spawnCar(x, y);
                    break;
                case 2: // Right button
                    handleRightClick(x, y, event.target);
                    break;
                default:
                    return;
            }
        });

        document.addEventListener('pointermove', (event: PointerEvent) => {
            const { x, y } = getCanvasPoint(this.trackCanvas, event.clientX, event.clientY);
            const isOnCanvas = this.stadiumContainer.contains(event.target as Node);
            handleMouseMove(x, y, isOnCanvas);
        });

        document.addEventListener('pointerup', (event: PointerEvent) => {
            handleMouseUp();
            if (event.pointerType === 'mouse') {
                const { x, y } = getCanvasPoint(this.trackCanvas, event.clientX, event.clientY);
                Stadium.hintX = x;
                Stadium.hintY = y;
                Stadium.isHintActive = true;
            } else {
                Stadium.isHintActive = false;
            }
        });

        function handleLeftClick(x: number, y: number, target: EventTarget | null) {
            if (shouldDiscardEvent(target)) { return; }

            isLeftMouseDown = true;
            isRightMouseDown = false;
            const isOnCanvas = Stadium.stadiumContainer.contains(target as Node);
            handleMouseMove(x, y, isOnCanvas);
        }

        function handleRightClick(x: number, y: number, target: EventTarget | null) {
            if (shouldDiscardEvent(target)) { return; }

            isLeftMouseDown = false;
            isRightMouseDown = true;
            const isOnCanvas = Stadium.stadiumContainer.contains(target as Node);
            handleMouseMove(x, y, isOnCanvas);
        }

        function handleMouseMove(x: number, y: number, isOnCanvas: boolean) {
            // Stage changes for requestAnimationFrame thread instead of immediate execution
            Stadium.hintX = x;
            Stadium.hintY = y;
            Stadium.altStyle = isRightMouseDown;
            Stadium.isHintActive = isOnCanvas || isLeftMouseDown || isRightMouseDown;

            if (isLeftMouseDown) {
                drawCircle(Stadium.trackCtx, x, y, Stadium.TRACK_WIDTH / 2, Stadium.TRACK_COLOUR);
                if (previousX !== undefined && previousY !== undefined) {
                    drawLine(Stadium.trackCtx, previousX, previousY, x, y, Stadium.TRACK_WIDTH, Stadium.TRACK_COLOUR);
                }
                previousX = x;
                previousY = y;

                Stadium.updateTrackData();
            }
            if (isRightMouseDown) {
                const ERASE_BUFFER_RADIUS = 4;

                Stadium.trackCtx.globalCompositeOperation = 'destination-out';
                drawCircle(Stadium.trackCtx, x, y, Stadium.TRACK_WIDTH / 2 + ERASE_BUFFER_RADIUS, '#ffffff');
                if (previousX !== undefined && previousY !== undefined) {
                    drawLine(Stadium.trackCtx, previousX, previousY, x, y, Stadium.TRACK_WIDTH + ERASE_BUFFER_RADIUS * 2, '#ffffff');
                }
                Stadium.trackCtx.globalCompositeOperation = 'source-over'; // Reset to default
                previousX = x;
                previousY = y;

                Stadium.updateTrackData();
            }
        }

        function handleMouseUp() {
            isLeftMouseDown = false;
            isRightMouseDown = false;
            previousX = undefined;
            previousY = undefined;
        }

        function shouldDiscardEvent(target: EventTarget | null): boolean {
            return target instanceof HTMLInputElement
                || target instanceof HTMLTextAreaElement
                || target instanceof HTMLButtonElement
                || target instanceof HTMLSelectElement;
        }

        this.clearStadiumButton.addEventListener('click', () => {
            if (!confirm('Are you sure you want to clear the stadium? This will remove all track data.')) { return; }
            this.trackCtx.clearRect(0, 0, this.STADIUM_WIDTH, this.STADIUM_HEIGHT);
            Stadium.updateTrackData();
        });
    }
}