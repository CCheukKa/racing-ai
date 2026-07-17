import { type SerialisedCarData, Cars } from "./cars";
import { CookieHandler } from "./utils/cookieHandler";
import { Leaderboard } from "./components/leaderboard";
import { Stadium } from "./components/stadium";
import { TranslationKey, SUPPORTED_LANGUAGES, TRANSLATIONS, getTranslationTitleValue, getTranslationValue, type SupportedLanguage } from "./translation";

export class UI {
    private static _inputsLocked = false;
    static readonly lockableElements: (HTMLButtonElement | HTMLTextAreaElement | HTMLInputElement)[] = [];
    static zoomFactor = 1;
    private static currentLanguage: SupportedLanguage = "en-GB";
    private static languageButton = document.getElementById("languageButton") as HTMLButtonElement | null;
    private static refreshTips: (() => void) | null = null;

    public static get inputsLocked() {
        return this._inputsLocked;
    }

    public static t(key: TranslationKey): string {
        if (key === TranslationKey.TickCounterPrefix) {
            return this.currentLanguage === "zh-HK" ? "Tick" : "Tick";
        }

        const value = getTranslationValue(TRANSLATIONS[this.currentLanguage], key);
        if (typeof value !== "string") {
            throw new Error(`Translation key ${key} is not a string value.`);
        }
        return value;
    }

    public static tf(key: TranslationKey, ...args: any[]): string {
        const value = getTranslationValue(TRANSLATIONS[this.currentLanguage], key);
        if (typeof value !== "function") {
            throw new Error(`Translation key ${key} is not a formatted string value.`);
        }
        return value(...args);
    }

    public static set inputsLocked(value: boolean) {
        if (this._inputsLocked === value) { return; }
        this._inputsLocked = value;
        this.lockableElements.forEach(element => {
            element.disabled = value;
        });
    }

    public static getTickCounterPrefix(): string {
        return this.t(TranslationKey.TickCounterPrefix);
    }

    public static init() {
        document.addEventListener("DOMContentLoaded", () => {
            this.loadLanguageFromCookie();
            this.applyLanguage();
            this.recalculateWhatTextSizes();
            this.onLayoutChange();
            this.bindTips();
            this.bindMiscellaneousUi();
        });
        window.addEventListener("resize", () => {
            Stadium.handleResize();
        });
    }

    private static recalculateWhatTextSizes() {
        Array.from(document.getElementsByClassName("whatText")).forEach(e => {
            const element = e as HTMLElement;
            element.style.width = element.parentElement?.clientWidth + "px";
            element.style.height = element.parentElement?.clientHeight + "px";
        });
    }

    private static onLayoutChange() {
        const mainContainer = document.getElementById("mainContainer") as HTMLDivElement | null;
        if (!mainContainer) { return; }

        const PADDING = 100;
        const nextZoomFactor = Math.min(
            (document.body.clientHeight - PADDING) / mainContainer.clientHeight,
            (document.body.clientWidth - PADDING) / mainContainer.clientWidth,
        );

        this.zoomFactor = nextZoomFactor;
        mainContainer.style.zoom = nextZoomFactor.toString();
    }

    private static bindTips() {
        const tipsContainer = document.querySelector(".tips") as HTMLDivElement | null;
        if (!tipsContainer) { return; }

        let currentTipIndex = -1;
        const showRandomTip = () => {
            const bundle = TRANSLATIONS[this.currentLanguage];
            tipsContainer.innerHTML = bundle.tips.map((tip) => `<div class="tip"><b>${bundle.tipsLabel}</b> <u>${tip}</u></div>`).join("");

            const tips = Array.from(tipsContainer.getElementsByClassName("tip"));
            if (tips.length === 0) { return; }

            let randomIndex = 0;
            do {
                randomIndex = Math.floor(Math.random() * tips.length);
            } while (tips.length > 1 && currentTipIndex === randomIndex);

            const tipElement = tips[randomIndex] as HTMLElement;
            tipElement.scrollIntoView({ behavior: "instant", block: "center" });
            currentTipIndex = randomIndex;
        };

        showRandomTip();
        setInterval(showRandomTip, 10000);
        this.refreshTips = showRandomTip;
    }

    private static bindMiscellaneousUi() {
        this.languageButton?.addEventListener("click", () => {
            this.cycleLanguage();
        });

        const resetSettingsButton = document.getElementById("resetSettingsButton") as HTMLButtonElement | null;
        resetSettingsButton?.addEventListener("click", () => {
            if (!confirm(this.t(TranslationKey.ResetSettingsConfirm))) { return; }
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

        const raceModeButton = document.getElementById("raceModeButton") as HTMLInputElement | null;
        raceModeButton?.addEventListener("change", () => {
            const isRaceMode = !!raceModeButton.checked;

            // Race mode is intended for imported-only runs.
            if (isRaceMode) {
                Stadium.cars = [];
            }

            Stadium.isRaceMode = isRaceMode;
            document.body.classList.toggle("raceMode", isRaceMode);
            Stadium.stadiumContainer.style.width = isRaceMode ? "100%" : `${Stadium.NORMAL_STADIUM_WIDTH}px`;
            Stadium.handleResize();
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
            alert(this.t(TranslationKey.ImportInvalidFiles));
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
                if (!confirm(this.tf(TranslationKey.ImportManyConfirm, results.length, hashes))) { return; }
            }
            results.forEach(({ hash, carData }) => {
                if (results.length === 1) {
                    if (!confirm(this.tf(TranslationKey.ImportOneConfirm, hash + (carData.name ? ` (${carData.name})` : "")))) { return; }
                }
                const car = Cars.deserialiseCarData(carData, true);
                Stadium.cars.push(car);
                Leaderboard.leaderboard.push(carData);
                Leaderboard.update();
                Stadium.drawCars();
                console.log("Car imported:", car);
            });
        }).catch(error => {
            alert(this.t(TranslationKey.ImportInvalidFiles));
            console.error("Failed to import car(s):", error);
        });
    }

    private static loadLanguageFromCookie() {
        const cookieLanguage = CookieHandler.cookie?.uiLanguage;
        if (cookieLanguage === "en-GB" || cookieLanguage === "zh-HK") {
            this.currentLanguage = cookieLanguage;
        }
    }

    private static cycleLanguage() {
        const currentIndex = SUPPORTED_LANGUAGES.findIndex(lang => lang.code === this.currentLanguage);
        const nextIndex = (currentIndex + 1) % SUPPORTED_LANGUAGES.length;
        this.currentLanguage = SUPPORTED_LANGUAGES[nextIndex]!.code;

        if (CookieHandler.cookie === null) { CookieHandler.cookie = {}; }
        CookieHandler.cookie.uiLanguage = this.currentLanguage;
        CookieHandler.updateCookie();

        this.applyLanguage();
    }

    private static applyLanguage() {
        const bundle = TRANSLATIONS[this.currentLanguage];

        Object.entries(bundle.cssVariables).forEach(([name, value]) => {
            const needsQuotedContent = name.startsWith("--translation-");
            document.documentElement.style.setProperty(name, needsQuotedContent ? JSON.stringify(value) : value);
        });

        document.querySelectorAll<HTMLElement>("[data-translation]").forEach((element) => {
            const key = element.dataset["translation"] as TranslationKey | undefined;
            if (!key) { return; }
            element.textContent = this.t(key);

            if (element.id === "languageButton") {
                element.title = this.t(TranslationKey.LanguageButtonTitle);
                return;
            }

            if (element.hasAttribute("title")) {
                element.title = getTranslationTitleValue(bundle, key);
            }
        });

        document.querySelectorAll<HTMLElement>("[data-translation-html]").forEach((element) => {
            const key = element.dataset["translationHtml"] as TranslationKey | undefined;
            if (!key) { return; }
            element.innerHTML = this.t(key);
        });

        document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-translation-placeholder]").forEach((element) => {
            const key = element.dataset["translationPlaceholder"] as TranslationKey | undefined;
            if (!key) { return; }
            element.placeholder = this.t(key);
        });

        this.languageButton = document.getElementById("languageButton") as HTMLButtonElement | null;
        if (this.languageButton) {
            this.languageButton.textContent = this.t(TranslationKey.LanguageButtonLabel);
            this.languageButton.title = this.t(TranslationKey.LanguageButtonTitle);
        }

        this.refreshTips?.();
        this.updateTickCounterLanguage();
        window.dispatchEvent(new CustomEvent("ui-language-changed", { detail: { language: this.currentLanguage } }));
    }

    private static updateTickCounterLanguage() {
        const tickCounter = document.getElementById("tickCounter") as HTMLDivElement | null;
        if (!tickCounter) { return; }
        const prefix = this.getTickCounterPrefix();
        const existing = tickCounter.textContent ?? "";
        const valuePart = existing.includes(":") ? existing.split(":").slice(1).join(":") : "";
        tickCounter.textContent = valuePart ? `${prefix}:${valuePart}` : `${prefix}: 0/0`;
    }
}
