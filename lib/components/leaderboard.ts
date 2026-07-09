import type { SerialisedCarData } from "../cars";
import { NeuralNetwork, type SerialisedInputLayerOptions } from "./neuralNetwork";
import { Garage } from "./garage";
import { UI } from "@lib/UI";

export class Leaderboard {

    /* ---------------------------------- Logic --------------------------------- */

    private static leaderboardElement = document.getElementById('leaderboard') as HTMLDivElement;
    private static leaderboardEntryTemplate = document.getElementById('leaderboardEntryTemplate') as HTMLTemplateElement;

    private static LEADERBOARD_MAX_ENTRIES = 100;

    public static leaderboard: SerialisedCarData[] = [];
    public static update() {
        console.log('Updating Leaderboard');
        this.leaderboard.sort((a, b) => b.score - a.score);
        this.leaderboard = this.leaderboard.slice(0, this.LEADERBOARD_MAX_ENTRIES);

        this.leaderboardElement.innerHTML = '';
        this.leaderboard.forEach((carData, index) => {
            console.log(carData);

            const entryElement = this.leaderboardEntryTemplate.content.cloneNode(true) as HTMLDivElement;
            entryElement.querySelector('.rank')!.textContent = (index + 1).toString();
            entryElement.querySelector('.id')!.textContent = carData.name || carData.hash.slice(0, 5);
            entryElement.querySelector('.generation')!.textContent = carData.generation.toString();
            (entryElement.querySelector('.score') as HTMLDivElement).title = carData.score.toString();
            entryElement.querySelector('.score')!.textContent = carData.score.toPrecision(4);
            (entryElement.querySelector('.lap') as HTMLDivElement).title = carData.lapCount.toString();
            entryElement.querySelector('.lap')!.textContent = carData.lapCount.toFixed(2);
            (entryElement.querySelector('.avgSpeed') as HTMLDivElement).title = carData.averageSpeed.toString();
            entryElement.querySelector('.avgSpeed')!.textContent = carData.averageSpeed.toFixed(4);
            (entryElement.querySelector('.onTrackPercentage') as HTMLDivElement).title = `${(carData.onTrackPercentage * 100)}%`;
            entryElement.querySelector('.onTrackPercentage')!.textContent = `${(carData.onTrackPercentage * 100).toFixed(2)}%`;

            // Store index as a data attribute for event delegation
            (entryElement.firstElementChild as HTMLElement).setAttribute('data-leaderboard-index', index.toString());

            this.leaderboardElement.appendChild(entryElement);
        });

        this.updatePeeker(this.lastMouseEvent);
    }

    private static carPeeker = document.getElementById('carPeeker') as HTMLDivElement;
    private static carPeekerTextContentElement = document.getElementById('carPeekerTextContent') as HTMLDivElement;
    private static CAR_PEEKER_NEURAL_NETWORK_WIDTH = 400;
    private static CAR_PEEKER_NEURAL_NETWORK_HEIGHT = 200;
    private static carPeekerNeuralNetworkCanvas = document.getElementById('carPeekerNeuralNetwork') as HTMLCanvasElement;
    private static carPeekerNeuralNetworkCtx = this.carPeekerNeuralNetworkCanvas.getContext('2d') as CanvasRenderingContext2D;
    private static carPeekerNeuralNetworkLayers = document.getElementById('carPeekerNeuralNetworkLayers') as HTMLDivElement;
    private static CAR_PEEKER_PROBE_ANGLES_WIDTH = 100;
    private static CAR_PEEKER_PROBE_ANGLES_HEIGHT = 100;
    private static carPeekerProbeAnglesCanvas = document.getElementById('carPeekerProbeAngles') as HTMLCanvasElement;
    private static carPeekerProbeAnglesCtx = this.carPeekerProbeAnglesCanvas.getContext('2d') as CanvasRenderingContext2D;
    private static carPeekerProbeAnglesList = document.getElementById('carPeekerProbeAnglesList') as HTMLDivElement;

    /* ----------------------------------- UI ----------------------------------- */

    private static selectedCarData: SerialisedCarData | null = null;
    private static resetLeaderboardButton = document.getElementById('resetLeaderboardButton') as HTMLButtonElement;
    private static exportSelectedCarButton = document.getElementById('exportSelectedCarButton') as HTMLButtonElement;
    private static lastMouseEvent: MouseEvent | null = null;

    private static updatePeeker = (event: MouseEvent | null) => {
        const { index } = this.getSelectedLeaderboardEntryIndex(event);

        if (index !== null && this.leaderboard[index]) {
            this.updateCarPeekerContent(this.leaderboard[index]);
            if (event) {
                const rect = this.leaderboardElement.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                const X_OFFSET = 10;
                const Y_OFFSET = 0;

                this.carPeeker.style.top = `${(y + rect.top) / UI.zoomFactor + Y_OFFSET}px`;
                this.carPeeker.style.left = `${(x + rect.left) / UI.zoomFactor + X_OFFSET}px`;
            }
            this.carPeeker.classList.remove('hidden');
            return;
        }

        this.carPeeker.classList.add('hidden');
        return;
    };
    private static updateCarPeekerContent(carData: SerialisedCarData) {
        this.carPeeker.style.setProperty('--carColour', carData.colour);

        const carInputs: string[] = [];
        for (const option in carData.inputLayerOptions) {
            if (carData.inputLayerOptions[option as keyof SerialisedInputLayerOptions]) {
                carInputs.push(option);
            }
        }

        const content: string[] = [
            // @ts-ignore
            carData.name ? `Name: ${carData.name}` : null,
            `Hash: ${carData.hash.slice(0, 8)}...`,
            `Score: ${carData.score.toFixed(2)}`,
            `Lap: ${carData.lapCount.toFixed(2)}`,
            `Avg Speed: ${carData.averageSpeed.toFixed(4)}`,
            `On Track: ${(carData.onTrackPercentage * 100).toFixed(2)}%`,
            `Generation: ${carData.generation}`,
            `Inputs: [
            <br>
                &nbsp;&nbsp;&nbsp;&nbsp;${carInputs.join(',<br>&nbsp;&nbsp;&nbsp;&nbsp;')}
            <br>
            ]`,
        ].filter(string => string !== null);
        this.carPeekerTextContentElement.innerHTML = content.join('<br>');

        NeuralNetwork.redrawNeuralNetwork(
            carData.network,
            carData.probeAngles,
            carData.colour,
            this.carPeekerNeuralNetworkCanvas,
            this.carPeekerNeuralNetworkCtx
        );
        this.carPeekerNeuralNetworkLayers.innerHTML = `Layers: ${[carData.network.inputNodes, ...carData.network.layers.map(layer => layer.nodes.length)].join(', ')}`;

        Garage.redrawCarProbes(
            1,
            carData.probeAngles,
            carData.colour,
            this.carPeekerProbeAnglesCanvas,
            this.carPeekerProbeAnglesCtx
        );
        this.carPeekerProbeAnglesList.innerHTML = `Angles: ${carData.probeAngles.map(angle => `${Math.round(angle * 180 / Math.PI * 100000) / 100000}°`).join(', ')}`;
    }

    private static getSelectedLeaderboardEntryIndex(event: MouseEvent | null): { index: number | null, entry: HTMLElement | null } {
        if (!event) { return { index: null, entry: null }; }

        const entry = (event?.target as HTMLElement ?? this.leaderboardElement).closest('[data-leaderboard-index]') as HTMLElement | null;
        if (entry) {
            const index = parseInt(entry.getAttribute('data-leaderboard-index') || '', 10);
            if (!isNaN(index) && this.leaderboard[index]) {
                return { index, entry };
            }
        }
        return { index: null, entry: null };
    }

    private static selectCar(event: MouseEvent) {
        const { index, entry } = this.getSelectedLeaderboardEntryIndex(event);
        if (index === null || !this.leaderboard[index]) { return; }

        this.selectedCarData = this.leaderboard[index];

        this.leaderboardElement.querySelectorAll('.entry').forEach(el => el.classList.remove('selected'));
        entry?.classList.add('selected');
    }

    /* ---------------------------------- Code ---------------------------------- */

    public static init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.carPeekerNeuralNetworkCanvas.width = this.CAR_PEEKER_NEURAL_NETWORK_WIDTH;
            this.carPeekerNeuralNetworkCanvas.height = this.CAR_PEEKER_NEURAL_NETWORK_HEIGHT;

            this.carPeekerProbeAnglesCanvas.width = this.CAR_PEEKER_PROBE_ANGLES_WIDTH;
            this.carPeekerProbeAnglesCanvas.height = this.CAR_PEEKER_PROBE_ANGLES_HEIGHT;
        });

        this.leaderboardElement.addEventListener('mousemove', (event) => {
            this.lastMouseEvent = event;
            this.updatePeeker(event);
        });
        this.leaderboardElement.addEventListener('click', (event) => {
            this.lastMouseEvent = event;
            this.updatePeeker(event);
            this.selectCar(event);
        });

        this.leaderboardElement.addEventListener('scroll', () => {
            this.lastMouseEvent = null;
            this.carPeeker.classList.add('hidden');
        });
        this.leaderboardElement.addEventListener('mouseleave', () => {
            this.lastMouseEvent = null;
            this.carPeeker.classList.add('hidden');
        });

        this.resetLeaderboardButton.addEventListener('click', () => {
            if (!confirm('Are you sure you want to reset the leaderboard?')) { return; }
            this.leaderboard = [];
            this.update();
            console.log('Leaderboard reset');
        });

        this.exportSelectedCarButton.addEventListener('click', () => {
            if (!this.selectedCarData) {
                alert('Please select a car from the leaderboard first.');
                return;
            }
            const name = this.selectedCarData.name || prompt('Enter a name for the car (optional):');
            if (name !== null) { this.selectedCarData.name = name; }
            const blob = new Blob([JSON.stringify(this.selectedCarData, null, 4)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `car${name ? `_${name}` : ''}_${this.selectedCarData.hash}.json`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }
}