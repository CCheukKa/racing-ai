import { Garage } from "./garage";
import { Looper } from "../looper";
import { Car, Cars } from "../cars";
import { Stadium } from "./stadium";
import { Leaderboard } from "./leaderboard";
import { mutateColour } from "../utils/canvasUtils";
import { CookieHandler } from "../utils/cookieHandler";
import { MathExtra } from "../utils/mathExtra";

export class NaturalSelection {
    /* ---------------------------------- Logic --------------------------------- */

    public static createInitialBatch() {
        if (Stadium.isRaceMode) { return true; }
        if (Garage.probeAngles === null) { return false; }
        Stadium.cars = Array.from({ length: this.options.populationSize.value }, () => new Car(undefined, undefined, Garage.probeAngles));
        return true;
    }

    public static generationStart() {
        Stadium.cars.forEach(car => car.reset());
        this.naturalSelectionLog.push({
            generation: Looper.generationCount,
            populationSize: this.options.populationSize.value,
            survivors: undefined,
            bestScore: undefined
        })
        this.updateLog();
    }

    public static generationEnd() {
        Stadium.cars.forEach((car) => {
            car.score += Stadium.getPerformanceScore(car, Looper.tickCount);
        });
        const sortedCars = Stadium.cars.sort((a, b) => b.score - a.score);

        Leaderboard.leaderboard.push(...sortedCars.map(car => Cars.serialiseCarData(car, Looper.tickCount)));

        // Elimination
        let survivedCars: Car[] = [];
        if (Stadium.isRaceMode) {
            survivedCars = Stadium.cars;
        } else {
            sortedCars.forEach((car, index) => {
                car.rank = index + 1;
                const willSurvive = Math.random() < this.survivalProbability(car.rank);

                console.log(`Rank: ${car.rank}, Score: ${car.score}, Lap: ${car.lapCount}, GrassT: ${car.grassTicks}, SpeedAvg: ${car.speedSum / this.options.tickLimit.value}, Survive?: ${willSurvive}, Hash: ${car.network.getHash()}`);
                if (willSurvive) { survivedCars.push(car); }
            });
            console.log(`***** Best car score: ${sortedCars[0]!.score}, Lap: ${sortedCars[0]!.lapCount}, GrassT: ${sortedCars[0]!.grassTicks}, SpeedAvg: ${sortedCars[0]!.speedSum / this.options.tickLimit.value}, Hash: ${sortedCars[0]!.network.getHash()} *****`);

            console.log(`${(survivedCars.length / Stadium.cars.length * 100).toFixed(2)}% survived`);

            this.naturalSelectionLog[this.naturalSelectionLog.length - 1] = {
                generation: Looper.generationCount,
                populationSize: this.options.populationSize.value,
                survivors: survivedCars.length,
                bestScore: sortedCars[0]!.score
            };
            this.updateLog();
        }

        Leaderboard.update();

        return survivedCars;
    }

    public static generationPostEnd(survivedCars: Car[]) {
        const newCars: Car[] = [];
        while (survivedCars.length + newCars.length < this.options.populationSize.value) {
            for (const car of survivedCars) {
                if (Math.random() > this.reproductionProbability(car.rank)) { continue; }
                console.log(`===== Reproducing: rank ${car.rank}, score ${car.score}, hash ${car.network.getHash()} =====`);

                const newCar = car.clone();
                newCar.network.mutate();
                newCar.colour = mutateColour(car.colour, 20);
                newCars.push(newCar);
            }
        }

        if (this.options.parentShouldMutate.value) {
            survivedCars.forEach(car => car.network.mutate());
        }

        Stadium.cars = [...survivedCars, ...newCars];

        Stadium.cars.forEach(car => { car.generation++; });
    }

    private static survivalProbability(rank: number): number {
        return Math.exp(-(rank - 1) / this.options.populationSize.value * this.options.survivalHarshness.value);
    }

    private static reproductionProbability(rank: number): number {
        return Math.exp(-(rank - 1) / this.options.populationSize.value * this.options.reproductionHarshness.value);
    }

    /* ----------------------------------- UI ----------------------------------- */

    private static tickCounter = document.getElementById('tickCounter') as HTMLDivElement;

    public static options: NaturalSelectionOptions = {
        tickLimit: { element: document.getElementById('tickLimit') as HTMLInputElement, value: NaN },
        populationSize: { element: document.getElementById('populationSize') as HTMLInputElement, value: NaN },
        survivalHarshness: { element: document.getElementById('survivalHarshness') as HTMLInputElement, value: NaN },
        reproductionHarshness: { element: document.getElementById('reproductionHarshness') as HTMLInputElement, value: NaN },
        mutationRate: { element: document.getElementById('mutationRate') as HTMLInputElement, value: NaN },
        parentShouldMutate: { element: document.getElementById('parentShouldMutate') as HTMLInputElement, value: false },
    };

    private static naturalSelectionLogElement = document.getElementById('naturalSelectionLog') as HTMLDivElement;
    private static naturalSelectionEntryTemplate = document.getElementById('naturalSelectionEntryTemplate') as HTMLTemplateElement;
    public static naturalSelectionLog: NaturalSelectionEntry[] = [];
    public static updateLog() {
        console.log('Updating Natural Selection Log');
        const shouldAutoScroll = this.naturalSelectionLogElement.scrollHeight - this.naturalSelectionLogElement.scrollTop <= this.naturalSelectionLogElement.clientHeight + 10;

        this.naturalSelectionLogElement.innerHTML = '';
        this.naturalSelectionLog.forEach(entry => {
            const entryElement = this.naturalSelectionEntryTemplate.content.cloneNode(true) as HTMLDivElement;
            entryElement.querySelector('.generation')!.textContent = entry.generation.toString();
            entryElement.querySelector('.population')!.textContent = entry.populationSize.toString();
            entryElement.querySelector('.survivors')!.textContent = entry.survivors ? `${(entry.survivors / entry.populationSize * 100).toFixed(2)}%` : '⏳';
            entryElement.querySelector('.bestScore')!.textContent = entry.bestScore ? entry.bestScore.toFixed(2) : '⏳';
            this.naturalSelectionLogElement.appendChild(entryElement);
        });

        if (shouldAutoScroll) { this.naturalSelectionLogElement.scrollTop = this.naturalSelectionLogElement.scrollHeight; }
    }

    public static updateTickCounter() {
        this.tickCounter.textContent = `Tick: ${Looper.tickCount}/${NaturalSelection.options.tickLimit.value}`;
        this.tickCounter.style.setProperty('--progress', `${MathExtra.clamp(Looper.tickCount / NaturalSelection.options.tickLimit.value, 0, 1) * 100}%`);
    }

    /* ---------------------------------- Code ---------------------------------- */

    public static init() {
        document.addEventListener('DOMContentLoaded', () => {
            if (CookieHandler.cookie?.naturalSelectionOptions) {
                const cookieOptions = CookieHandler.cookie.naturalSelectionOptions as SerialisedNaturalSelectionOptions;
                Object.keys(this.options).forEach((key) => {
                    const typedKey = key as keyof typeof NaturalSelection.options;
                    if (cookieOptions[typedKey] !== undefined) {
                        this.options[typedKey].value = cookieOptions[typedKey];
                        this.options[typedKey].element.value = cookieOptions[typedKey].toString();
                        this.options[typedKey].element.checked = !!cookieOptions[typedKey];
                    }
                });
            }

            Object.keys(this.options).forEach((key) => {
                const typedKey = key as keyof typeof NaturalSelection.options;
                const inputOption = this.options[typedKey];
                if (!inputOption.element) { throw new Error(`Input element for ${typedKey} not found`); }

                inputOption.element.addEventListener('change', onInputChange);
                onInputChange();

                function onInputChange() {
                    if (!inputOption.element.validity.valid) { return; }

                    if (typeof inputOption.value === "number") {
                        const newValue = inputOption.element.valueAsNumber;
                        if (!isNaN(newValue)) { inputOption.value = newValue; }
                    } else if (typeof inputOption.value === "boolean") {
                        inputOption.value = inputOption.element.checked;
                    }
                    NaturalSelection.updateTickCounter();

                    if (CookieHandler.cookie === null) { CookieHandler.cookie = {}; }
                    const serialisedOptions: SerialisedNaturalSelectionOptions = {
                        tickLimit: NaturalSelection.options.tickLimit.value,
                        populationSize: NaturalSelection.options.populationSize.value,
                        survivalHarshness: NaturalSelection.options.survivalHarshness.value,
                        reproductionHarshness: NaturalSelection.options.reproductionHarshness.value,
                        mutationRate: NaturalSelection.options.mutationRate.value,
                        parentShouldMutate: NaturalSelection.options.parentShouldMutate.value,
                    };
                    CookieHandler.cookie.naturalSelectionOptions = serialisedOptions;
                    CookieHandler.updateCookie();
                }
            });
            this.updateTickCounter();
        });
    }
}
export type SerialisedNaturalSelectionOptions = {
    tickLimit: number,
    populationSize: number,
    survivalHarshness: number,
    reproductionHarshness: number,
    mutationRate: number,
    parentShouldMutate: boolean,
};
type NaturalSelectionOptions = {
    tickLimit: { element: HTMLInputElement, value: number },
    populationSize: { element: HTMLInputElement, value: number },
    survivalHarshness: { element: HTMLInputElement, value: number },
    reproductionHarshness: { element: HTMLInputElement, value: number },
    mutationRate: { element: HTMLInputElement, value: number },
    parentShouldMutate: { element: HTMLInputElement, value: boolean },
};
type NaturalSelectionEntry = {
    generation: number;
    populationSize: number;
    survivors: number | undefined;
    bestScore: number | undefined;
}