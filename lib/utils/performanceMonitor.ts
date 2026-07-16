export class PerformanceMonitor {
    private static lastFrameTime = performance.now();
    private static lowFpsFrameCount = 0;
    private static isLowPerformanceMode = false;
    private static fpsDisplaySpan = null as unknown as HTMLSpanElement;
    private static lowPerformanceIndicator = null as unknown as HTMLSpanElement;

    private static readonly FPS_THRESHOLD = 45;
    private static readonly FRAME_DROP_COUNT_LIMIT = 30;

    private static readonly FRAME_DELTA_HISTORY_SIZE = 30;
    private static frameDeltas: number[] = [];

    public static checkPerformance() {
        const now = performance.now();
        const delta = now - this.lastFrameTime;
        this.lastFrameTime = now;

        this.frameDeltas.push(delta);
        if (this.frameDeltas.length > this.FRAME_DELTA_HISTORY_SIZE) {
            this.frameDeltas.shift();
        }
        const averageFPS = 1000 / (this.frameDeltas.reduce((sum, d) => sum + d, 0) / this.frameDeltas.length);
        this.fpsDisplaySpan.textContent = averageFPS.toFixed(2);

        if (this.isLowPerformanceMode) { return; }

        // Ignore the very first frames or massive lag spikes from loading/tab switching
        if (delta > 200) { return; }

        const currentFps = 1000 / delta;
        if (currentFps < this.FPS_THRESHOLD) {
            this.lowFpsFrameCount++;
            if (this.lowFpsFrameCount >= this.FRAME_DROP_COUNT_LIMIT) {
                this.enableLowPerformanceMode();
            }
        } else {
            this.lowFpsFrameCount = Math.max(0, this.lowFpsFrameCount - 1);
        }
    }

    private static enableLowPerformanceMode() {
        this.isLowPerformanceMode = true;
        console.warn("Performance degradation detected. Disabling expensive UI blurs.");
        document.body.classList.add('lowPerformanceMode');
        this.lowPerformanceIndicator.textContent = "⚠️";
    }

    public static init() {
        const fpsDisplaySpan = document.getElementById("fpsDisplay") as HTMLSpanElement | null;
        const lowPerformanceIndicator = document.getElementById("lowPerformanceIndicator") as HTMLSpanElement | null;

        if (!fpsDisplaySpan || !lowPerformanceIndicator) {
            throw new Error('Failed to initialise performance indicators.');
        }

        this.fpsDisplaySpan = fpsDisplaySpan;
        this.lowPerformanceIndicator = lowPerformanceIndicator;
    }
}