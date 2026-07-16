import { CookieHandler } from "./utils/cookieHandler";
import { NaturalSelection } from "./components/naturalSelection";
import { Stadium } from "./components/stadium";
import { UI } from "./UI";
import { TranslationKey } from "./translation";

export class Looper {
    private static updateControlLabels() {
        this.generationLoopButton.textContent = UI.t(TranslationKey.StopAfterThis);

        if (this.generationLooper === null) {
            this.tickLoopButton.textContent = UI.t(TranslationKey.Start);
            return;
        }

        this.tickLoopButton.textContent = this.tickLoopPaused
            ? UI.t(TranslationKey.TickLoopResume)
            : UI.t(TranslationKey.TickLoopPause);
    }

    /* ---------------------------------- Logic --------------------------------- */

    private static ticksInLastSecond: number = 0;
    private static lastTPSUpdateTime: number = 0;
    private static actualTPS: number = 0;

    public static tickLoopPaused = true;
    public static generationLoopStopped = false;
    public static generationLooper: Generator | null = null;

    public static targetTPS: number = 200;
    private static lastFrameTime: number = 0;
    private static timeAccumulator: number = 0;

    private static maxTPS: number = 0;
    private static tickDurations: number[] = [];

    public static runLoop(looper: Generator) {
        function step(currentTime: number) {
            if (Looper.tickLoopPaused) {
                Looper.lastFrameTime = currentTime;
                requestAnimationFrame(step);
                return;
            }

            // Calculate delta time since last frame
            const deltaTime = currentTime - Looper.lastFrameTime;
            Looper.lastFrameTime = currentTime;

            // Add to accumulator
            Looper.timeAccumulator += deltaTime;

            // Fixed time step (in ms)
            const timeStep = 1000 / Looper.targetTPS;

            // Run as many ticks as needed to catch up
            let ticksThisFrame = 0;
            const maxTicksPerFrame = Math.min(100, Math.ceil(Looper.targetTPS / 30)); // Safety limit

            while (Looper.timeAccumulator >= timeStep && ticksThisFrame < maxTicksPerFrame) {
                const startTime = performance.now();
                const res = looper.next();
                const endTime = performance.now();

                Looper.tickDurations.push(endTime - startTime);
                if (Looper.tickDurations.length > 500) {
                    Looper.tickDurations.shift();
                }

                if (res.done) { return; }
                Looper.timeAccumulator -= timeStep;
                ticksThisFrame++;
                Looper.ticksInLastSecond++;
            }

            // Update TPS counter once per second
            const tpsUpdateIntervalMs = 100;
            if (currentTime - Looper.lastTPSUpdateTime >= tpsUpdateIntervalMs) {
                Looper.actualTPS = Looper.ticksInLastSecond / (tpsUpdateIntervalMs / 1000);
                Looper.updateTickSpeedDisplay();
                Looper.ticksInLastSecond = 0;
                Looper.lastTPSUpdateTime = currentTime;

                const averageTickDuration = Looper.tickDurations.reduce((a, b) => a + b, 0) / Looper.tickDurations.length;
                Looper.maxTPS = Math.round(1000 / averageTickDuration);
                Looper.updateMaxTickSpeedDisplay();
            }

            requestAnimationFrame(step);
        }

        // Initialize and start the loop
        this.lastFrameTime = performance.now();
        this.lastTPSUpdateTime = performance.now();
        requestAnimationFrame(step);
    }

    public static generationCount: number = 0;
    public static * generationLoop() {
        while (true) {
            this.generationCount++;
            console.log(`---------- Starting Generation ${this.generationCount} with ${Stadium.cars.length} cars ----------`);
            NaturalSelection.generationStart();

            if (Stadium.isRaceMode) { this.generationLoopButton.click(); }

            const startTime = performance.now();

            let tickLooper = this.tickLoop();
            let tickResult = tickLooper.next();
            while (!tickResult.done) {
                // Pause sub loop if requested
                if (this.tickLoopPaused) {
                    console.log(`---------- Pausing Generation ${this.generationCount} at tick ${this.tickCount}----------`);
                    while (this.tickLoopPaused) {
                        yield;
                    }
                }
                tickResult = tickLooper.next();
                yield;
            }

            const endTime = performance.now();
            console.log(`Generation ${this.generationCount} completed in ${(endTime - startTime).toFixed(2)} ms (${(this.tickCount / ((endTime - startTime) / 1000)).toFixed(2)} TPS)`);

            const survivedCars = NaturalSelection.generationEnd();

            if (this.generationLoopStopped) {
                console.log(`Generation loop stopped at generation ${this.generationCount}`);
                this.tickLoopPaused = true;
                this.updateControlLabels();
                // Wait until resumed
                while (this.tickLoopPaused) {
                    yield;
                }
                this.generationLoopStopped = false;
                this.generationLoopButton.disabled = false;
                console.log(`Resuming generation loop at generation ${this.generationCount}`);
            }
            if (!Stadium.isRaceMode) { NaturalSelection.generationPostEnd(survivedCars); }
        }
    }

    public static tickCount = 0;
    public static * tickLoop() {
        this.tickCount = 0;
        console.log(`---------- Starting Tick Loop for Generation ${this.generationCount} ----------`);
        while (this.tickCount < NaturalSelection.options.tickLimit.value) {
            this.tickCount++;
            Stadium.tickDo();
            yield;
        }
    }

    /* ----------------------------------- UI ----------------------------------- */

    private static maxTickSpeedDisplay = document.getElementById('maxTickSpeed') as HTMLSpanElement;
    private static tickSpeedDisplay = document.getElementById('tickSpeed') as HTMLSpanElement;
    private static targetTickSpeedInput = document.getElementById('targetTickSpeedInput') as HTMLInputElement;

    private static tickLoopButton = document.getElementById('tickLoopButton') as HTMLButtonElement;
    private static generationLoopButton = document.getElementById('generationLoopButton') as HTMLButtonElement;

    private static updateTickSpeedDisplay() {
        this.tickSpeedDisplay.textContent = this.actualTPS.toString();
    }
    private static updateMaxTickSpeedDisplay() {
        this.maxTickSpeedDisplay.textContent = this.maxTPS.toString();
    }

    /* ---------------------------------- Code ---------------------------------- */

    public static init() {
        document.addEventListener('DOMContentLoaded', () => {
            const initialTargetTPS = CookieHandler.cookie?.targetTPS ?? parseFloat(this.targetTickSpeedInput.value);
            this.targetTickSpeedInput.value = initialTargetTPS.toString();
            this.targetTPS = initialTargetTPS;
        });

        this.tickLoopButton.addEventListener('click', () => {
            const firstRun = this.generationLooper === null;

            if (firstRun) {
                const successful = NaturalSelection.createInitialBatch();
                if (!successful) { return; }

                this.generationLoopButton.disabled = false;
                UI.inputsLocked = true;
            }

            this.tickLoopPaused = !this.tickLoopPaused;
            this.updateControlLabels();

            if (firstRun) {
                this.generationLooper = this.generationLoop();
                this.runLoop(this.generationLooper);
                this.updateControlLabels();
            }
        });

        this.generationLoopButton.addEventListener('click', () => {
            this.generationLoopStopped = true;
            this.generationLoopButton.disabled = true;
        });

        const onTargetTickSpeedInputChange = () => {
            if (!this.targetTickSpeedInput.validity.valid) { return; }
            const newTargetTPS = parseFloat(this.targetTickSpeedInput.value);
            this.targetTPS = newTargetTPS;

            if (CookieHandler.cookie === null) { CookieHandler.cookie = {}; }
            CookieHandler.cookie.targetTPS = newTargetTPS;
            CookieHandler.updateCookie();
        }
        this.targetTickSpeedInput.addEventListener('change', onTargetTickSpeedInputChange);

        window.addEventListener('ui-language-changed', () => {
            this.updateControlLabels();
        });

        this.updateControlLabels();
    }
}