"use strict";
var _a, _b, _c;
let areInputsLocked = false;
document.addEventListener('DOMContentLoaded', () => {
    Array.from(document.getElementsByClassName('whatText')).forEach(e => {
        const element = e;
        element.style.width = element.parentElement?.clientWidth + 'px';
        element.style.height = element.parentElement?.clientHeight + 'px';
    });
});
const lockableElements = [];
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
let cars = [];
/* -------------------------------------------------------------------------- */
/*                                   Stadium                                  */
/* -------------------------------------------------------------------------- */
class Stadium {
    static tickDo() {
        NaturalSelection.updateTickCounter();
        this.processCars();
        this.drawCars();
        cars.forEach(this.updateRoadScore);
    }
    static processCars() {
        cars.forEach(car => {
            car.updateProbes();
            [car.engineInput, car.steerInput] = car.network.predict(NeuralNetwork.getInputLayerValues(car));
            car.move();
        });
    }
    static spawnCar(x, y) {
        if (x < 0 || x >= _a.STADIUM_WIDTH || y < 0 || y >= _a.STADIUM_HEIGHT) {
            console.warn('Spawn coordinates out of bounds');
            return;
        }
        const car = new Car(x, y, Garage.probeAngles);
        cars.push(car);
        this.drawCars();
    }
    static updateTrackData() {
        _a.trackData = _a.trackCtx.getImageData(0, 0, _a.STADIUM_WIDTH, _a.STADIUM_HEIGHT).data;
    }
    static redrawHint(x, y) {
        _a.hintCtx.clearRect(0, 0, _a.STADIUM_WIDTH, _a.STADIUM_HEIGHT);
        drawCircle(_a.hintCtx, this.TRACK_START_X, this.TRACK_START_Y, 5, '#ff0000'); // Track start
        drawCircle(_a.hintCtx, this.TRACK_START_X, this.TRACK_START_Y, 5, '#000000', true); // Track start
        drawCircle(_a.hintCtx, _a.STADIUM_WIDTH / 2, _a.STADIUM_HEIGHT / 2, 5, '#000000', true); // Track center
        drawCircle(_a.hintCtx, x, y, this.TRACK_WIDTH / 2, '#ffffff', true); // Cursor
    }
    static drawCars() {
        this.carCtx.clearRect(0, 0, this.STADIUM_WIDTH, this.STADIUM_HEIGHT);
        this.carCtx.save();
        cars.forEach(car => {
            this.carCtx.translate(car.x, car.y);
            this.carCtx.rotate(car.angle);
            car.probes.forEach(probe => {
                const probeLength = probe.distance;
                const probeX = Math.cos(probe.angle) * probeLength;
                const probeY = Math.sin(probe.angle) * probeLength;
                this.carCtx.strokeStyle = `${car.colour}60`;
                this.carCtx.lineWidth = 2;
                this.carCtx.beginPath();
                this.carCtx.moveTo(0, 0);
                this.carCtx.lineTo(probeX, probeY);
                this.carCtx.stroke();
            });
            drawRectangle(this.carCtx, -_a.CAR_WIDTH / 2, -_a.CAR_HEIGHT / 2, _a.CAR_WIDTH, _a.CAR_HEIGHT, car.colour);
            drawRectangle(this.carCtx, -_a.CAR_WIDTH / 2, -5, _a.CAR_WIDTH, _a.CAR_HEIGHT, '#000000', true);
            this.carCtx.resetTransform();
        });
        this.carCtx.restore();
    }
    static raycastDistance(car, angle) {
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
            if (!this.isOnTrack(rayEnd)) {
                return distance;
            }
        }
        return maxDistance;
    }
    static isOnTrack(point) {
        if (point.x < 0 || point.x >= this.STADIUM_WIDTH || point.y < 0 || point.y >= this.STADIUM_HEIGHT) {
            return false; // Out of bounds
        }
        const x = Math.floor(point.x);
        const y = Math.floor(point.y);
        const index = (y * this.STADIUM_WIDTH + x) * 4;
        return this.trackData[index + 3] !== 0; // Check alpha channel
    }
    static updateRoadScore(car) {
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
        car.grassTicks += +!car.isOnTrack;
        car.speedSum += car.speed;
        // console.log(`Car at (${car.x.toFixed(2)}, ${car.y.toFixed(2)}) - Speed: ${car.speed.toFixed(2)}, Score: ${car.score.toFixed(2)}, Lap Count: ${car.lapCount.toFixed(2)}`);
    }
    static getPerformanceScore(car, atTick) {
        let score = 0;
        score += car.lapCount * ((atTick - car.grassTicks) / atTick) ** 2 * 100;
        score += interpolate(car.speedSum / atTick, [0, 1], [-100, 100]);
        return score;
    }
    /* ---------------------------------- Code ---------------------------------- */
    static init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.stadiumContainer.style.width = `${this.STADIUM_WIDTH}px`;
            this.stadiumContainer.style.height = `${this.STADIUM_HEIGHT}px`;
            this.trackCanvas.width = this.STADIUM_WIDTH;
            this.trackCanvas.height = this.STADIUM_HEIGHT;
            this.carCanvas.width = this.STADIUM_WIDTH;
            this.carCanvas.height = this.STADIUM_HEIGHT;
            this.hintCanvas.width = this.STADIUM_WIDTH;
            this.hintCanvas.height = this.STADIUM_HEIGHT;
            this.redrawHint(NaN, NaN);
            _a.updateTrackData();
        });
        let isLeftMouseDown = false;
        let isRightMouseDown = false;
        let previousX;
        let previousY;
        document.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
        document.addEventListener('mousedown', (event) => {
            const rect = this.trackCanvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            switch (event.button) {
                case 0: // Left button
                    handleLeftClick(x, y, event.target);
                    break;
                case 1: // Middle button
                    _a.spawnCar(x, y);
                    break;
                case 2: // Right button
                    handleRightClick(x, y, event.target);
                    break;
                default:
                    return;
            }
        });
        document.addEventListener('touchstart', (event) => {
            const rect = this.trackCanvas.getBoundingClientRect();
            const x = event.touches[0].clientX - rect.left;
            const y = event.touches[0].clientY - rect.top;
            handleLeftClick(x, y, event.touches[0].target);
        });
        document.addEventListener('mousemove', (event) => {
            const rect = this.trackCanvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            handleMouseMove(x, y);
        });
        document.addEventListener('touchmove', (event) => {
            const rect = this.trackCanvas.getBoundingClientRect();
            const x = event.touches[0].clientX - rect.left;
            const y = event.touches[0].clientY - rect.top;
            handleMouseMove(x, y);
        });
        document.addEventListener('mouseup', () => {
            handleMouseUp();
        });
        document.addEventListener('touchend', () => {
            handleMouseUp();
            this.redrawHint(NaN, NaN);
        });
        function handleLeftClick(x, y, target) {
            if (shouldDiscardEvent(target)) {
                return;
            }
            isLeftMouseDown = true;
            isRightMouseDown = false;
            handleMouseMove(x, y);
        }
        function handleRightClick(x, y, target) {
            if (shouldDiscardEvent(target)) {
                return;
            }
            isLeftMouseDown = false;
            isRightMouseDown = true;
            handleMouseMove(x, y);
        }
        function handleMouseMove(x, y) {
            _a.redrawHint(x, y);
            if (isLeftMouseDown) {
                drawCircle(_a.trackCtx, x, y, _a.TRACK_WIDTH / 2, _a.TRACK_COLOUR);
                if (previousX !== undefined && previousY !== undefined) {
                    drawLine(_a.trackCtx, previousX, previousY, x, y, _a.TRACK_WIDTH, _a.TRACK_COLOUR);
                }
                previousX = x;
                previousY = y;
                _a.updateTrackData();
            }
            if (isRightMouseDown) {
                _a.trackCtx.globalCompositeOperation = 'destination-out';
                drawCircle(_a.trackCtx, x, y, _a.TRACK_WIDTH / 2, '#ffffff');
                if (previousX !== undefined && previousY !== undefined) {
                    drawLine(_a.trackCtx, previousX, previousY, x, y, _a.TRACK_WIDTH, '#ffffff');
                }
                _a.trackCtx.globalCompositeOperation = 'source-over'; // Reset to default
                previousX = x;
                previousY = y;
                _a.updateTrackData();
            }
        }
        function handleMouseUp() {
            isLeftMouseDown = false;
            isRightMouseDown = false;
            previousX = undefined;
            previousY = undefined;
        }
        function shouldDiscardEvent(target) {
            return target instanceof HTMLInputElement
                || target instanceof HTMLTextAreaElement
                || target instanceof HTMLButtonElement
                || target instanceof HTMLSelectElement;
        }
    }
}
_a = Stadium;
/* ---------------------------------- Logic --------------------------------- */
Stadium.CAR_WIDTH = 20;
Stadium.CAR_HEIGHT = 10;
/* ----------------------------------- UI ----------------------------------- */
Stadium.stadiumContainer = document.getElementById('stadiumContainer');
Stadium.STADIUM_WIDTH = _a.stadiumContainer.clientWidth;
Stadium.STADIUM_HEIGHT = _a.stadiumContainer.clientHeight;
Stadium.trackCanvas = document.getElementById('trackCanvas');
Stadium.trackCtx = _a.trackCanvas.getContext('2d', { willReadFrequently: true });
Stadium.carCanvas = document.getElementById('carCanvas');
Stadium.carCtx = _a.carCanvas.getContext('2d');
Stadium.hintCanvas = document.getElementById('hintCanvas');
Stadium.hintCtx = _a.hintCanvas.getContext('2d');
Stadium.TRACK_COLOUR = '#e0e0e0';
Stadium.TRACK_WIDTH = 50;
Stadium.TRACK_START_X = _a.STADIUM_WIDTH / 2;
Stadium.TRACK_START_Y = _a.STADIUM_HEIGHT / 4;
Stadium.trackData = new Uint8ClampedArray();
Stadium.init();
/* -------------------------------------------------------------------------- */
/*                                    Cars                                    */
/* -------------------------------------------------------------------------- */
class Cars {
    static serialiseCarData(car, generation, ticksInGeneration) {
        const probeAngles = car.probes.map(probe => probe.angle);
        return {
            colour: car.colour,
            probeAngles: probeAngles,
            lapCount: car.lapCount,
            score: car.score,
            network: car.network,
            inputLayerOptions: car.inputLayerOptions,
            generation: generation,
            averageSpeed: car.speedSum / ticksInGeneration,
            onTrackPercentage: 1 - car.grassTicks / ticksInGeneration,
        };
    }
    static deserialiseCarData(data) {
        const car = new Car(undefined, undefined, data.probeAngles);
        car.lapCount = data.lapCount;
        car.score = data.score;
        car.network = data.network;
        car.inputLayerOptions = data.inputLayerOptions;
        return car;
    }
}
class Probe {
    constructor(angle) {
        this.distance = Infinity;
        this.angle = angle;
    }
}
class Car {
    constructor(x = Stadium.TRACK_START_X, y = Stadium.TRACK_START_Y, probeAngles = []) {
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
        this.network = new Network([NeuralNetwork.getInputLayerSize(), ...NeuralNetwork.hiddenLayerSizes, 2]);
        this.inputLayerOptions = NeuralNetwork.serialiseInputLayerOptions();
        this.colour = getRandomColour();
    }
    reset() {
        this.x = Stadium.TRACK_START_X;
        this.y = Stadium.TRACK_START_Y;
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
        this.isOnTrack = Stadium.isOnTrack({ x: this.x, y: this.y });
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
        this.originAngle = Math.atan2(this.y - Stadium.STADIUM_HEIGHT / 2, this.x - Stadium.STADIUM_WIDTH / 2);
    }
    updateProbes() {
        this.probes.forEach(probe => {
            probe.distance = Stadium.raycastDistance(this, probe.angle);
        });
    }
    clone() {
        const newCar = new Car(this.x, this.y, this.probes.map(probe => probe.angle));
        newCar.network = this.network.clone();
        return newCar;
    }
}
/* -------------------------------------------------------------------------- */
/*                                   Garage                                   */
/* -------------------------------------------------------------------------- */
class Garage {
    static onProbeAnglesInput() {
        this.probeAngles = this.probeAnglesInput.value.trim().split('\n')
            .map(angle => parseFloat(angle.trim()) * (Math.PI / 180))
            .filter(angle => !isNaN(angle));
        this.redraw();
        NeuralNetwork.redraw();
    }
    static redraw() {
        this.garageCtx.clearRect(0, 0, this.garageCanvas.width, this.garageCanvas.height);
        this.garageCtx.save();
        this.garageCtx.translate(this.garageCanvas.width / 2, this.garageCanvas.height / 2);
        this.garageCtx.rotate(-Math.PI / 2);
        const CAR_SCALE = 2;
        const scaledCarWidth = Stadium.CAR_WIDTH * CAR_SCALE;
        const scaledCarHeight = Stadium.CAR_HEIGHT * CAR_SCALE;
        drawRectangle(this.garageCtx, -scaledCarWidth / 2, -scaledCarHeight / 2, scaledCarWidth, scaledCarHeight, this.GARAGE_CAR_COLOUR);
        this.probeAngles.forEach(angle => {
            drawLine(this.garageCtx, 0, 0, Math.cos(angle) * 100, Math.sin(angle) * 100, 2, this.GARAGE_CAR_COLOUR);
        });
        drawRectangle(this.garageCtx, -scaledCarWidth / 2, -scaledCarHeight / 2, scaledCarWidth, scaledCarHeight, '#000000', true);
        this.garageCtx.restore();
    }
    /* ---------------------------------- Code ---------------------------------- */
    static init() {
        this.garageCanvas.width = 300;
        this.garageCanvas.height = 300;
        lockableElements.push(this.probeAnglesInput);
        document.addEventListener('DOMContentLoaded', () => {
            this.redraw();
            this.onProbeAnglesInput();
        });
        this.probeAnglesInput.addEventListener('input', () => {
            if (areInputsLocked) {
                return;
            }
            this.probeAnglesInput.value = this.probeAnglesInput.value
                .replace(/[^0-9-+.\n]/g, '')
                .replace(/--/g, '+')
                .replace(/\+-/g, '-')
                .replace(/-\+/g, '-')
                .replace(/\++/g, '+')
                .replace(/\.+/g, '.')
                .replace(/([+-])0+/gm, '$10')
                .replace(/^0+/gm, '0')
                .replace(/(?<=[0-9.])([\+-])/g, '\n$1');
            this.onProbeAnglesInput();
        });
        this.probeAnglesInput.addEventListener('blur', () => {
            if (areInputsLocked) {
                return;
            }
            this.probeAnglesInput.value = this.probeAnglesInput.value
                .replace(/([\+-])\./g, '$10.')
                .replace(/^\./gm, '0.')
                .replace(/\.$/gm, '');
            this.onProbeAnglesInput();
        });
    }
}
_b = Garage;
/* ----------------------------------- UI ----------------------------------- */
Garage.garageCanvas = document.getElementById('garageCanvas');
Garage.garageCtx = _b.garageCanvas.getContext('2d');
Garage.GARAGE_CAR_COLOUR = '#ffa0a0';
Garage.probeAnglesInput = document.getElementById('probeAngles');
Garage.probeAngles = [];
Garage.init();
/* -------------------------------------------------------------------------- */
/*                               Neural Network                               */
/* -------------------------------------------------------------------------- */
class NeuralNetwork {
    static getInputLayerSize() {
        let size = 0;
        if (this.options.probeDistances.value) {
            size += Garage.probeAngles.length;
        } // Probe distances
        if (this.options.carSpeed.value) {
            size++;
        }
        if (this.options.carAngle.value) {
            size++;
        }
        if (this.options.carPosition.value) {
            size += 2;
        } // x and y position
        if (this.options.trackAngle.value) {
            size++;
        }
        if (this.options.lapCount.value) {
            size++;
        }
        if (this.options.onTrack.value) {
            size++;
        }
        if (this.options.roadScore.value) {
            size++;
        }
        if (this.options.performanceScore.value) {
            size++;
        }
        if (this.options.tickNumber.value) {
            size++;
        }
        return size;
    }
    static getInputLayerValues(car) {
        let inputLayerValues = [
            ...this.options.probeDistances.value ? car.probes.map(probe => probe.distance) : [],
            this.options.carSpeed.value ? car.speed : NaN,
            this.options.carAngle.value ? car.angle : NaN,
            ...this.options.carPosition.value ? [car.x - Stadium.STADIUM_WIDTH / 2, car.y - Stadium.STADIUM_HEIGHT / 2] : [],
            this.options.trackAngle.value ? car.originAngle : NaN,
            this.options.lapCount.value ? car.lapCount : NaN,
            this.options.onTrack.value ? (car.isOnTrack ? 1 : 0) : NaN,
            this.options.roadScore.value ? car.score : NaN,
            this.options.performanceScore.value ? Stadium.getPerformanceScore(car, Looper.tickCount) : NaN,
            this.options.tickNumber.value ? Looper.tickCount : NaN
        ].filter(value => !isNaN(value));
        return inputLayerValues;
    }
    static serialiseInputLayerOptions() {
        return {
            probeDistances: this.options.probeDistances.value,
            carSpeed: this.options.carSpeed.value,
            carAngle: this.options.carAngle.value,
            carPosition: this.options.carPosition.value,
            trackAngle: this.options.trackAngle.value,
            lapCount: this.options.lapCount.value,
            onTrack: this.options.onTrack.value,
            roadScore: this.options.roadScore.value,
            performanceScore: this.options.performanceScore.value,
            tickNumber: this.options.tickNumber.value,
        };
    }
    static redraw() {
        this.neuralNetworkCtx.clearRect(0, 0, this.neuralNetworkCanvas.width, this.neuralNetworkCanvas.height);
        // calculate node positions
        const layerSizes = [this.getInputLayerSize(), ...this.hiddenLayerSizes, 2];
        const layerCount = layerSizes.length;
        const maxLayerSize = Math.max(...layerSizes);
        const nodeRadius = Math.min(this.neuralNetworkCanvas.height / maxLayerSize / 2 - 2, this.neuralNetworkCanvas.width / layerCount / 2 - 3);
        const nodeHeight = this.neuralNetworkCanvas.height / maxLayerSize;
        const layerWidth = (this.neuralNetworkCanvas.width - nodeRadius * 2) / (layerCount - 1);
        const nodePositions = [];
        for (let i = 0; i < layerCount; i++) {
            const layerSize = layerSizes[i];
            const layerX = nodeRadius + i * layerWidth;
            nodePositions[i] = [];
            const totalNodesHeight = layerSize * nodeHeight;
            const verticalOffset = (this.neuralNetworkCanvas.height - totalNodesHeight) / 2;
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
                    drawLine(this.neuralNetworkCtx, x1, y1, x2, y2, 1, '#ffffff40');
                }
            }
        });
        // draw nodes
        for (let i = 0; i < layerCount; i++) {
            const layerSize = layerSizes[i];
            for (let j = 0; j < layerSize; j++) {
                const { x, y } = nodePositions[i][j];
                if (i === 0 || i === layerCount - 1) {
                    const colour = i === 0 ? Garage.GARAGE_CAR_COLOUR : Stadium.TRACK_COLOUR;
                    drawCircle(this.neuralNetworkCtx, x, y, nodeRadius, colour);
                }
                else {
                    this.neuralNetworkCtx.globalCompositeOperation = 'destination-out';
                    drawCircle(this.neuralNetworkCtx, x, y, nodeRadius, '#ffffff');
                    this.neuralNetworkCtx.globalCompositeOperation = 'source-over'; // Reset to default
                    drawCircle(this.neuralNetworkCtx, x, y, nodeRadius, '#ffffff', true);
                }
            }
        }
        // draw node labels
        const fontSize = nodeRadius * 1.6;
        if (this.options.probeDistances.value) {
            for (let i = 0; i < Garage.probeAngles.length; i++) {
                const { x, y } = nodePositions[0][i];
                drawText(this.neuralNetworkCtx, `P`, x, y + fontSize * 0.1125, '#000000', { fontSize, bold: true });
            }
        }
        drawText(this.neuralNetworkCtx, `↕`, nodePositions[layerCount - 1][0].x, nodePositions[layerCount - 1][0].y, '#000000', { fontSize, bold: true, strokeWidth: 0.5 });
        drawText(this.neuralNetworkCtx, `↔`, nodePositions[layerCount - 1][1].x, nodePositions[layerCount - 1][1].y, '#000000', { fontSize, bold: true, strokeWidth: 0.5 });
        // update layer container
        this.inputLayerElement.innerHTML = layerSizes[0].toString();
        this.outputLayerElement.innerHTML = layerSizes[layerCount - 1].toString();
        this.inputLayerElement.parentElement.style.marginLeft = `${nodeRadius}px`;
        this.outputLayerElement.parentElement.style.marginRight = `${nodeRadius}px`;
    }
    /* ---------------------------------- Code ---------------------------------- */
    static init() {
        this.neuralNetworkCanvas.width = 350;
        this.neuralNetworkCanvas.height = 220;
        lockableElements.push(this.hiddenLayerInput);
        document.addEventListener('DOMContentLoaded', () => {
            Object.keys(this.options).forEach((key) => {
                const typedKey = key;
                const inputOption = this.options[typedKey];
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
                    _c.redraw();
                }
            });
            this.redraw();
        });
        this.hiddenLayerInput.addEventListener('input', () => {
            if (areInputsLocked) {
                return;
            }
            this.hiddenLayerInput.value = this.hiddenLayerInput.value.replace(/[^0-9 ]/g, '');
            const input = this.hiddenLayerInput.value.trim();
            const newHiddenLayerSizes = input.split(' ').map(size => parseInt(size.trim(), 10)).filter(size => !isNaN(size) && size > 0);
            if (newHiddenLayerSizes.some(size => size > 50)) {
                alert('Hidden layer sizes must be between 1 and 50.');
                return;
            }
            this.hiddenLayerSizes = newHiddenLayerSizes;
            this.redraw();
        });
    }
}
_c = NeuralNetwork;
/* ---------------------------------- Logic --------------------------------- */
NeuralNetwork.activationFunction = (x) => Math.tanh(x);
NeuralNetwork.hiddenLayerSizes = [];
/* ----------------------------------- UI ----------------------------------- */
NeuralNetwork.neuralNetworkCanvas = document.getElementById('neuralNetworkCanvas');
NeuralNetwork.neuralNetworkCtx = _c.neuralNetworkCanvas.getContext('2d');
NeuralNetwork.inputLayerElement = document.getElementById('inputLayer');
NeuralNetwork.outputLayerElement = document.getElementById('outputLayer');
NeuralNetwork.hiddenLayerInput = document.getElementById('hiddenLayers');
NeuralNetwork.options = {
    probeDistances: { element: document.getElementById('probeDistances') },
    carSpeed: { element: document.getElementById('carSpeed') },
    carAngle: { element: document.getElementById('carAngle') },
    carPosition: { element: document.getElementById('carPosition') },
    trackAngle: { element: document.getElementById('trackAngle') },
    lapCount: { element: document.getElementById('lapCount') },
    onTrack: { element: document.getElementById('onTrack') },
    roadScore: { element: document.getElementById('roadScore') },
    performanceScore: { element: document.getElementById('performanceScore') },
    tickNumber: { element: document.getElementById('tickNumber') },
};
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
                return NeuralNetwork.activationFunction(weightedSum + node.bias);
            });
        }
        return output;
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
NeuralNetwork.init();
/* -------------------------------------------------------------------------- */
/*                              Natural Selection                             */
/* -------------------------------------------------------------------------- */
class NaturalSelection {
    /* ---------------------------------- Logic --------------------------------- */
    static createInitialBatch() {
        if (Garage.probeAngles === null) {
            return false;
        }
        cars = Array.from({ length: this.options.populationSize.value }, () => new Car(undefined, undefined, Garage.probeAngles));
        return true;
    }
    static generationStart() {
        cars.forEach(car => car.reset());
        this.naturalSelectionLog.push({
            generation: Looper.generationCount,
            populationSize: this.options.populationSize.value,
            survivors: undefined,
            bestScore: undefined
        });
        this.updateLog();
    }
    static generationEnd() {
        cars.forEach((car) => {
            car.score += Stadium.getPerformanceScore(car, Looper.tickCount);
        });
        const sortedCars = cars.sort((a, b) => b.score - a.score);
        LeaderBoard.leaderboard.push(...sortedCars.map(car => Cars.serialiseCarData(car, Looper.generationCount, Looper.tickCount)));
        // Elimination
        const survivedCars = [];
        sortedCars.forEach((car, index) => {
            car.rank = index + 1;
            const willSurvive = Math.random() < this.survivalProbability(car.rank);
            console.log(`Rank: ${car.rank}, Score: ${car.score}, Lap: ${car.lapCount}, GrassT: ${car.grassTicks}, SpeedAvg: ${car.speedSum / this.options.tickLimit.value}, Survive?: ${willSurvive}, Hash: ${car.network.getHash()}`);
            if (willSurvive) {
                survivedCars.push(car);
            }
        });
        console.log(`***** Best car score: ${sortedCars[0].score}, Lap: ${sortedCars[0].lapCount}, GrassT: ${sortedCars[0].grassTicks}, SpeedAvg: ${sortedCars[0].speedSum / this.options.tickLimit.value}, Hash: ${sortedCars[0].network.getHash()} *****`);
        console.log(`${(survivedCars.length / cars.length * 100).toFixed(2)}% survived`);
        this.naturalSelectionLog[this.naturalSelectionLog.length - 1] = {
            generation: Looper.generationCount,
            populationSize: this.options.populationSize.value,
            survivors: survivedCars.length,
            bestScore: sortedCars[0].score
        };
        this.updateLog();
        LeaderBoard.update();
        return survivedCars;
    }
    static generationPostEnd(survivedCars) {
        const newCars = [];
        while (survivedCars.length + newCars.length < this.options.populationSize.value) {
            for (const car of survivedCars) {
                if (Math.random() > this.reproductionProbability(car.rank)) {
                    continue;
                }
                console.log(`===== Reproducing: rank ${car.rank}, score ${car.score}, hash ${car.network.getHash()} =====`);
                const newCar = car.clone();
                newCar.network.mutate();
                newCar.colour = randomNudgeColour(car.colour, 10);
                newCars.push(newCar);
            }
        }
        if (this.options.parentShouldMutate.value) {
            survivedCars.forEach(car => car.network.mutate());
        }
        cars = [...survivedCars, ...newCars];
    }
    static survivalProbability(rank) {
        return Math.exp(-(rank - 1) / this.options.populationSize.value * this.options.survivalHarshness.value);
    }
    static reproductionProbability(rank) {
        return Math.exp(-(rank - 1) / this.options.populationSize.value * this.options.reproductionHarshness.value);
    }
    static updateLog() {
        console.log('Updating Natural Selection Log');
        const shouldAutoScroll = this.naturalSelectionLogElement.scrollHeight - this.naturalSelectionLogElement.scrollTop <= this.naturalSelectionLogElement.clientHeight + 10;
        this.naturalSelectionLogElement.innerHTML = '';
        this.naturalSelectionLog.forEach(entry => {
            const entryElement = this.naturalSelectionEntryTemplate.content.cloneNode(true);
            entryElement.querySelector('.generation').textContent = entry.generation.toString();
            entryElement.querySelector('.population').textContent = entry.populationSize.toString();
            entryElement.querySelector('.survivors').textContent = entry.survivors ? `${(entry.survivors / entry.populationSize * 100).toFixed(2)}%` : '⏳';
            entryElement.querySelector('.bestScore').textContent = entry.bestScore ? entry.bestScore.toFixed(2) : '⏳';
            this.naturalSelectionLogElement.appendChild(entryElement);
        });
        if (shouldAutoScroll) {
            this.naturalSelectionLogElement.scrollTop = this.naturalSelectionLogElement.scrollHeight;
        }
    }
    static updateTickCounter() {
        this.tickCounter.textContent = `Tick: ${Looper.tickCount}/${NaturalSelection.options.tickLimit.value}`;
        this.tickCounter.style.setProperty('--progress', `${(Looper.tickCount / NaturalSelection.options.tickLimit.value) * 100}%`);
    }
    /* ---------------------------------- Code ---------------------------------- */
    static init() {
        document.addEventListener('DOMContentLoaded', () => {
            Object.keys(this.options).forEach((key) => {
                const typedKey = key;
                const inputOption = this.options[typedKey];
                if (!inputOption.element) {
                    throw new Error(`Input element for ${typedKey} not found`);
                }
                inputOption.element.addEventListener('change', onInputChange);
                onInputChange();
                function onInputChange() {
                    if (typeof inputOption.value === "number") {
                        const newValue = inputOption.element.valueAsNumber;
                        if (!isNaN(newValue)) {
                            inputOption.value = newValue;
                        }
                    }
                    else if (typeof inputOption.value === "boolean") {
                        inputOption.value = inputOption.element.checked;
                    }
                    NaturalSelection.updateTickCounter();
                }
            });
            this.updateTickCounter();
        });
    }
}
/* ----------------------------------- UI ----------------------------------- */
NaturalSelection.tickCounter = document.getElementById('tickCounter');
NaturalSelection.options = {
    tickLimit: { element: document.getElementById('tickLimit'), value: NaN },
    populationSize: { element: document.getElementById('populationSize'), value: NaN },
    survivalHarshness: { element: document.getElementById('survivalHarshness'), value: NaN },
    reproductionHarshness: { element: document.getElementById('reproductionHarshness'), value: NaN },
    mutationRate: { element: document.getElementById('mutationRate'), value: NaN },
    parentShouldMutate: { element: document.getElementById('parentShouldMutate'), value: false },
};
NaturalSelection.naturalSelectionLogElement = document.getElementById('naturalSelectionLog');
NaturalSelection.naturalSelectionEntryTemplate = document.getElementById('naturalSelectionEntryTemplate');
NaturalSelection.naturalSelectionLog = [];
NaturalSelection.init();
/* -------------------------------------------------------------------------- */
/*                                 Leaderboard                                */
/* -------------------------------------------------------------------------- */
class LeaderBoard {
    static update() {
        console.log('Updating Leaderboard');
        this.leaderboard.sort((a, b) => b.score - a.score);
        this.leaderboard = this.leaderboard.slice(0, this.LEADERBOARD_MAX_ENTRIES);
        this.leaderboardElement.innerHTML = '';
        this.leaderboard.forEach((carData, index) => {
            const entryElement = this.leaderboardEntryTemplate.content.cloneNode(true);
            entryElement.querySelector('.rank').textContent = (index + 1).toString();
            entryElement.querySelector('.generation').textContent = carData.generation.toString();
            // entryElement.querySelector('.colour')!.style.backgroundColor = car.colour;
            entryElement.querySelector('.score').title = carData.score.toString();
            entryElement.querySelector('.score').textContent = carData.score.toPrecision(4);
            entryElement.querySelector('.lap').title = carData.lapCount.toString();
            entryElement.querySelector('.lap').textContent = carData.lapCount.toFixed(2);
            entryElement.querySelector('.avgSpeed').title = carData.averageSpeed.toString();
            entryElement.querySelector('.avgSpeed').textContent = carData.averageSpeed.toFixed(4);
            entryElement.querySelector('.onTrackPercentage').title = `${(carData.onTrackPercentage * 100)}%`;
            entryElement.querySelector('.onTrackPercentage').textContent = `${(carData.onTrackPercentage * 100).toFixed(2)}%`;
            this.leaderboardElement.appendChild(entryElement);
        });
    }
}
LeaderBoard.leaderboardElement = document.getElementById('leaderboard');
LeaderBoard.leaderboardEntryTemplate = document.getElementById('leaderboardEntryTemplate');
LeaderBoard.LEADERBOARD_MAX_ENTRIES = 20;
LeaderBoard.leaderboard = [];
/* -------------------------------------------------------------------------- */
/*                                   Looper                                   */
/* -------------------------------------------------------------------------- */
class Looper {
    static runLoop(looper) {
        function step() {
            const res = looper.next();
            if (!res.done) {
                requestAnimationFrame(step); // Non-blocking
            }
        }
        step();
    }
    static *generationLoop() {
        while (true) {
            this.generationCount++;
            console.log(`---------- Starting Generation ${this.generationCount} with ${cars.length} cars ----------`);
            NaturalSelection.generationStart();
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
            const survivedCars = NaturalSelection.generationEnd();
            if (this.generationLoopStopped) {
                console.log(`Generation loop stopped at generation ${this.generationCount}`);
                this.tickLoopPaused = true;
                this.tickLoopButton.textContent = 'Resume';
                // Wait until resumed
                while (this.tickLoopPaused) {
                    yield;
                }
                this.generationLoopStopped = false;
                this.generationLoopButton.disabled = false;
                console.log(`Resuming generation loop at generation ${this.generationCount}`);
            }
            NaturalSelection.generationPostEnd(survivedCars);
        }
    }
    static *tickLoop() {
        this.tickCount = 0;
        console.log(`---------- Starting Tick Loop for Generation ${this.generationCount} ----------`);
        while (this.tickCount < NaturalSelection.options.tickLimit.value) {
            this.tickCount++;
            Stadium.tickDo();
            yield;
        }
    }
    /* ---------------------------------- Code ---------------------------------- */
    static init() {
        this.tickLoopButton.addEventListener('click', () => {
            const firstRun = this.generationLooper === null;
            if (firstRun) {
                const successful = NaturalSelection.createInitialBatch();
                if (!successful) {
                    return;
                }
                this.generationLoopButton.disabled = false;
                lockInputs(true);
            }
            this.tickLoopPaused = !this.tickLoopPaused;
            this.tickLoopButton.textContent = this.tickLoopPaused ? 'Resume' : 'Pause';
            if (firstRun) {
                this.generationLooper = this.generationLoop();
                this.runLoop(this.generationLooper);
            }
        });
        this.generationLoopButton.addEventListener('click', () => {
            if (!this.generationLoopStopped) {
                this.generationLoopStopped = true;
                this.generationLoopButton.disabled = true;
            }
        });
    }
}
/* ---------------------------------- Logic --------------------------------- */
Looper.tickLoopPaused = true;
Looper.generationLoopStopped = false;
Looper.generationLooper = null;
Looper.generationCount = 0;
Looper.tickCount = 0;
/* ----------------------------------- UI ----------------------------------- */
Looper.tickLoopButton = document.getElementById('tickLoopButton');
Looper.generationLoopButton = document.getElementById('generationLoopButton');
Looper.init();
/* -------------------------------------------------------------------------- */
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
