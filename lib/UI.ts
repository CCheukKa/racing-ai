import { type SerialisedCarData, Cars } from "./cars";
import { CookieHandler } from "./utils/cookieHandler";
import { Leaderboard } from "./components/leaderboard";
import { Stadium } from "./components/stadium";
import { AppState } from "./appState";
import { recacheCanvasPointCache } from "./utils/canvasUtils";

export class UI {
    private static _inputsLocked = false;
    static readonly lockableElements: (HTMLButtonElement | HTMLTextAreaElement | HTMLInputElement)[] = [];
    static zoomFactor = 1;

    public static get inputsLocked() {
        return this._inputsLocked;
    }

    public static set inputsLocked(value: boolean) {
        if (this._inputsLocked === value) { return; }
        this._inputsLocked = value;
        this.lockableElements.forEach(element => {
            element.disabled = value;
        });
    }

    public static init() {
        document.addEventListener("DOMContentLoaded", () => {
            this.recalculateWhatTextSizes();
            this.bindTips();
            this.bindMiscellaneousUi();
        });
        window.addEventListener("resize", () => {
            recacheCanvasPointCache(Stadium.trackCanvas);
        });
    }

    private static recalculateWhatTextSizes() {
        Array.from(document.getElementsByClassName("whatText")).forEach(e => {
            const element = e as HTMLElement;
            element.style.width = element.parentElement?.clientWidth + "px";
            element.style.height = element.parentElement?.clientHeight + "px";
        });
    }

    private static bindTips() {
        const tips = document.getElementsByClassName("tip");
        if (tips.length === 0) { return; }

        let currentTipIndex = -1;
        showRandomTip();
        setInterval(showRandomTip, 10000);

        function showRandomTip() {
            let randomIndex = 0;
            do {
                randomIndex = Math.floor(Math.random() * tips.length);
            } while (tips.length > 1 && currentTipIndex === randomIndex);

            const tipElement = tips[randomIndex] as HTMLElement;
            tipElement.scrollIntoView({ behavior: "instant", block: "center" });
            currentTipIndex = randomIndex;
        }
    }

    private static bindMiscellaneousUi() {
        const resetSettingsButton = document.getElementById("resetSettingsButton") as HTMLButtonElement | null;
        resetSettingsButton?.addEventListener("click", () => {
            if (!confirm("Are you sure you want to reset all settings? This will also refresh the page.")) { return; }
            CookieHandler.cookie = null;
            CookieHandler.updateCookie();
            location.reload();
        });

        const importCarButton = document.getElementById("importCar") as HTMLButtonElement | null;
        importCarButton?.addEventListener("click", () => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".json";
            input.multiple = true;
            input.onchange = (event) => {
                const files = (event.target as HTMLInputElement).files;
                if (!files || files.length === 0) { return; }
                this.importCarFiles(files);
            };
            input.click();
            input.remove();
        });

        const dragPrompt = document.getElementById("dragPrompt") as HTMLDivElement | null;
        document.addEventListener("dragover", (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = "copy";
            }
            dragPrompt?.classList.remove("hidden");
        });
        document.addEventListener("blur", () => {
            dragPrompt?.classList.add("hidden");
        });
        document.addEventListener("dragleave", (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (event.relatedTarget === null) {
                dragPrompt?.classList.add("hidden");
            }
        });
        document.addEventListener("drop", (event) => {
            event.preventDefault();
            event.stopPropagation();
            const files = event.dataTransfer?.files;
            if (!files || files.length === 0) { return; }
            this.importCarFiles(files);
            dragPrompt?.classList.add("hidden");
        });

        const raceModeButton = document.getElementById("raceModeButton") as HTMLButtonElement | null;
        raceModeButton?.addEventListener("click", () => {
            AppState.isRaceMode = !AppState.isRaceMode;
            document.body.classList.toggle("raceMode", AppState.isRaceMode);
            Stadium.STADIUM_WIDTH = AppState.isRaceMode ? 985 : 600;
            Stadium.recalculateCanvasSizes();
            Stadium.drawCars();
            setTimeout(() => {
                this.recalculateWhatTextSizes();
            }, 200);
        });
    }

    private static importCarFiles(files: FileList | File[]) {
        const jsonFiles = Array.from(files).filter(file =>
            file.type === "application/json" || file.name.endsWith(".json"),
        );
        if (jsonFiles.length === 0) {
            alert("Failed to import car(s). Please ensure the file(s) are valid JSON car data files.");
            return;
        }

        const readers = jsonFiles.map(file => new Promise<{ hash: string, carData: SerialisedCarData }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data: SerialisedCarData = JSON.parse(e.target?.result as string);
                    const hash = data.hash || "Failed to get hash";
                    resolve({ hash, carData: data });
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        }));

        Promise.all(readers).then(results => {
            if (results.length > 1) {
                const hashes = results.map(({ hash, carData }) => hash + (carData.name ? ` (${carData.name})` : "")).join("\n");
                if (!confirm(`Are you sure you want to import all ${results.length} cars?\n\nHashes:\n${hashes}`)) { return; }
            }
            results.forEach(({ hash, carData }) => {
                if (results.length === 1) {
                    if (!confirm(`Are you sure you want to import this car?\n\nHash:\n${hash + (carData.name ? ` (${carData.name})` : "")}`)) { return; }
                }
                const car = Cars.deserialiseCarData(carData, true);
                AppState.cars.push(car);
                Leaderboard.leaderboard.push(carData);
                Leaderboard.update();
                Stadium.drawCars();
                console.log("Car imported:", car);
            });
        }).catch(error => {
            alert("Failed to import car(s). Please ensure the file(s) are valid JSON car data files.");
            console.error("Failed to import car(s):", error);
        });
    }
}
