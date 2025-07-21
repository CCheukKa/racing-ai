"use strict";
let areInputsLocked = false;
document.addEventListener('DOMContentLoaded', () => {
    Array.from(document.getElementsByClassName('whatText')).forEach(e => {
        const element = e;
        element.style.width = element.parentElement?.clientWidth + 'px';
        element.style.height = element.parentElement?.clientHeight + 'px';
    });
});
// main
const startButton = document.getElementById('startButton');
startButton.addEventListener('click', () => {
    const successful = startGenetics();
    lockInputs(successful);
});
const tickCounter = document.getElementById('tickCounter');
const stadiumContainer = document.getElementById('stadiumContainer');
const CANVAS_WIDTH = stadiumContainer.clientWidth;
const CANVAS_HEIGHT = stadiumContainer.clientHeight;
const trackCanvas = document.getElementById('trackCanvas');
const trackCtx = trackCanvas.getContext('2d', { willReadFrequently: true });
const carCanvas = document.getElementById('carCanvas');
const carCtx = carCanvas.getContext('2d');
const hintCanvas = document.getElementById('hintCanvas');
const hintCtx = hintCanvas.getContext('2d');
document.addEventListener('DOMContentLoaded', () => {
    stadiumContainer.style.width = `${CANVAS_WIDTH}px`;
    stadiumContainer.style.height = `${CANVAS_HEIGHT}px`;
    trackCanvas.width = CANVAS_WIDTH;
    trackCanvas.height = CANVAS_HEIGHT;
    carCanvas.width = CANVAS_WIDTH;
    carCanvas.height = CANVAS_HEIGHT;
    hintCanvas.width = CANVAS_WIDTH;
    hintCanvas.height = CANVAS_HEIGHT;
});
// garage
const garageCanvas = document.getElementById('garageCanvas');
const garageCtx = garageCanvas.getContext('2d');
garageCanvas.width = 300;
garageCanvas.height = 300;
const probeAnglesInput = document.getElementById('probeAngles');
// neural network
const neuralNetworkCanvas = document.getElementById('neuralNetworkCanvas');
const neuralNetworkCtx = neuralNetworkCanvas.getContext('2d');
neuralNetworkCanvas.width = 350;
neuralNetworkCanvas.height = 220;
const layerContainer = document.getElementById('layerContainer');
const inputLayerElement = document.getElementById('inputLayer');
const outputLayerElement = document.getElementById('outputLayer');
const hiddenLayerInput = document.getElementById('hiddenLayers');
// lock inputs
const lockableElements = [startButton, probeAnglesInput, hiddenLayerInput];
function lockInputs(lock) {
    if (areInputsLocked === lock) {
        return;
    }
    ;
    areInputsLocked = lock;
    lockableElements.forEach(element => {
        element.disabled = lock;
    });
}
//#region Track UI
/* -------------------------------- Track UI -------------------------------- */
const TRACK_COLOUR = '#e0e0e0';
const TRACK_WIDTH = 50;
const TRACK_START_X = CANVAS_WIDTH / 2;
const TRACK_START_Y = CANVAS_HEIGHT / 4;
let isLeftMouseDown = false;
let isRightMouseDown = false;
let previousX;
let previousY;
let trackData = new Uint8ClampedArray();
document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});
document.addEventListener('mousedown', (event) => {
    const rect = trackCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    switch (event.button) {
        case 0: // Left button
            handleLeftClick(x, y);
            break;
        case 1: // Middle button
            spawnCar(x, y);
            break;
        case 2: // Right button
            handleRightClick(x, y);
            break;
        default:
            return;
    }
});
document.addEventListener('touchstart', (event) => {
    const rect = trackCanvas.getBoundingClientRect();
    const x = event.touches[0].clientX - rect.left;
    const y = event.touches[0].clientY - rect.top;
    handleLeftClick(x, y);
});
document.addEventListener('mousemove', (event) => {
    const rect = trackCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    handleMouseMove(x, y);
});
document.addEventListener('touchmove', (event) => {
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
function handleLeftClick(x, y) {
    isLeftMouseDown = true;
    isRightMouseDown = false;
    handleMouseMove(x, y);
}
function handleRightClick(x, y) {
    isLeftMouseDown = false;
    isRightMouseDown = true;
    handleMouseMove(x, y);
}
function handleMouseMove(x, y) {
    redrawHint(x, y);
    if (isLeftMouseDown) {
        drawCircle(trackCtx, x, y, TRACK_WIDTH / 2, TRACK_COLOUR);
        if (previousX !== undefined && previousY !== undefined) {
            drawLine(trackCtx, previousX, previousY, x, y, TRACK_WIDTH, TRACK_COLOUR);
        }
        previousX = x;
        previousY = y;
        trackData = trackCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT).data;
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
        trackData = trackCtx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT).data;
    }
}
function handleMouseUp() {
    isLeftMouseDown = false;
    isRightMouseDown = false;
    previousX = undefined;
    previousY = undefined;
}
document.addEventListener('DOMContentLoaded', () => { redrawHint(NaN, NaN); });
function redrawHint(x, y) {
    hintCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawCircle(hintCtx, TRACK_START_X, TRACK_START_Y, 5, '#ff0000'); // Track start
    drawCircle(hintCtx, TRACK_START_X, TRACK_START_Y, 5, '#000000', true); // Track start
    drawCircle(hintCtx, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 5, '#000000', true); // Track center
    drawCircle(hintCtx, x, y, TRACK_WIDTH / 2, '#ffffff', true); // Cursor
}
//#endregion
//#region Cars
/* ---------------------------------- Cars ---------------------------------- */
const CAR_WIDTH = 20;
const CAR_HEIGHT = 10;
class Probe {
    constructor(angle) {
        this.distance = Infinity;
        this.angle = angle;
    }
}
class Car {
    constructor(x = TRACK_START_X, y = TRACK_START_Y, probeAngles = []) {
        this.angle = 0;
        this.speed = 0;
        this.originAngle = 0;
        this.isOnTrack = true;
        this.engineInput = 0;
        this.steerInput = 0;
        this.probes = [];
        this.lapCount = 0;
        this.score = 0;
        this.rank = NaN;
        this.grassTicks = 0;
        this.speedSum = 0;
        this.x = x;
        this.y = y;
        this.probes = probeAngles.map(angle => new Probe(angle));
        this.network = new Network([getInputLayerSize(), ...hiddenLayerSizes, 2]);
        this.colour = getRandomColour();
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
        }
        else if (this.engineInput < 0) {
            if (this.speed > 0) {
                this.speed += 0.02 * this.engineInput; // Brake
            }
            else {
                this.speed += 0.01 * this.engineInput; // Reverse
            }
        }
        else {
            this.speed *= 0.99; // Friction
        }
        this.speed = clamp(this.speed, -1, 5); // Limit speed
        this.speed *= this.isOnTrack ? 1 : 0.99; // Slow down on grass
        const turnSpeed = 0.02 * map(this.speed, -1, 1, -1, 1, true);
        this.angle += turnSpeed * this.steerInput; // Steer
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.originAngle = Math.atan2(this.y - CANVAS_HEIGHT / 2, this.x - CANVAS_WIDTH / 2);
    }
    updateProbes() {
        return this.probes.map(probe => {
            probe.distance = raycastDistance(this, probe.angle);
            return probe.distance;
        });
    }
    clone() {
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
function handleKeyEvent(event) {
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
const TICK_LIMIT = 2000;
let tickCount = 0;
function tickGame() {
    // console.log(`Tick: ${tickCount}`);
    tickCounter.textContent = `Tick: ${tickCount}`;
    processCars();
    scoreCars();
    drawCars();
    if (++tickCount >= TICK_LIMIT) {
        tallyScores();
        endGeneration();
        tickCount = 0;
    }
    else {
        requestAnimationFrame(tickGame);
    }
}
function processCars() {
    cars.forEach(car => {
        car.engineInput = +throttleButtonPressed - +brakeButtonPressed;
        car.steerInput = +rightButtonPressed - +leftButtonPressed;
        const probeDistances = car.updateProbes();
        [car.engineInput, car.steerInput] = car.network.predict(getInputLayerValues(car, probeDistances));
        car.move();
    });
}
function spawnCar(x, y) {
    if (x < 0 || x >= CANVAS_WIDTH || y < 0 || y >= CANVAS_HEIGHT) {
        console.warn('Spawn coordinates out of bounds');
        return;
    }
    const car = new Car(x, y, probeAngles);
    cars.push(car);
    drawCars();
}
function drawCars() {
    carCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
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
function raycastDistance(car, angle) {
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
function isOnTrack(point) {
    if (point.x < 0 || point.x >= CANVAS_WIDTH || point.y < 0 || point.y >= CANVAS_HEIGHT) {
        return false; // Out of bounds
    }
    const x = Math.floor(point.x);
    const y = Math.floor(point.y);
    const index = (y * CANVAS_WIDTH + x) * 4;
    return trackData[index + 3] !== 0; // Check alpha channel
}
function scoreCars() {
    cars.forEach(car => {
        car.score += car.isOnTrack ? 0.2 : -5;
        if (car.isOnTrack) {
            car.score += interpolate(car.speed, [-1, 0, 1, 5], [-3, -2, 1, 4]);
        }
        if (car.previousOriginAngle) {
            let deltaAngle = car.originAngle - car.previousOriginAngle;
            if (deltaAngle < -Math.PI) {
                deltaAngle += 2 * Math.PI;
            }
            else if (deltaAngle > Math.PI) {
                deltaAngle -= 2 * Math.PI;
            }
            car.lapCount += deltaAngle / (2 * Math.PI);
        }
        car.previousOriginAngle = car.originAngle;
        car.grassTicks -= +car.isOnTrack;
        car.speedSum += car.speed;
        // console.log(`Car at (${car.x.toFixed(2)}, ${car.y.toFixed(2)}) - Speed: ${car.speed.toFixed(2)}, Score: ${car.score.toFixed(2)}, Lap Count: ${car.lapCount.toFixed(2)}`);
    });
}
function tallyScores() {
    cars.forEach(car => {
        car.score += car.lapCount * ((TICK_LIMIT - car.grassTicks) / TICK_LIMIT) ** 2 * 100;
        car.score += interpolate(car.speedSum / TICK_LIMIT, [0, 1], [-100, 100]);
    });
}
//#endregion
//#region Garage UI
/* -------------------------------- Garage UI ------------------------------- */
const GARAGE_CAR_COLOUR = '#ffa0a0';
let probeAngles = [];
probeAnglesInput.addEventListener('input', () => {
    if (areInputsLocked) {
        return;
    }
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
    if (areInputsLocked) {
        return;
    }
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
const learningRate = 0.5;
const activationFunction = (x) => Math.tanh(x);
let hiddenLayerSizes = [];
class LNodes {
    constructor(numInputs) {
        this.weights = Array.from({ length: numInputs }, () => Math.random() - 0.5);
        this.bias = numInputs === 0 ? 0 : Math.random() - 0.5;
    }
}
class Layer {
    constructor(numInputs, numNodes) {
        this.nodes = Array.from({ length: numNodes }, () => new LNodes(numInputs));
    }
}
class Network {
    constructor(numNodesInLayer) {
        this.inputNodes = numNodesInLayer[0];
        this.layers = numNodesInLayer.slice(1).map((numNodes, index) => {
            const numInputs = index === 0 ? this.inputNodes : numNodesInLayer[index];
            return new Layer(numInputs, numNodes);
        });
    }
    predict(inputs) {
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
                node.weights = node.weights.map(weight => weight + (Math.random() - 0.5) * learningRate);
                node.bias += (Math.random() - 0.5) * learningRate;
            });
        });
        return this;
    }
    clone() {
        const newNetwork = new Network([]);
        newNetwork.inputNodes = this.inputNodes;
        newNetwork.layers = this.layers.map(layer => new Layer(layer.nodes[0].weights.length, layer.nodes.length));
        newNetwork.layers.forEach((newLayer, index) => {
            newLayer.nodes.forEach((newNode, nodeIndex) => {
                const oldNode = this.layers[index].nodes[nodeIndex];
                newNode.weights = [...oldNode.weights];
                newNode.bias = oldNode.bias;
            });
        });
        return newNetwork;
    }
    getHash() {
        const wbString = this.layers.map(layer => layer.nodes.map(node => `${node.weights.join(',')},${node.bias}`).join(';')).join('|');
        const hash = Array.from(wbString).reduce((hash, char) => {
            return (hash << 5) - hash + char.charCodeAt(0);
        }, 0).toString(36);
        return hash;
    }
}
const neuralNetworkInputOptions = {
    probeDistances: { element: document.getElementById('probeDistances') },
    carSpeed: { element: document.getElementById('carSpeed') },
    carAngle: { element: document.getElementById('carAngle') },
    carPosition: { element: document.getElementById('carPosition') },
    trackAngle: { element: document.getElementById('trackAngle') },
    lapCount: { element: document.getElementById('lapCount') },
    onTrack: { element: document.getElementById('onTrack') },
    carScore: { element: document.getElementById('carScore') },
    tickNumber: { element: document.getElementById('tickNumber') },
};
document.addEventListener('DOMContentLoaded', () => {
    Object.keys(neuralNetworkInputOptions).forEach((key) => {
        const typedKey = key;
        const inputOption = neuralNetworkInputOptions[typedKey];
        if (!inputOption.element) {
            throw new Error(`Input element for ${typedKey} not found`);
        }
        lockableElements.push(inputOption.element);
        inputOption.element.addEventListener('change', onInputChange);
        onInputChange();
        function onInputChange() {
            if (areInputsLocked) {
                return;
            }
            inputOption.value = inputOption.element.checked;
            redrawNeuralNetwork();
        }
    });
});
function getInputLayerSize() {
    let size = 0;
    if (neuralNetworkInputOptions.probeDistances.value) {
        size += probeAngles.length;
    } // Probe distances
    if (neuralNetworkInputOptions.carSpeed.value) {
        size++;
    }
    if (neuralNetworkInputOptions.carAngle.value) {
        size++;
    }
    if (neuralNetworkInputOptions.carPosition.value) {
        size += 2;
    } // x and y position
    if (neuralNetworkInputOptions.trackAngle.value) {
        size++;
    }
    if (neuralNetworkInputOptions.lapCount.value) {
        size++;
    }
    if (neuralNetworkInputOptions.onTrack.value) {
        size++;
    }
    if (neuralNetworkInputOptions.carScore.value) {
        size++;
    }
    if (neuralNetworkInputOptions.tickNumber.value) {
        size++;
    }
    return size;
}
function getInputLayerValues(car, probeDistances) {
    const options = neuralNetworkInputOptions;
    let inputLayerValues = [
        ...options.probeDistances.value ? probeDistances : [],
        options.carSpeed.value ? car.speed : 0,
        options.carAngle.value ? car.angle : 0,
        ...options.carPosition.value ? [car.x - CANVAS_WIDTH / 2, car.y - CANVAS_HEIGHT / 2] : [],
        options.trackAngle.value ? car.originAngle : 0,
        options.lapCount.value ? car.lapCount : 0,
        options.onTrack.value ? (car.isOnTrack ? 1 : 0) : 0,
        options.carScore.value ? car.score : 0,
        options.tickNumber.value ? tickCount : 0
    ];
    return inputLayerValues;
}
document.addEventListener('DOMContentLoaded', redrawNeuralNetwork);
function redrawNeuralNetwork() {
    neuralNetworkCtx.clearRect(0, 0, neuralNetworkCanvas.width, neuralNetworkCanvas.height);
    // calculate node positions
    const layerSizes = [getInputLayerSize(), ...hiddenLayerSizes, 2];
    const layerCount = layerSizes.length;
    const maxLayerSize = Math.max(...layerSizes);
    const nodeRadius = Math.min(neuralNetworkCanvas.height / maxLayerSize / 2 - 2, neuralNetworkCanvas.width / layerCount / 2 - 3);
    const nodeHeight = neuralNetworkCanvas.height / maxLayerSize;
    const layerWidth = (neuralNetworkCanvas.width - nodeRadius * 2) / (layerCount - 1);
    const nodePositions = [];
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
        if (i === layerCount - 1) {
            return;
        } // Skip last layer
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
            }
            else {
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
    inputLayerElement.parentElement.style.marginLeft = `${nodeRadius}px`;
    outputLayerElement.parentElement.style.marginRight = `${nodeRadius}px`;
}
hiddenLayerInput.addEventListener('input', () => {
    if (areInputsLocked) {
        return;
    }
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
//#region Genetic Algorithm
/* ---------------------------- Genetic Algorithm --------------------------- */
let cars = [];
const TARGET_POPULATION_SIZE = 50;
function startGenetics() {
    if (probeAngles === null) {
        return false;
    }
    cars = Array.from({ length: TARGET_POPULATION_SIZE }, () => new Car(undefined, undefined, probeAngles));
    setTimeout(startGeneration, 0);
    return true;
}
let generationCount = 0;
function startGeneration() {
    console.log(`---------- Starting Generation ${++generationCount} with ${cars.length} cars ----------`);
    cars.forEach(car => car.reset());
    tickGame();
}
function endGeneration() {
    const survivedCars = [];
    const sortedCars = cars.sort((a, b) => b.score - a.score);
    sortedCars.forEach((car, index) => {
        car.rank = index + 1;
        const willSurvive = Math.random() < survivalProbability(car.rank);
        console.log(`Rank: ${car.rank}, Score: ${car.score}, Lap: ${car.lapCount}, GrassT: ${car.grassTicks}, SpeedAvg: ${car.speedSum / TICK_LIMIT}, Survive?: ${willSurvive}, Hash: ${car.network.getHash()}`);
        if (willSurvive) {
            survivedCars.push(car);
        }
    });
    console.log(`***** Best car score: ${sortedCars[0].score}, Lap: ${sortedCars[0].lapCount}, GrassT: ${sortedCars[0].grassTicks}, SpeedAvg: ${sortedCars[0].speedSum / TICK_LIMIT}, Hash: ${sortedCars[0].network.getHash()} *****`);
    console.log(`${(survivedCars.length / cars.length * 100).toFixed(2)}% survived`);
    cars = [...survivedCars];
    while (cars.length < TARGET_POPULATION_SIZE) {
        for (const car of survivedCars) {
            if (Math.random() > reproductionProbability(car.rank)) {
                continue;
            }
            console.log(`===== Reproducing: rank ${car.rank}, score ${car.score}, hash ${car.network.getHash()} =====`);
            const newCar = car.clone();
            newCar.network.mutate();
            newCar.colour = randomNudgeColour(car.colour, 10);
            cars.push(newCar);
        }
    }
    requestAnimationFrame(startGeneration);
}
function survivalProbability(rank) {
    const harshness = 4;
    return Math.exp(-(rank - 1) / TARGET_POPULATION_SIZE * harshness);
}
function reproductionProbability(rank) {
    const harshness = 1;
    return Math.exp(-(rank - 1) / TARGET_POPULATION_SIZE * harshness);
}
//#endregion
//#region Graphics
/* -------------------------------- Graphics -------------------------------- */
function drawRectangle(ctx, x, y, width, height, colour, hollow) {
    if (hollow) {
        ctx.strokeStyle = colour;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
    }
    else {
        ctx.fillStyle = colour;
        ctx.fillRect(x, y, width, height);
    }
}
function drawCircle(ctx, x, y, radius, colour, hollow) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    if (hollow) {
        ctx.strokeStyle = colour;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    else {
        ctx.fillStyle = colour;
        ctx.fill();
    }
    ctx.closePath();
}
function drawLine(ctx, x1, y1, x2, y2, width, colour) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = colour;
    ctx.lineWidth = width;
    ctx.stroke();
    ctx.closePath();
}
function drawPath(ctx, path, width, colour) {
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
function drawText(ctx, text, x, y, colour, options = {}) {
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
function getRandomColour() {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
function randomNudgeColour(colour, scale) {
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
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
function map(value, inMin, inMax, outMin, outMax, clamped) {
    const mappedValue = (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    if (clamped) {
        return clamp(mappedValue, outMin, outMax);
    }
    return mappedValue;
}
function interpolate(value, inPoints, outPoints) {
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
