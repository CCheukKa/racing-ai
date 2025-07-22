let areInputsLocked = false;

document.addEventListener('DOMContentLoaded', () => {
    Array.from(document.getElementsByClassName('whatText')).forEach(e => {
        const element = e as HTMLElement;
        element.style.width = element.parentElement?.clientWidth + 'px';
        element.style.height = element.parentElement?.clientHeight + 'px';
    });
});

//! main
const tickLoopButton = document.getElementById('tickLoopButton') as HTMLButtonElement;
tickLoopButton.addEventListener('click', () => {
    const firstRun = generationLooper === null;

    if (firstRun) {
        const successful = createInitialBatch();
        if (!successful) { return; }

        generationLoopButton.disabled = false;
        lockInputs(true);
    }

    tickLoopPaused = !tickLoopPaused;
    tickLoopButton.textContent = tickLoopPaused ? 'Resume' : 'Pause';

    if (firstRun) {
        generationLooper = generationLoop();
        runLoop(generationLooper);
    }
});

const generationLoopButton = document.getElementById('generationLoopButton') as HTMLButtonElement;
generationLoopButton.addEventListener('click', () => {
    if (!generationLoopStopped) {
        generationLoopStopped = true;
        generationLoopButton.disabled = true;
    }
});

const stadiumContainer = document.getElementById('stadiumContainer') as HTMLDivElement;
const STADIUM_WIDTH = stadiumContainer.clientWidth;
const STADIUM_HEIGHT = stadiumContainer.clientHeight;
const trackCanvas = document.getElementById('trackCanvas') as HTMLCanvasElement;
const trackCtx = trackCanvas.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
const carCanvas = document.getElementById('carCanvas') as HTMLCanvasElement;
const carCtx = carCanvas.getContext('2d') as CanvasRenderingContext2D;
const hintCanvas = document.getElementById('hintCanvas') as HTMLCanvasElement;
const hintCtx = hintCanvas.getContext('2d') as CanvasRenderingContext2D;
document.addEventListener('DOMContentLoaded', () => {
    stadiumContainer.style.width = `${STADIUM_WIDTH}px`;
    stadiumContainer.style.height = `${STADIUM_HEIGHT}px`;
    trackCanvas.width = STADIUM_WIDTH;
    trackCanvas.height = STADIUM_HEIGHT;
    carCanvas.width = STADIUM_WIDTH;
    carCanvas.height = STADIUM_HEIGHT;
    hintCanvas.width = STADIUM_WIDTH;
    hintCanvas.height = STADIUM_HEIGHT;
});

//! garage
const garageCanvas = document.getElementById('garageCanvas') as HTMLCanvasElement;
const garageCtx = garageCanvas.getContext('2d') as CanvasRenderingContext2D;
garageCanvas.width = 300;
garageCanvas.height = 300;

const probeAnglesInput = document.getElementById('probeAngles') as HTMLTextAreaElement;

//! neural network
const neuralNetworkCanvas = document.getElementById('neuralNetworkCanvas') as HTMLCanvasElement;
const neuralNetworkCtx = neuralNetworkCanvas.getContext('2d') as CanvasRenderingContext2D;
neuralNetworkCanvas.width = 350;
neuralNetworkCanvas.height = 220;

const layerContainer = document.getElementById('layerContainer') as HTMLDivElement;
const inputLayerElement = document.getElementById('inputLayer') as HTMLDivElement;
const outputLayerElement = document.getElementById('outputLayer') as HTMLDivElement;
const hiddenLayerInput = document.getElementById('hiddenLayers') as HTMLInputElement;

//! lock inputs
const lockableElements: (HTMLButtonElement | HTMLTextAreaElement | HTMLInputElement)[] = [probeAnglesInput, hiddenLayerInput];
function lockInputs(lock: boolean) {
    if (areInputsLocked === lock) { return };
    areInputsLocked = lock;
    lockableElements.forEach(element => {
        element.disabled = lock;
    });
}

//#region Track UI
/* -------------------------------- Track UI -------------------------------- */
const TRACK_COLOUR = '#e0e0e0';
const TRACK_WIDTH = 50;

const TRACK_START_X = STADIUM_WIDTH / 2;
const TRACK_START_Y = STADIUM_HEIGHT / 4;

let isLeftMouseDown = false;
let isRightMouseDown = false;
let previousX: number | undefined;
let previousY: number | undefined;

let trackData: Uint8ClampedArray<ArrayBufferLike> = new Uint8ClampedArray();

document.addEventListener('contextmenu', (event: MouseEvent) => {
    event.preventDefault();
});
document.addEventListener('mousedown', (event: MouseEvent) => {
    const rect = trackCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    switch (event.button) {
        case 0: // Left button
            handleLeftClick(x, y, event.target);
            break;
        case 1: // Middle button
            spawnCar(x, y);
            break;
        case 2: // Right button
            handleRightClick(x, y, event.target);
            break;
        default:
            return;
    }
});
document.addEventListener('touchstart', (event: TouchEvent) => {
    const rect = trackCanvas.getBoundingClientRect();
    const x = event.touches[0].clientX - rect.left;
    const y = event.touches[0].clientY - rect.top;

    handleLeftClick(x, y, event.touches[0].target);
});
document.addEventListener('mousemove', (event: MouseEvent) => {
    const rect = trackCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    handleMouseMove(x, y);
});
document.addEventListener('touchmove', (event: TouchEvent) => {
    const rect = trackCanvas.getBoundingClientRect();
    const x = event.touches[0].clientX - rect.left;
    const y = event.touches[0].clientY - rect.top;

    handleMouseMove(x, y);
});
document.addEventListener('mouseup', () => {
    handleMouseUp();
});
document.addEventListener('touchend', () => {
    handleMouseUp();
    redrawHint(NaN, NaN);
});
function handleLeftClick(x: number, y: number, target: EventTarget | null) {
    if (shouldDiscardEvent(target)) { return; }

    isLeftMouseDown = true;
    isRightMouseDown = false;
    handleMouseMove(x, y);
}
function handleRightClick(x: number, y: number, target: EventTarget | null) {
    if (shouldDiscardEvent(target)) { return; }

    isLeftMouseDown = false;
    isRightMouseDown = true;
    handleMouseMove(x, y);
}
function handleMouseMove(x: number, y: number) {
    redrawHint(x, y);

    if (isLeftMouseDown) {
        drawCircle(trackCtx, x, y, TRACK_WIDTH / 2, TRACK_COLOUR);
        if (previousX !== undefined && previousY !== undefined) {
            drawLine(trackCtx, previousX, previousY, x, y, TRACK_WIDTH, TRACK_COLOUR);
        }
        previousX = x;
        previousY = y;

        trackData = trackCtx.getImageData(0, 0, STADIUM_WIDTH, STADIUM_HEIGHT).data;
    }
    if (isRightMouseDown) {
        trackCtx.globalCompositeOperation = 'destination-out';
        drawCircle(trackCtx, x, y, TRACK_WIDTH / 2, '#ffffff');
        if (previousX !== undefined && previousY !== undefined) {
            drawLine(trackCtx, previousX, previousY, x, y, TRACK_WIDTH, '#ffffff');
        }
        trackCtx.globalCompositeOperation = 'source-over'; // Reset to default
        previousX = x;
        previousY = y;

        trackData = trackCtx.getImageData(0, 0, STADIUM_WIDTH, STADIUM_HEIGHT).data;
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

document.addEventListener('DOMContentLoaded', () => { redrawHint(NaN, NaN); });
function redrawHint(x: number, y: number) {
    hintCtx.clearRect(0, 0, STADIUM_WIDTH, STADIUM_HEIGHT);
    drawCircle(hintCtx, TRACK_START_X, TRACK_START_Y, 5, '#ff0000'); // Track start
    drawCircle(hintCtx, TRACK_START_X, TRACK_START_Y, 5, '#000000', true); // Track start
    drawCircle(hintCtx, STADIUM_WIDTH / 2, STADIUM_HEIGHT / 2, 5, '#000000', true); // Track center
    drawCircle(hintCtx, x, y, TRACK_WIDTH / 2, '#ffffff', true); // Cursor
}
//#endregion

//#region Cars
/* ---------------------------------- Cars ---------------------------------- */

const CAR_WIDTH = 20;
const CAR_HEIGHT = 10;

class Probe {
    public angle: number;
    public distance: number = Infinity;

    constructor(angle: number) {
        this.angle = angle;
    }
}

class Car {
    public colour: string;

    public x: number;
    public y: number;
    public angle: number = 0;
    public speed: number = 0;
    public originAngle: number = 0;
    public previousOriginAngle: number | undefined;
    public isOnTrack: boolean = true;

    public engineInput: number = 0;
    public steerInput: number = 0;

    public probes: Probe[] = [];

    public network: Network;

    public lapCount: number = 0;
    public score: number = 0;
    public rank: number = NaN;

    public grassTicks: number = 0;
    public speedSum: number = 0;

    constructor(x: number = TRACK_START_X, y: number = TRACK_START_Y, probeAngles: number[] = []) {
        this.x = x;
        this.y = y;
        this.probes = probeAngles.map(angle => new Probe(angle));
        this.network = new Network([getInputLayerSize(), ...hiddenLayerSizes, 2]);

        this.colour = getRandomColour()
    }

    reset() {
        this.x = TRACK_START_X;
        this.y = TRACK_START_Y;
        this.angle = 0;
        this.speed = 0;
        this.originAngle = 0;
        this.previousOriginAngle = undefined;
        this.isOnTrack = true;
        this.lapCount = 0;
        this.score = 0;
        this.rank = NaN;
        this.grassTicks = 0;
        this.speedSum = 0;
    }

    move() {
        this.engineInput = clamp(this.engineInput, -1, 1);
        this.steerInput = clamp(this.steerInput, -1, 1);

        this.isOnTrack = isOnTrack({ x: this.x, y: this.y });

        if (this.engineInput > 0) {
            this.speed += 0.01 * this.engineInput; // Accelerate
        } else if (this.engineInput < 0) {
            if (this.speed > 0) {
                this.speed += 0.02 * this.engineInput; // Brake
            } else {
                this.speed += 0.01 * this.engineInput; // Reverse
            }
        } else {
            this.speed *= 0.99; // Friction
        }

        this.speed = clamp(this.speed, -1, 5); // Limit speed
        this.speed *= this.isOnTrack ? 1 : 0.99; // Slow down on grass

        const turnSpeed = 0.02 * map(this.speed, -1, 1, -1, 1, true);
        this.angle += turnSpeed * this.steerInput; // Steer

        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        this.originAngle = Math.atan2(this.y - STADIUM_HEIGHT / 2, this.x - STADIUM_WIDTH / 2);
    }

    updateProbes() {
        this.probes.forEach(probe => {
            probe.distance = raycastDistance(this, probe.angle);
        });
    }

    clone(): Car {
        const newCar = new Car(this.x, this.y, this.probes.map(probe => probe.angle));
        newCar.network = this.network.clone();
        return newCar;
    }
}

let throttleButtonPressed = false;
let brakeButtonPressed = false;
let leftButtonPressed = false;
let rightButtonPressed = false;
document.addEventListener('keydown', handleKeyEvent);
document.addEventListener('keyup', handleKeyEvent);
function handleKeyEvent(event: KeyboardEvent) {
    const isPressed = event.type === 'keydown';
    switch (event.key) {
        case 'ArrowUp':
            throttleButtonPressed = isPressed;
            break;
        case 'ArrowDown':
            brakeButtonPressed = isPressed;
            break;
        case 'ArrowLeft':
            leftButtonPressed = isPressed;
            break;
        case 'ArrowRight':
            rightButtonPressed = isPressed;
            break;
    }
}

function tickDo() {
    updateTickCounter();
    processCars();
    drawCars();
    cars.forEach(updateRoadScore);
}

function processCars() {
    cars.forEach(car => {
        car.engineInput = +throttleButtonPressed - +brakeButtonPressed;
        car.steerInput = +rightButtonPressed - +leftButtonPressed;

        car.updateProbes();
        [car.engineInput, car.steerInput] = car.network.predict(getInputLayerValues(car));
        car.move();
    });
}

function spawnCar(x: number, y: number) {
    if (x < 0 || x >= STADIUM_WIDTH || y < 0 || y >= STADIUM_HEIGHT) {
        console.warn('Spawn coordinates out of bounds');
        return;
    }

    const car = new Car(x, y, probeAngles);
    cars.push(car);
    drawCars();
}

function drawCars() {
    carCtx.clearRect(0, 0, STADIUM_WIDTH, STADIUM_HEIGHT);
    carCtx.save();

    cars.forEach(car => {
        carCtx.translate(car.x, car.y);
        carCtx.rotate(car.angle);

        car.probes.forEach(probe => {
            const probeLength = probe.distance;
            const probeX = Math.cos(probe.angle) * probeLength;
            const probeY = Math.sin(probe.angle) * probeLength;

            carCtx.strokeStyle = `${car.colour}60`;
            carCtx.lineWidth = 2;
            carCtx.beginPath();
            carCtx.moveTo(0, 0);
            carCtx.lineTo(probeX, probeY);
            carCtx.stroke();
        });

        drawRectangle(carCtx, -CAR_WIDTH / 2, -CAR_HEIGHT / 2, CAR_WIDTH, CAR_HEIGHT, car.colour);
        drawRectangle(carCtx, -CAR_WIDTH / 2, -5, CAR_WIDTH, CAR_HEIGHT, '#000000', true);
        carCtx.resetTransform();
    });

    carCtx.restore();
}

function raycastDistance(car: Car, angle: number): number {
    const rayOrigin = { x: car.x, y: car.y };
    const cosAngle = Math.cos(car.angle + angle);
    const sinAngle = Math.sin(car.angle + angle);
    const maxDistance = 200;
    const stepSize = 10;

    for (let distance = 0; distance < maxDistance; distance += stepSize) {
        const rayEnd = {
            x: rayOrigin.x + cosAngle * distance,
            y: rayOrigin.y + sinAngle * distance
        };
        if (!isOnTrack(rayEnd)) {
            return distance;
        }
    }
    return maxDistance;
}

function isOnTrack(point: { x: number, y: number }): boolean {
    if (point.x < 0 || point.x >= STADIUM_WIDTH || point.y < 0 || point.y >= STADIUM_HEIGHT) {
        return false; // Out of bounds
    }

    const x = Math.floor(point.x);
    const y = Math.floor(point.y);
    const index = (y * STADIUM_WIDTH + x) * 4;
    return trackData[index + 3] !== 0; // Check alpha channel
}

function updateRoadScore(car: Car) {
    car.score += car.isOnTrack ? 0.2 : -5;
    if (car.isOnTrack) {
        car.score += interpolate(car.speed, [-1, 0, 1, 5], [-3, -2, 1, 4]);
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

    car.grassTicks -= +car.isOnTrack;
    car.speedSum += car.speed;

    // console.log(`Car at (${car.x.toFixed(2)}, ${car.y.toFixed(2)}) - Speed: ${car.speed.toFixed(2)}, Score: ${car.score.toFixed(2)}, Lap Count: ${car.lapCount.toFixed(2)}`);
}

function getPerformanceScore(car: Car, atTick: number) {
    let score = 0;
    score += car.lapCount * ((atTick - car.grassTicks) / atTick) ** 2 * 100;
    score += interpolate(car.speedSum / atTick, [0, 1], [-100, 100]);
    return score;
}
//#endregion

//#region Garage UI
/* -------------------------------- Garage UI ------------------------------- */
const GARAGE_CAR_COLOUR = '#ffa0a0';

let probeAngles: number[] = [];
probeAnglesInput.addEventListener('input', () => {
    if (areInputsLocked) { return; }
    probeAnglesInput.value = probeAnglesInput.value
        .replace(/[^0-9-+.\n]/g, '')
        .replace(/--/g, '+')
        .replace(/\+-/g, '-')
        .replace(/-\+/g, '-')
        .replace(/\++/g, '+')
        .replace(/\.+/g, '.')
        .replace(/([+-])0+/gm, '$10')
        .replace(/^0+/gm, '0')

        .replace(/(?<=[0-9.])([\+-])/g, '\n$1');
    onProbeAnglesInput();
});
probeAnglesInput.addEventListener('blur', () => {
    if (areInputsLocked) { return; }
    probeAnglesInput.value = probeAnglesInput.value
        .replace(/([\+-])\./g, '$10.')
        .replace(/^\./gm, '0.')
        .replace(/\.$/gm, '');
    onProbeAnglesInput();
});
document.addEventListener('DOMContentLoaded', onProbeAnglesInput);
function onProbeAnglesInput() {
    probeAngles = probeAnglesInput.value.trim().split('\n')
        .map(angle => parseFloat(angle.trim()) * (Math.PI / 180))
        .filter(angle => !isNaN(angle));
    redrawGarage();
    redrawNeuralNetwork();
}

document.addEventListener('DOMContentLoaded', redrawGarage);
function redrawGarage() {
    garageCtx.clearRect(0, 0, garageCanvas.width, garageCanvas.height);

    garageCtx.save();
    garageCtx.translate(garageCanvas.width / 2, garageCanvas.height / 2);
    garageCtx.rotate(-Math.PI / 2);

    const CAR_SCALE = 2;
    const scaledCarWidth = CAR_WIDTH * CAR_SCALE;
    const scaledCarHeight = CAR_HEIGHT * CAR_SCALE;
    drawRectangle(garageCtx, -scaledCarWidth / 2, -scaledCarHeight / 2, scaledCarWidth, scaledCarHeight, GARAGE_CAR_COLOUR);

    probeAngles.forEach(angle => {
        drawLine(garageCtx, 0, 0, Math.cos(angle) * 100, Math.sin(angle) * 100, 2, GARAGE_CAR_COLOUR);
    });

    drawRectangle(garageCtx, -scaledCarWidth / 2, -scaledCarHeight / 2, scaledCarWidth, scaledCarHeight, '#000000', true);

    garageCtx.restore();
}

//#endregion

//#region Neural Network
/* ----------------------------- Neural Network ----------------------------- */

const activationFunction = (x: number): number => Math.tanh(x);

let hiddenLayerSizes: number[] = [];

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

class Network {
    public inputNodes: number;
    public layers: Layer[];

    constructor(numNodesInLayer: number[]) {
        this.inputNodes = numNodesInLayer[0];
        this.layers = numNodesInLayer.slice(1).map((numNodes, index) => {
            const numInputs = index === 0 ? this.inputNodes : numNodesInLayer[index];
            return new Layer(numInputs, numNodes);
        });
    }

    predict(inputs: number[]): number[] {
        if (inputs.length !== this.inputNodes) {
            throw new Error(`Expected ${this.inputNodes} inputs, but got ${inputs.length}`);
        }

        let output = inputs;
        for (const layer of this.layers) {
            output = layer.nodes.map(node => {
                const weightedSum = node.weights.reduce((sum, weight, index) => sum + weight * output[index], 0);
                return activationFunction(weightedSum + node.bias);
            });
        }
        return output;
    }
    mutate() {
        this.layers.forEach(layer => {
            layer.nodes.forEach(node => {
                node.weights = node.weights.map(weight => weight + (Math.random() - 0.5) * naturalSelectionInputOptions.mutationRate.value);
                node.bias += (Math.random() - 0.5) * naturalSelectionInputOptions.mutationRate.value;
            });
        });
        return this;
    }
    clone(): Network {
        const newNetwork = new Network([]);
        newNetwork.inputNodes = this.inputNodes;
        newNetwork.layers = this.layers.map(layer =>
            new Layer(layer.nodes[0].weights.length, layer.nodes.length)
        );
        newNetwork.layers.forEach((newLayer, index) => {
            newLayer.nodes.forEach((newNode, nodeIndex) => {
                const oldNode = this.layers[index].nodes[nodeIndex];
                newNode.weights = [...oldNode.weights];
                newNode.bias = oldNode.bias;
            });
        });
        return newNetwork;
    }
    getHash(): string {
        const wbString = this.layers.map(layer => layer.nodes.map(node => `${node.weights.join(',')},${node.bias}`).join(';')).join('|');
        const hash: string = Array.from(wbString).reduce((hash, char) => {
            return (hash << 5) - hash + char.charCodeAt(0);
        }, 0).toString(36);
        return hash;
    }
}
//#endregion

//#region Neural Network UI
/* ----------------------------- Neural Network UI --------------------------- */
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
    tickNumber: NeuralNetworkInputOption,
};
const neuralNetworkInputOptions: NeuralNetworkInputOptions = {
    probeDistances: { element: document.getElementById('probeDistances') as HTMLInputElement },
    carSpeed: { element: document.getElementById('carSpeed') as HTMLInputElement },
    carAngle: { element: document.getElementById('carAngle') as HTMLInputElement },
    carPosition: { element: document.getElementById('carPosition') as HTMLInputElement },
    trackAngle: { element: document.getElementById('trackAngle') as HTMLInputElement },
    lapCount: { element: document.getElementById('lapCount') as HTMLInputElement },
    onTrack: { element: document.getElementById('onTrack') as HTMLInputElement },
    roadScore: { element: document.getElementById('roadScore') as HTMLInputElement },
    performanceScore: { element: document.getElementById('performanceScore') as HTMLInputElement },
    tickNumber: { element: document.getElementById('tickNumber') as HTMLInputElement },
} as const;
document.addEventListener('DOMContentLoaded', () => {
    Object.keys(neuralNetworkInputOptions).forEach((key) => {
        const typedKey = key as keyof typeof neuralNetworkInputOptions;
        const inputOption = neuralNetworkInputOptions[typedKey];
        if (!inputOption.element) { throw new Error(`Input element for ${typedKey} not found`); }
        lockableElements.push(inputOption.element);

        inputOption.element.addEventListener('change', onInputChange);
        onInputChange();

        function onInputChange() {
            if (areInputsLocked) { return; }
            inputOption.value = inputOption.element.checked;
            redrawNeuralNetwork();
        }
    });
});

function getInputLayerSize(): number {
    let size = 0;
    if (neuralNetworkInputOptions.probeDistances.value) { size += probeAngles.length; } // Probe distances
    if (neuralNetworkInputOptions.carSpeed.value) { size++; }
    if (neuralNetworkInputOptions.carAngle.value) { size++; }
    if (neuralNetworkInputOptions.carPosition.value) { size += 2; } // x and y position
    if (neuralNetworkInputOptions.trackAngle.value) { size++; }
    if (neuralNetworkInputOptions.lapCount.value) { size++; }
    if (neuralNetworkInputOptions.onTrack.value) { size++; }
    if (neuralNetworkInputOptions.roadScore.value) { size++; }
    if (neuralNetworkInputOptions.performanceScore.value) { size++; }
    if (neuralNetworkInputOptions.tickNumber.value) { size++; }
    return size;
}
function getInputLayerValues(car: Car): number[] {
    const options = neuralNetworkInputOptions;
    let inputLayerValues: number[] = [
        ...options.probeDistances.value ? car.probes.map(probe => probe.distance) : [],
        options.carSpeed.value ? car.speed : NaN,
        options.carAngle.value ? car.angle : NaN,
        ...options.carPosition.value ? [car.x - STADIUM_WIDTH / 2, car.y - STADIUM_HEIGHT / 2] : [],
        options.trackAngle.value ? car.originAngle : NaN,
        options.lapCount.value ? car.lapCount : NaN,
        options.onTrack.value ? (car.isOnTrack ? 1 : 0) : NaN,
        options.roadScore.value ? car.score : NaN,
        options.performanceScore.value ? getPerformanceScore(car, tickCount) : NaN,
        options.tickNumber.value ? tickCount : NaN
    ].filter(value => !isNaN(value));
    return inputLayerValues
}

document.addEventListener('DOMContentLoaded', redrawNeuralNetwork);
function redrawNeuralNetwork() {
    neuralNetworkCtx.clearRect(0, 0, neuralNetworkCanvas.width, neuralNetworkCanvas.height);

    // calculate node positions
    const layerSizes = [getInputLayerSize(), ...hiddenLayerSizes, 2];
    const layerCount = layerSizes.length;
    const maxLayerSize = Math.max(...layerSizes);
    const nodeRadius = Math.min(
        neuralNetworkCanvas.height / maxLayerSize / 2 - 2,
        neuralNetworkCanvas.width / layerCount / 2 - 3
    );
    const nodeHeight = neuralNetworkCanvas.height / maxLayerSize;
    const layerWidth = (neuralNetworkCanvas.width - nodeRadius * 2) / (layerCount - 1);
    const nodePositions: { x: number, y: number }[][] = [];
    for (let i = 0; i < layerCount; i++) {
        const layerSize = layerSizes[i];
        const layerX = nodeRadius + i * layerWidth;
        nodePositions[i] = [];
        const totalNodesHeight = layerSize * nodeHeight;
        const verticalOffset = (neuralNetworkCanvas.height - totalNodesHeight) / 2;
        for (let j = 0; j < layerSize; j++) {
            const nodeY = verticalOffset + j * nodeHeight + nodeHeight / 2;
            nodePositions[i].push({ x: layerX, y: nodeY });
        }
    }

    // draw connections
    layerSizes.forEach((layerSize, i) => {
        if (i === layerCount - 1) { return; } // Skip last layer
        const nextLayerSize = layerSizes[i + 1];
        for (let j = 0; j < layerSize; j++) {
            const { x: x1, y: y1 } = nodePositions[i][j];
            for (let k = 0; k < nextLayerSize; k++) {
                const { x: x2, y: y2 } = nodePositions[i + 1][k];
                drawLine(neuralNetworkCtx, x1, y1, x2, y2, 1, '#ffffff40');
            }
        }
    });

    // draw nodes
    for (let i = 0; i < layerCount; i++) {
        const layerSize = layerSizes[i];
        for (let j = 0; j < layerSize; j++) {
            const { x, y } = nodePositions[i][j];
            if (i === 0 || i === layerCount - 1) {
                const colour = i === 0 ? GARAGE_CAR_COLOUR : TRACK_COLOUR;
                drawCircle(neuralNetworkCtx, x, y, nodeRadius, colour);
            } else {
                neuralNetworkCtx.globalCompositeOperation = 'destination-out';
                drawCircle(neuralNetworkCtx, x, y, nodeRadius, '#ffffff');
                neuralNetworkCtx.globalCompositeOperation = 'source-over'; // Reset to default
                drawCircle(neuralNetworkCtx, x, y, nodeRadius, '#ffffff', true);
            }
        }
    }

    // draw node labels
    const fontSize = nodeRadius * 1.6;
    if (neuralNetworkInputOptions.probeDistances.value) {
        for (let i = 0; i < probeAngles.length; i++) {
            const { x, y } = nodePositions[0][i];
            drawText(neuralNetworkCtx, `P`, x, y + fontSize * 0.1125, '#000000', { fontSize, bold: true });
        }
    }
    drawText(neuralNetworkCtx, `↕`, nodePositions[layerCount - 1][0].x, nodePositions[layerCount - 1][0].y, '#000000', { fontSize, bold: true, strokeWidth: 0.5 });
    drawText(neuralNetworkCtx, `↔`, nodePositions[layerCount - 1][1].x, nodePositions[layerCount - 1][1].y, '#000000', { fontSize, bold: true, strokeWidth: 0.5 });

    // update layer container
    inputLayerElement.innerHTML = layerSizes[0].toString();
    outputLayerElement.innerHTML = layerSizes[layerCount - 1].toString();
    inputLayerElement.parentElement!.style.marginLeft = `${nodeRadius}px`;
    outputLayerElement.parentElement!.style.marginRight = `${nodeRadius}px`;
}

hiddenLayerInput.addEventListener('input', () => {
    if (areInputsLocked) { return; }
    hiddenLayerInput.value = hiddenLayerInput.value.replace(/[^0-9 ]/g, '');
    const input = hiddenLayerInput.value.trim();
    const newHiddenLayerSizes = input.split(' ').map(size => parseInt(size.trim(), 10)).filter(size => !isNaN(size) && size > 0);
    if (newHiddenLayerSizes.some(size => size > 50)) {
        alert('Hidden layer sizes must be between 1 and 50.');
        return;
    }
    hiddenLayerSizes = newHiddenLayerSizes;
    redrawNeuralNetwork();
});
//#endregion

//#region Natural Selection
/* ---------------------------- Natural Selection --------------------------- */

let cars: Car[] = [];
function createInitialBatch() {
    if (probeAngles === null) { return false; }
    cars = Array.from({ length: naturalSelectionInputOptions.populationSize.value }, () => new Car(undefined, undefined, probeAngles));
    return true;
}

function generationStart() {
    cars.forEach(car => car.reset());
    naturalSelectionLog.push({
        generation: generationCount,
        populationSize: naturalSelectionInputOptions.populationSize.value,
        survivors: undefined,
        bestScore: undefined
    })
    updateNaturalSelectionLog();
}

function generationEnd() {
    cars.forEach((car) => {
        car.score += getPerformanceScore(car, tickCount);
    });
    const sortedCars = cars.sort((a, b) => b.score - a.score);

    // Elimination
    const survivedCars: Car[] = [];
    sortedCars.forEach((car, index) => {
        car.rank = index + 1;
        const willSurvive = Math.random() < survivalProbability(car.rank);

        console.log(`Rank: ${car.rank}, Score: ${car.score}, Lap: ${car.lapCount}, GrassT: ${car.grassTicks}, SpeedAvg: ${car.speedSum / naturalSelectionInputOptions.tickLimit.value}, Survive?: ${willSurvive}, Hash: ${car.network.getHash()}`);
        if (willSurvive) { survivedCars.push(car); }
    });

    console.log(`***** Best car score: ${sortedCars[0].score}, Lap: ${sortedCars[0].lapCount}, GrassT: ${sortedCars[0].grassTicks}, SpeedAvg: ${sortedCars[0].speedSum / naturalSelectionInputOptions.tickLimit.value}, Hash: ${sortedCars[0].network.getHash()} *****`);

    console.log(`${(survivedCars.length / cars.length * 100).toFixed(2)}% survived`);

    naturalSelectionLog[naturalSelectionLog.length - 1] = {
        generation: generationCount,
        populationSize: naturalSelectionInputOptions.populationSize.value,
        survivors: survivedCars.length,
        bestScore: sortedCars[0].score
    };
    updateNaturalSelectionLog();

    return survivedCars;
}

function generationPostEnd(survivedCars: Car[]) {
    const newCars: Car[] = [];
    while (survivedCars.length + newCars.length < naturalSelectionInputOptions.populationSize.value) {
        for (const car of survivedCars) {
            if (Math.random() > reproductionProbability(car.rank)) { continue; }
            console.log(`===== Reproducing: rank ${car.rank}, score ${car.score}, hash ${car.network.getHash()} =====`);

            const newCar = car.clone();
            newCar.network.mutate();
            newCar.colour = randomNudgeColour(car.colour, 10);
            newCars.push(newCar);
        }
    }

    if (naturalSelectionInputOptions.parentShouldMutate.value) {
        survivedCars.forEach(car => car.network.mutate());
    }

    cars = [...survivedCars, ...newCars];
}

function survivalProbability(rank: number): number {
    return Math.exp(-(rank - 1) / naturalSelectionInputOptions.populationSize.value * naturalSelectionInputOptions.survivalHarshness.value);
}

function reproductionProbability(rank: number): number {
    return Math.exp(-(rank - 1) / naturalSelectionInputOptions.populationSize.value * naturalSelectionInputOptions.reproductionHarshness.value);
}
//#endregion

//#region Natural Selection UI
/* -------------------------- Natural Selection UI -------------------------- */
type NaturalSelectionInputOptions = {
    tickLimit: { element: HTMLInputElement, value: number },
    populationSize: { element: HTMLInputElement, value: number },
    survivalHarshness: { element: HTMLInputElement, value: number },
    reproductionHarshness: { element: HTMLInputElement, value: number },
    mutationRate: { element: HTMLInputElement, value: number },
    parentShouldMutate: { element: HTMLInputElement, value: boolean },
};
const naturalSelectionInputOptions: NaturalSelectionInputOptions = {
    tickLimit: { element: document.getElementById('tickLimit') as HTMLInputElement, value: NaN },
    populationSize: { element: document.getElementById('populationSize') as HTMLInputElement, value: NaN },
    survivalHarshness: { element: document.getElementById('survivalHarshness') as HTMLInputElement, value: NaN },
    reproductionHarshness: { element: document.getElementById('reproductionHarshness') as HTMLInputElement, value: NaN },
    mutationRate: { element: document.getElementById('mutationRate') as HTMLInputElement, value: NaN },
    parentShouldMutate: { element: document.getElementById('parentShouldMutate') as HTMLInputElement, value: false },
} as const;
document.addEventListener('DOMContentLoaded', () => {
    Object.keys(naturalSelectionInputOptions).forEach((key) => {
        const typedKey = key as keyof typeof naturalSelectionInputOptions;
        const inputOption = naturalSelectionInputOptions[typedKey];
        if (!inputOption.element) { throw new Error(`Input element for ${typedKey} not found`); }

        inputOption.element.addEventListener('change', onInputChange);
        onInputChange();

        function onInputChange() {
            if (typeof inputOption.value === "number") {
                const newValue = inputOption.element.valueAsNumber;
                if (!isNaN(newValue)) { inputOption.value = newValue; }
            } else if (typeof inputOption.value === "boolean") {
                inputOption.value = inputOption.element.checked;
            }
        }
    });
});

const naturalSelectionLogElement = document.getElementById('naturalSelectionLog') as HTMLDivElement;
const naturalSelectionEntryTemplate = document.getElementById('naturalSelectionEntryTemplate') as HTMLTemplateElement;
type NaturalSelectionEntry = {
    generation: number;
    populationSize: number;
    survivors: number | undefined;
    bestScore: number | undefined;
}
const naturalSelectionLog: NaturalSelectionEntry[] = [];
function updateNaturalSelectionLog() {
    console.log('Updating Natural Selection Log');
    const shouldAutoScroll = naturalSelectionLogElement.scrollHeight - naturalSelectionLogElement.scrollTop <= naturalSelectionLogElement.clientHeight + 10;

    naturalSelectionLogElement.innerHTML = '';
    naturalSelectionLog.forEach(entry => {
        const entryElement = naturalSelectionEntryTemplate.content.cloneNode(true) as HTMLDivElement;
        entryElement.querySelector('.generation')!.textContent = entry.generation.toString();
        entryElement.querySelector('.population')!.textContent = entry.populationSize.toString();
        entryElement.querySelector('.survivors')!.textContent = entry.survivors ? `${(entry.survivors / entry.populationSize * 100).toFixed(2)}%` : '⏳';
        entryElement.querySelector('.bestScore')!.textContent = entry.bestScore ? entry.bestScore.toFixed(2) : '⏳';
        naturalSelectionLogElement.appendChild(entryElement);
    });

    if (shouldAutoScroll) { naturalSelectionLogElement.scrollTop = naturalSelectionLogElement.scrollHeight; }
}

const tickCounter = document.getElementById('tickCounter') as HTMLDivElement;
function updateTickCounter() {
    tickCounter.textContent = `Tick: ${tickCount}/${naturalSelectionInputOptions.tickLimit.value}`;
    tickCounter.style.setProperty('--progress', `${(tickCount / naturalSelectionInputOptions.tickLimit.value) * 100}%`);
}
document.addEventListener('DOMContentLoaded', updateTickCounter);
//#endregion

//#region Graphics
/* -------------------------------- Graphics -------------------------------- */

function drawRectangle(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, colour: string, hollow?: boolean) {
    if (hollow) {
        ctx.strokeStyle = colour;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
    } else {
        ctx.fillStyle = colour;
        ctx.fillRect(x, y, width, height);
    }
}

function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, colour: string, hollow?: boolean) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    if (hollow) {
        ctx.strokeStyle = colour;
        ctx.lineWidth = 2;
        ctx.stroke();
    } else {
        ctx.fillStyle = colour;
        ctx.fill();
    }
    ctx.closePath();
}

function drawLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, width: number, colour: string) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.closePath();
}

function drawPath(ctx: CanvasRenderingContext2D, path: Array<{ x: number, y: number }>, width: number, colour: string) {
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.closePath();
}

type textOptions = {
    textAlign?: CanvasTextAlign;
    textBaseline?: CanvasTextBaseline;
    fontSize?: number;
    bold?: boolean;
    font?: string;
    strokeWidth?: number;
}
function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, colour: string, options: textOptions = {}) {
    ctx.fillStyle = colour;
    ctx.font = `${options.bold ? 'bold' : ''} ${options.fontSize ?? 20}px ${options.font ?? 'Roboto'}`;
    ctx.textAlign = options.textAlign ?? 'center';
    ctx.textBaseline = options.textBaseline ?? 'middle';
    if (options.strokeWidth && options.strokeWidth > 0) {
        ctx.strokeStyle = colour;
        ctx.lineWidth = options.strokeWidth;
        ctx.strokeText(text, x, y);
    }
    ctx.fillText(text, x, y);
}

function getRandomColour(): string {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function randomNudgeColour(colour: string, scale: number): string {
    const r = parseInt(colour.slice(1, 3), 16);
    const g = parseInt(colour.slice(3, 5), 16);
    const b = parseInt(colour.slice(5, 7), 16);

    const newR = clamp(Math.round(r + (Math.random() - 0.5) * scale), 0, 255);
    const newG = clamp(Math.round(g + (Math.random() - 0.5) * scale), 0, 255);
    const newB = clamp(Math.round(b + (Math.random() - 0.5) * scale), 0, 255);

    return `#${((1 << 24) + (newR << 16) + (newG << 8) + newB).toString(16).slice(1)}`;
}
//#endregion

//#region Math
/* ---------------------------------- Math ---------------------------------- */

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function map(value: number, inMin: number, inMax: number, outMin: number, outMax: number, clamped?: boolean): number {
    const mappedValue = (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    if (clamped) {
        return clamp(mappedValue, outMin, outMax);
    }
    return mappedValue;
}

function interpolate(value: number, inPoints: number[], outPoints: number[]): number {
    if (inPoints.length !== outPoints.length) {
        throw new Error('Input and output points must have the same length');
    }
    if (value < inPoints[0]) {
        return outPoints[0];
    }
    if (value > inPoints[inPoints.length - 1]) {
        return outPoints[outPoints.length - 1];
    }

    let output = outPoints[0];
    for (let i = 0; i < inPoints.length - 1; i++) {
        if (value >= inPoints[i] && value <= inPoints[i + 1]) {
            const ratio = (value - inPoints[i]) / (inPoints[i + 1] - inPoints[i]);
            output = outPoints[i] + ratio * (outPoints[i + 1] - outPoints[i]);
            break;
        }
    }

    return output;
}

//#endregion

//#region Loop Logic
/* ------------------------------- Loop Logic ------------------------------- */
let tickLoopPaused = true;
let generationLoopStopped = false;
let generationLooper: Generator | null = null;

function runLoop(looper: Generator) {
    function step() {
        const res = looper.next();
        if (!res.done) {
            requestAnimationFrame(step); // Non-blocking
        }
    }
    step();
}
let generationCount = 0;
function* generationLoop() {
    while (true) {
        generationCount++;
        console.log(`---------- Starting Generation ${generationCount} with ${cars.length} cars ----------`);
        generationStart();

        let tickLooper = tickLoop();
        let tickResult = tickLooper.next();
        while (!tickResult.done) {
            // Pause sub loop if requested
            if (tickLoopPaused) {
                console.log(`---------- Pausing Generation ${generationCount} at tick ${tickCount}----------`);
                while (tickLoopPaused) {
                    yield;
                }
            }
            tickResult = tickLooper.next();
            yield;
        }

        const survivedCars = generationEnd();

        if (generationLoopStopped) {
            console.log(`Generation loop stopped at generation ${generationCount}`);
            tickLoopPaused = true;
            tickLoopButton.textContent = 'Resume';
            // Wait until resumed
            while (tickLoopPaused) {
                yield;
            }
            generationLoopStopped = false;
            generationLoopButton.disabled = false;
            console.log(`Resuming generation loop at generation ${generationCount}`);
        }

        generationPostEnd(survivedCars);
    }
}

let tickCount = 0;
function* tickLoop() {
    tickCount = 0;
    console.log(`---------- Starting Tick Loop for Generation ${generationCount} ----------`);

    while (tickCount < naturalSelectionInputOptions.tickLimit.value) {
        tickCount++;

        tickDo();

        yield;
    }
}
//#endregion
