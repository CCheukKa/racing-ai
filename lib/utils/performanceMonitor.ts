export class PerformanceMonitor {
    private static lastFrameTime = performance.now();
    private static lowFpsFrameCount = 0;
    private static isLowPerformanceMode = false;
    private static fpsDisplaySpan = null as unknown as HTMLSpanElement;
    private static lowPerformanceIndicator = null as unknown as HTMLSpanElement;

    private static readonly FPS_THRESHOLD = 45;
    private static readonly FRAME_DROP_COUNT_LIMIT = 30;

    public static checkPerformance() {
        const now = performance.now();
        const delta = now - this.lastFrameTime;
        this.lastFrameTime = now;
        const currentFps = 1000 / delta;

        this.fpsDisplaySpan.textContent = currentFps.toFixed(2);

        if (this.isLowPerformanceMode) { return; }

        // Ignore the very first frames or massive lag spikes from loading/tab switching
        if (delta > 200) { return; }

        if (currentFps < this.FPS_THRESHOLD) {
            this.lowFpsFrameCount++;
            if (this.lowFpsFrameCount >= this.FRAME_DROP_COUNT_LIMIT) {
                this.enableLowPerformanceMode();
            }
        } else {
            this.lowFpsFrameCount = Math.max(0, this.lowFpsFrameCount - 1);
        }
    }

    public static enableLowPerformanceMode() {
        this.isLowPerformanceMode = true;
        console.warn("Performance degradation detected. Disabling expensive UI blurs.");
        document.body.classList.add('optimise');
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