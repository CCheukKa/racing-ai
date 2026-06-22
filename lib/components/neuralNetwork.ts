import type { Car } from "../cars";
import { CookieHandler } from "../utils/cookieHandler";
import { Garage } from "./garage";
import { drawCircle, drawLine, drawText } from "../utils/canvasUtils";
import { Looper } from "../looper";
import { MathExtra } from "../utils/mathExtra";
import { NaturalSelection } from "./naturalSelection";
import { Stadium } from "./stadium";
import { UI } from "@lib/UI";

export class NeuralNetwork {
    /* ---------------------------------- Logic --------------------------------- */

    public static activationFunction = (x: number): number => Math.tanh(x);

    public static hiddenLayerSizes: number[] = [];
    public static getInputLayerSize(): number {
        let size = 0;
        if (this.options.probeDistances.value) { size += Garage.probeAngles.length; } // Probe distances
        if (this.options.carSpeed.value) { size++; }
        if (this.options.carAngle.value) { size++; }
        if (this.options.carPosition.value) { size += 2; } // x and y position
        if (this.options.trackAngle.value) { size++; }
        if (this.options.lapCount.value) { size++; }
        if (this.options.onTrack.value) { size++; }
        if (this.options.roadScore.value) { size++; }
        if (this.options.performanceScore.value) { size++; }
        if (this.options.currentTick.value) { size++; }
        return size;
    }
    public static getInputLayerValues(car: Car, inputOptions?: SerialisedInputLayerOptions): number[] {
        let options = {
            probeDistances: inputOptions?.probeDistances ?? this.options.probeDistances.value,
            carSpeed: inputOptions?.carSpeed ?? this.options.carSpeed.value,
            carAngle: inputOptions?.carAngle ?? this.options.carAngle.value,
            carPosition: inputOptions?.carPosition ?? this.options.carPosition.value,
            trackAngle: inputOptions?.trackAngle ?? this.options.trackAngle.value,
            lapCount: inputOptions?.lapCount ?? this.options.lapCount.value,
            onTrack: inputOptions?.onTrack ?? this.options.onTrack.value,
            roadScore: inputOptions?.roadScore ?? this.options.roadScore.value,
            performanceScore: inputOptions?.performanceScore ?? this.options.performanceScore.value,
            currentTick: inputOptions?.currentTick ?? this.options.currentTick.value,
        };
        let inputLayerValues = [
            ...options.probeDistances ? car.probes.map(probe => probe.distance) : [],
            options.carSpeed ? car.speed : NaN,
            options.carAngle ? car.angle : NaN,
            ...options.carPosition ? [car.x - Stadium.STADIUM_WIDTH / 2, car.y - Stadium.STADIUM_HEIGHT / 2] : [],
            options.trackAngle ? car.originAngle : NaN,
            options.lapCount ? car.lapCount : NaN,
            options.onTrack ? (car.isOnTrack ? 1 : 0) : NaN,
            options.roadScore ? car.score : NaN,
            options.performanceScore ? Stadium.getPerformanceScore(car, Looper.tickCount) : NaN,
            options.currentTick ? Looper.tickCount : NaN
        ].filter(value => !isNaN(value));
        return inputLayerValues;
    }

    /* ----------------------------------- UI ----------------------------------- */

    private static neuralNetworkCanvas = document.getElementById('neuralNetworkCanvas') as HTMLCanvasElement;
    private static neuralNetworkCtx = this.neuralNetworkCanvas.getContext('2d') as CanvasRenderingContext2D;

    private static inputLayerElement = document.getElementById('inputLayer') as HTMLDivElement;
    private static outputLayerElement = document.getElementById('outputLayer') as HTMLDivElement;
    private static hiddenLayerInput = document.getElementById('hiddenLayers') as HTMLInputElement;


    public static serialiseInputLayerOptions(): SerialisedInputLayerOptions {
        return {
            probeDistances: this.options.probeDistances.value!,
            carSpeed: this.options.carSpeed.value!,
            carAngle: this.options.carAngle.value!,
            carPosition: this.options.carPosition.value!,
            trackAngle: this.options.trackAngle.value!,
            lapCount: this.options.lapCount.value!,
            onTrack: this.options.onTrack.value!,
            roadScore: this.options.roadScore.value!,
            performanceScore: this.options.performanceScore.value!,
            currentTick: this.options.currentTick.value!,
        };
    }
    private static options: NeuralNetworkInputOptions = {
        probeDistances: { element: document.getElementById('probeDistances') as HTMLInputElement },
        carSpeed: { element: document.getElementById('carSpeed') as HTMLInputElement },
        carAngle: { element: document.getElementById('carAngle') as HTMLInputElement },
        carPosition: { element: document.getElementById('carPosition') as HTMLInputElement },
        trackAngle: { element: document.getElementById('trackAngle') as HTMLInputElement },
        lapCount: { element: document.getElementById('lapCount') as HTMLInputElement },
        onTrack: { element: document.getElementById('onTrack') as HTMLInputElement },
        roadScore: { element: document.getElementById('roadScore') as HTMLInputElement },
        performanceScore: { element: document.getElementById('performanceScore') as HTMLInputElement },
        currentTick: { element: document.getElementById('tickNumber') as HTMLInputElement },
    } as const;

    public static redraw() {
        const { layerSizes, layerCount, nodeRadius } = NeuralNetwork.redrawNeuralNetwork();
        if (layerSizes.length !== layerCount) {
            throw new Error(`Layer sizes length (${layerSizes.length}) does not match layer count (${layerCount})`);
        }

        // update layer container
        this.inputLayerElement.innerHTML = layerSizes[0]!.toString();
        this.outputLayerElement.innerHTML = layerSizes[layerCount - 1]!.toString();
        this.inputLayerElement.parentElement!.style.marginLeft = `${nodeRadius}px`;
        this.outputLayerElement.parentElement!.style.marginRight = `${nodeRadius}px`;
    }

    public static redrawNeuralNetwork(network?: Network | undefined, probeAngles: number[] = Garage.probeAngles, carColour: string = Garage.GARAGE_CAR_COLOUR, canvas: HTMLCanvasElement = this.neuralNetworkCanvas, ctx: CanvasRenderingContext2D = this.neuralNetworkCtx): { layerSizes: number[], layerCount: number, nodeRadius: number } {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // calculate node positions
        const layerSizes = network
            ? [network.inputNodes, ...network.layers.map(layer => layer.nodes.length)]
            : [this.getInputLayerSize(), ...this.hiddenLayerSizes, 2];

        console.log('Neural Network Layer Sizes:', layerSizes);

        const layerCount = layerSizes.length;
        const maxLayerSize = Math.max(...layerSizes);
        const nodeRadius = Math.min(
            canvas.height / maxLayerSize / 2 - 2,
            canvas.width / layerCount / 2 - 3
        );
        const nodeHeight = canvas.height / maxLayerSize;
        const layerWidth = (canvas.width - nodeRadius * 2) / (layerCount - 1);
        const nodePositions: { x: number; y: number; }[][] = [];
        for (let i = 0; i < layerCount; i++) {
            const layerSize = layerSizes[i]!;
            const layerX = nodeRadius + i * layerWidth;
            nodePositions[i] = [];
            const totalNodesHeight = layerSize * nodeHeight;
            const verticalOffset = (canvas.height - totalNodesHeight) / 2;
            for (let j = 0; j < layerSize; j++) {
                const nodeY = verticalOffset + j * nodeHeight + nodeHeight / 2;
                nodePositions[i]!.push({ x: layerX, y: nodeY });
            }
        }

        // draw connections
        for (let i = 0; i <= layerCount - 2; i++) {
            const previousLayerSize = layerSizes[i]!;
            const thisLayerSize = layerSizes[i + 1]!;
            for (let j = 0; j < thisLayerSize; j++) {
                const { x: x1, y: y1 } = nodePositions[i + 1]![j]!;
                for (let k = 0; k < previousLayerSize; k++) {
                    const { x: x2, y: y2 } = nodePositions[i]![k]!;

                    if (network) {
                        const weight = network.layers[i]!.nodes[j]!.weights[k]!;
                        const alpha = MathExtra.interpolate(Math.abs(weight), [0, 1], [0, 0.5]);
                        const width = MathExtra.interpolate(Math.abs(weight), [0, 1], [0.05, 3]);
                        const v = weight >= 0 ? 255 : 0;
                        drawLine(ctx, x1, y1, x2, y2, width, `rgba(${v}, ${v}, ${v}, ${alpha})`);
                    } else {
                        drawLine(ctx, x1, y1, x2, y2, 1, '#ffffff40');
                    }
                }
            }
        }

        // draw nodes
        for (let i = 0; i < layerCount; i++) {
            const layerSize = layerSizes[i]!;
            for (let j = 0; j < layerSize; j++) {
                const { x, y } = nodePositions[i]![j]!;
                if (i === 0 || i === layerCount - 1) {
                    const colour = i === 0 ? carColour : Stadium.TRACK_COLOUR;
                    drawCircle(ctx, x, y, nodeRadius, colour);
                } else {

                    if (network) {
                        const bias = network.layers[i - 1]!.nodes[j]!.bias;
                        const v = MathExtra.interpolate(bias, [-0.5, 0.5], [0, 255]);
                        drawCircle(ctx, x, y, nodeRadius, `rgba(${v}, ${v}, ${v}, 1)`);

                        drawCircle(ctx, x, y, nodeRadius, carColour, true);
                    } else {
                        // Hollow centres
                        ctx.globalCompositeOperation = 'destination-out';
                        drawCircle(ctx, x, y, nodeRadius, '#ffffff');
                        ctx.globalCompositeOperation = 'source-over'; // Reset to default

                        drawCircle(ctx, x, y, nodeRadius, '#ffffff', true);
                    }
                }
            }
        }

        // draw node labels
        const fontSize = nodeRadius * 1.6;
        if (this.options.probeDistances.value) {
            for (let i = 0; i < probeAngles.length; i++) {
                const { x, y } = nodePositions[0]![i]!;
                drawText(ctx, `P`, x, y + fontSize * 0.1125, '#000000', { fontSize, bold: true });
            }
        }
        drawText(ctx, `↕`, nodePositions[layerCount - 1]![0]!.x, nodePositions[layerCount - 1]![0]!.y, '#000000', { fontSize, bold: true, strokeWidth: 0.5 });
        drawText(ctx, `↔`, nodePositions[layerCount - 1]![1]!.x, nodePositions[layerCount - 1]![1]!.y, '#000000', { fontSize, bold: true, strokeWidth: 0.5 });
        return { layerSizes, layerCount, nodeRadius };
    }

    /* ---------------------------------- Code ---------------------------------- */

    public static init() {
        this.neuralNetworkCanvas.width = 350;
        this.neuralNetworkCanvas.height = 220;

        UI.lockableElements.push(this.hiddenLayerInput);

        document.addEventListener('DOMContentLoaded', () => {
            if (CookieHandler.cookie?.hiddenLayerSizes) {
                const cookieHiddenLayerSizes = CookieHandler.cookie.hiddenLayerSizes;

                this.hiddenLayerInput.value = cookieHiddenLayerSizes.join(' ');
                this.hiddenLayerSizes = cookieHiddenLayerSizes;
            }

            if (CookieHandler.cookie?.inputLayerOptions) {
                const cookieInputLayerOptions = CookieHandler.cookie.inputLayerOptions as SerialisedInputLayerOptions;
                Object.keys(this.options).forEach((key) => {
                    const typedKey = key as keyof typeof NeuralNetwork.options;
                    if (cookieInputLayerOptions[typedKey] !== undefined) {
                        this.options[typedKey].value = cookieInputLayerOptions[typedKey];
                        this.options[typedKey].element.checked = cookieInputLayerOptions[typedKey];
                    }
                });
            }

            Object.keys(this.options).forEach((key) => {
                const typedKey = key as keyof typeof NeuralNetwork.options;
                const inputOption = this.options[typedKey];
                if (!inputOption.element) { throw new Error(`Input element for ${typedKey} not found`); }
                UI.lockableElements.push(inputOption.element);

                inputOption.element.addEventListener('change', onInputChange);
                onInputChange();

                function onInputChange() {
                    if (UI.inputsLocked) { return; }
                    inputOption.value = inputOption.element.checked;
                    NeuralNetwork.redraw();

                    if (CookieHandler.cookie === null) { CookieHandler.cookie = {}; }
                    CookieHandler.cookie.inputLayerOptions = NeuralNetwork.serialiseInputLayerOptions();
                    CookieHandler.updateCookie();
                }
            });

            this.redraw();
        });
        this.hiddenLayerInput.addEventListener('input', () => {
            if (UI.inputsLocked) { return; }
            this.hiddenLayerInput.value = this.hiddenLayerInput.value.replace(/[^0-9 ]/g, '');
            const input = this.hiddenLayerInput.value.trim();
            const newHiddenLayerSizes = input.split(' ').map(size => parseInt(size.trim(), 10)).filter(size => !isNaN(size) && size > 0);
            if (newHiddenLayerSizes.some(size => size > 50)) {
                alert('Hidden layer sizes must be between 1 and 50.');
                return;
            }
            this.hiddenLayerSizes = newHiddenLayerSizes;
            this.redraw();

            if (CookieHandler.cookie === null) { CookieHandler.cookie = {}; }
            CookieHandler.cookie.hiddenLayerSizes = this.hiddenLayerSizes;
            CookieHandler.updateCookie();
        });
    }
}
class LNodes {
    public weights: number[];
    public bias: number;

    constructor(numInputs: number) {
        this.weights = Array.from({ length: numInputs }, () => Math.random() - 0.5);
        this.bias = numInputs === 0 ? 0 : Math.random() - 0.5;
    }
}
class Layer {
    public nodes: LNodes[];

    constructor(numInputs: number, numNodes: number) {
        this.nodes = Array.from({ length: numNodes }, () => new LNodes(numInputs));
    }
}
export class Network {
    public inputNodes: number;
    public layers: Layer[];

    constructor(numNodesInLayer: number[]) {
        this.inputNodes = numNodesInLayer[0]!;
        this.layers = numNodesInLayer.slice(1).map((numNodes, index) => {
            const numInputs = index === 0 ? this.inputNodes : numNodesInLayer[index]!;
            return new Layer(numInputs, numNodes);
        });
    }

    predict(inputs: number[]): [number, number] {
        if (inputs.length !== this.inputNodes) {
            throw new Error(`Expected ${this.inputNodes} inputs, but got ${inputs.length}`);
        }

        let output = inputs;
        for (const layer of this.layers) {
            output = layer.nodes.map(node => {
                const weightedSum = node.weights.reduce((sum, weight, index) => sum + weight * output[index]!, 0);
                return NeuralNetwork.activationFunction(weightedSum + node.bias);
            });
        }
        if (output.length !== 2) {
            throw new Error(`Expected 2 outputs, but got ${output.length}`);
        }
        return output as [number, number];
    }
    mutate() {
        this.layers.forEach(layer => {
            layer.nodes.forEach(node => {
                node.weights = node.weights.map(weight => weight + (Math.random() - 0.5) * NaturalSelection.options.mutationRate.value);
                node.bias += (Math.random() - 0.5) * NaturalSelection.options.mutationRate.value;
            });
        });
        return this;
    }
    clone(): Network {
        const newNetwork = new Network([]);
        newNetwork.inputNodes = this.inputNodes;
        newNetwork.layers = this.layers.map(layer =>
            new Layer(layer.nodes[0]!.weights.length, layer.nodes.length)
        );
        newNetwork.layers.forEach((newLayer, index) => {
            newLayer.nodes.forEach((newNode, nodeIndex) => {
                const oldNode = this.layers[index]!.nodes[nodeIndex]!;
                newNode.weights = [...oldNode.weights];
                newNode.bias = oldNode.bias;
            });
        });
        return newNetwork;
    }
    getHash(): string {
        const wbString = this.layers.map(layer => layer.nodes.map(node => `${node.weights.join(',')},${node.bias}`).join(';')).join('|');
        const hash: string = MathExtra.sha1(wbString);
        return hash;
    }
}
export type SerialisedInputLayerOptions = {
    [key in keyof NeuralNetworkInputOptions]: boolean;
}
type NeuralNetworkInputOption = {
    element: HTMLInputElement;
    value?: boolean;
}
type NeuralNetworkInputOptions = {
    probeDistances: NeuralNetworkInputOption,
    carSpeed: NeuralNetworkInputOption,
    carAngle: NeuralNetworkInputOption,
    carPosition: NeuralNetworkInputOption,
    trackAngle: NeuralNetworkInputOption,
    lapCount: NeuralNetworkInputOption,
    onTrack: NeuralNetworkInputOption,
    roadScore: NeuralNetworkInputOption,
    performanceScore: NeuralNetworkInputOption,
    currentTick: NeuralNetworkInputOption,
};