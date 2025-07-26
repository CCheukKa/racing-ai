"use strict";
var _a, _b, _c, _d;
document.addEventListener('DOMContentLoaded', () => { recalculateWhatTextSizes(); });
function recalculateWhatTextSizes() {
    Array.from(document.getElementsByClassName('whatText')).forEach(e => {
        const element = e;
        element.style.width = element.parentElement?.clientWidth + 'px';
        element.style.height = element.parentElement?.clientHeight + 'px';
    });
}
let areInputsLocked = false;
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
let zoomFactor = 1;
const mainContainer = document.getElementById('mainContainer');
document.addEventListener('DOMContentLoaded', () => { onLayoutChange(); });
window.addEventListener('resize', () => { onLayoutChange(); });
function onLayoutChange() {
    console.log('Layout change detected, recalculating zoom factor');
    const PADDING = 100;
    zoomFactor = Math.min((document.body.clientHeight - PADDING) / mainContainer.clientHeight, (document.body.clientWidth - PADDING) / mainContainer.clientWidth);
    mainContainer.style.zoom = zoomFactor.toString();
}
let cars = [];
var cookie = null;
const COOKIE_ROOT_NAME = 'cck-wtf-racing-ai';
var Cookies; //! Assuming Cookies is a global object from js-cookie library
try {
    cookie = JSON.parse(Cookies.get(COOKIE_ROOT_NAME));
}
catch (e) {
    console.log(e);
}
if (cookie) {
    console.log('Cookie fetched:', cookie);
}
else {
    console.log('No cookie');
    cookie = {};
}
function updateCookie() {
    Cookies.set(COOKIE_ROOT_NAME, JSON.stringify(cookie));
}
/* ------------------------------ Miscellaneous ----------------------------- */
const resetSettingsButton = document.getElementById('resetSettingsButton');
resetSettingsButton.addEventListener('click', () => {
    if (!confirm('Are you sure you want to reset all settings? This will also refresh the page.')) {
        return;
    }
    cookie = null;
    updateCookie();
    location.reload();
});
const importCarButton = document.getElementById('importCar');
importCarButton.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.multiple = true;
    input.onchange = (event) => {
        const files = event.target.files;
        if (!files || files.length === 0)
            return;
        importCarFiles(files);
    };
    input.click();
    input.remove();
});
const dragPrompt = document.getElementById('dragPrompt');
document.addEventListener('dragover', (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = 'copy';
    dragPrompt.classList.remove('hidden');
});
document.addEventListener('blur', () => {
    dragPrompt.classList.add('hidden');
});
document.addEventListener('dragleave', (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.relatedTarget === null) {
        dragPrompt.classList.add('hidden');
    }
});
document.addEventListener('drop', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0)
        return;
    importCarFiles(files);
    dragPrompt.classList.add('hidden');
});
function importCarFiles(files) {
    const jsonFiles = Array.from(files).filter(file => file.type === 'application/json' || file.name.endsWith('.json'));
    if (jsonFiles.length === 0) {
        alert('Failed to import car(s). Please ensure the file(s) are valid JSON car data files.');
        return;
    }
    const readers = jsonFiles.map(file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target?.result);
                const hash = data.hash || 'Failed to get hash';
                resolve({ hash, carData: data });
            }
            catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    }));
    Promise.all(readers).then(results => {
        if (results.length > 1) {
            const hashes = results.map(({ hash, carData }) => hash + (carData.name ? ` (${carData.name})` : '')).join('\n');
            if (!confirm(`Are you sure you want to import all ${results.length} cars?\n\nHashes:\n${hashes}`))
                return;
        }
        results.forEach(({ hash, carData }) => {
            if (results.length === 1) {
                if (!confirm(`Are you sure you want to import this car?\n\nHash:\n${hash + (carData.name ? ` (${carData.name})` : '')}`))
                    return;
            }
            const car = Cars.deserialiseCarData(carData);
            cars.push(car);
            LeaderBoard.leaderboard.push(carData);
            LeaderBoard.update();
            Stadium.drawCars();
            console.log('Car imported:', car);
        });
    }).catch(error => {
        alert('Failed to import car(s). Please ensure the file(s) are valid JSON car data files.');
        console.error('Failed to import car(s):', error);
    });
}
let isRaceMode = false;
const raceModeButton = document.getElementById('raceModeButton');
raceModeButton.addEventListener('click', () => {
    isRaceMode = !isRaceMode;
    document.body.classList.toggle('raceMode', isRaceMode);
    Stadium.STADIUM_WIDTH = isRaceMode ? 985 : 600;
    Stadium.recalculateCanvasSizes();
    setTimeout(() => {
        recalculateWhatTextSizes();
    }, 200);
});
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
        const stepSize = 1;
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
    static recalculateCanvasSizes() {
        this.TRACK_START_X = _a.STADIUM_WIDTH / 2;
        this.TRACK_START_Y = _a.STADIUM_HEIGHT / 4;
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
    }
    /* ---------------------------------- Code ---------------------------------- */
    static init() {
        document.addEventListener('DOMContentLoaded', () => { this.recalculateCanvasSizes(); });
        let isLeftMouseDown = false;
        let isRightMouseDown = false;
        let previousX;
        let previousY;
        document.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
        document.addEventListener('mousedown', (event) => {
            const rect = this.trackCanvas.getBoundingClientRect();
            const x = (event.clientX - rect.left) / zoomFactor;
            const y = (event.clientY - rect.top) / zoomFactor;
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
            const x = (event.touches[0].clientX - rect.left) / zoomFactor;
            const y = (event.touches[0].clientY - rect.top) / zoomFactor;
            handleLeftClick(x, y, event.touches[0].target);
        });
        document.addEventListener('mousemove', (event) => {
            const rect = this.trackCanvas.getBoundingClientRect();
            const x = (event.clientX - rect.left) / zoomFactor;
            const y = (event.clientY - rect.top) / zoomFactor;
            handleMouseMove(x, y);
        });
        document.addEventListener('touchmove', (event) => {
            const rect = this.trackCanvas.getBoundingClientRect();
            const x = (event.touches[0].clientX - rect.left) / zoomFactor;
            const y = (event.touches[0].clientY - rect.top) / zoomFactor;
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
        this.clearStadiumButton.addEventListener('click', () => {
            if (!confirm('Are you sure you want to clear the stadium? This will remove all track data.')) {
                return;
            }
            this.trackCtx.clearRect(0, 0, this.STADIUM_WIDTH, this.STADIUM_HEIGHT);
            _a.updateTrackData();
        });
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
Stadium.clearStadiumButton = document.getElementById('clearStadiumButton');
Stadium.TRACK_COLOUR = '#e0e0e0';
Stadium.TRACK_WIDTH = 50;
Stadium.TRACK_START_X = NaN;
Stadium.TRACK_START_Y = NaN;
Stadium.trackData = new Uint8ClampedArray();
Stadium.init();
/* -------------------------------------------------------------------------- */
/*                                    Cars                                    */
/* -------------------------------------------------------------------------- */
class Cars {
    static serialiseCarData(car, ticksInGeneration) {
        const probeAngles = car.probes.map(probe => probe.angle);
        return {
            name: car.name,
            colour: car.colour,
            probeAngles: probeAngles,
            lapCount: car.lapCount,
            score: car.score,
            network: car.network,
            inputLayerOptions: car.inputLayerOptions,
            generation: car.generation,
            averageSpeed: car.speedSum / ticksInGeneration,
            onTrackPercentage: 1 - car.grassTicks / ticksInGeneration,
            hash: this.getHash(car),
        };
    }
    static deserialiseCarData(carData) {
        const car = new Car(undefined, undefined, carData.probeAngles);
        const network = new Network([NeuralNetwork.getInputLayerSize(), ...NeuralNetwork.hiddenLayerSizes, 2]);
        network.layers = carData.network.layers;
        car.name = carData.name;
        car.lapCount = carData.lapCount;
        car.score = carData.score;
        car.network = network;
        car.inputLayerOptions = carData.inputLayerOptions;
        car.generation = carData.generation;
        car.colour = carData.colour;
        return car;
    }
    static getHash(car) {
        const probeAnglesHash = JSON.stringify(car.probes);
        const networkWeightsHash = car.network.getHash();
        const hash = sha1(probeAnglesHash, networkWeightsHash);
        return hash;
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
        this.generation = 0;
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
        newCar.generation = this.generation;
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
        if (cookie === null) {
            cookie = {};
        }
        cookie.probeAngles = this.probeAngles.map(angle => Math.round(angle * (180 / Math.PI) * 100000) / 100000);
        updateCookie();
    }
    static redraw() {
        const CAR_SCALE = 2;
        _b.redrawCarProbes(CAR_SCALE);
    }
    static redrawCarProbes(CAR_SCALE, probeAngles = this.probeAngles, carColour = this.GARAGE_CAR_COLOUR, canvas = this.garageCanvas, ctx = this.garageCtx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 2);
        const scaledCarWidth = Stadium.CAR_WIDTH * CAR_SCALE;
        const scaledCarHeight = Stadium.CAR_HEIGHT * CAR_SCALE;
        drawRectangle(ctx, -scaledCarWidth / 2, -scaledCarHeight / 2, scaledCarWidth, scaledCarHeight, carColour);
        probeAngles.forEach(angle => {
            drawLine(ctx, 0, 0, Math.cos(angle) * 100, Math.sin(angle) * 100, 2, carColour);
        });
        drawRectangle(ctx, -scaledCarWidth / 2, -scaledCarHeight / 2, scaledCarWidth, scaledCarHeight, '#000000', true);
        ctx.restore();
    }
    /* ---------------------------------- Code ---------------------------------- */
    static init() {
        this.garageCanvas.width = 300;
        this.garageCanvas.height = 300;
        lockableElements.push(this.probeAnglesInput);
        document.addEventListener('DOMContentLoaded', () => {
            if (cookie?.probeAngles) {
                this.probeAnglesInput.value = cookie.probeAngles.join('\n');
            }
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
        if (this.options.currentTick.value) {
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
            this.options.currentTick.value ? Looper.tickCount : NaN
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
            currentTick: this.options.currentTick.value,
        };
    }
    static redraw() {
        const { layerSizes, layerCount, nodeRadius } = _c.redrawNeuralNetwork(this.getInputLayerSize(), this.hiddenLayerSizes);
        // update layer container
        this.inputLayerElement.innerHTML = layerSizes[0].toString();
        this.outputLayerElement.innerHTML = layerSizes[layerCount - 1].toString();
        this.inputLayerElement.parentElement.style.marginLeft = `${nodeRadius}px`;
        this.outputLayerElement.parentElement.style.marginRight = `${nodeRadius}px`;
    }
    static redrawNeuralNetwork(inputLayerSize, hiddenLayerSizes, probeAngles = Garage.probeAngles, carColour = Garage.GARAGE_CAR_COLOUR, canvas = this.neuralNetworkCanvas, ctx = this.neuralNetworkCtx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // calculate node positions
        const layerSizes = [inputLayerSize, ...hiddenLayerSizes, 2];
        const layerCount = layerSizes.length;
        const maxLayerSize = Math.max(...layerSizes);
        const nodeRadius = Math.min(canvas.height / maxLayerSize / 2 - 2, canvas.width / layerCount / 2 - 3);
        const nodeHeight = canvas.height / maxLayerSize;
        const layerWidth = (canvas.width - nodeRadius * 2) / (layerCount - 1);
        const nodePositions = [];
        for (let i = 0; i < layerCount; i++) {
            const layerSize = layerSizes[i];
            const layerX = nodeRadius + i * layerWidth;
            nodePositions[i] = [];
            const totalNodesHeight = layerSize * nodeHeight;
            const verticalOffset = (canvas.height - totalNodesHeight) / 2;
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
                    drawLine(ctx, x1, y1, x2, y2, 1, '#ffffff40');
                }
            }
        });
        // draw nodes
        for (let i = 0; i < layerCount; i++) {
            const layerSize = layerSizes[i];
            for (let j = 0; j < layerSize; j++) {
                const { x, y } = nodePositions[i][j];
                if (i === 0 || i === layerCount - 1) {
                    const colour = i === 0 ? carColour : Stadium.TRACK_COLOUR;
                    drawCircle(ctx, x, y, nodeRadius, colour);
                }
                else {
                    ctx.globalCompositeOperation = 'destination-out';
                    drawCircle(ctx, x, y, nodeRadius, '#ffffff');
                    ctx.globalCompositeOperation = 'source-over'; // Reset to default
                    drawCircle(ctx, x, y, nodeRadius, '#ffffff', true);
                }
            }
        }
        // draw node labels
        const fontSize = nodeRadius * 1.6;
        if (this.options.probeDistances.value) {
            for (let i = 0; i < probeAngles.length; i++) {
                const { x, y } = nodePositions[0][i];
                drawText(ctx, `P`, x, y + fontSize * 0.1125, '#000000', { fontSize, bold: true });
            }
        }
        drawText(ctx, `↕`, nodePositions[layerCount - 1][0].x, nodePositions[layerCount - 1][0].y, '#000000', { fontSize, bold: true, strokeWidth: 0.5 });
        drawText(ctx, `↔`, nodePositions[layerCount - 1][1].x, nodePositions[layerCount - 1][1].y, '#000000', { fontSize, bold: true, strokeWidth: 0.5 });
        return { layerSizes, layerCount, nodeRadius };
    }
    /* ---------------------------------- Code ---------------------------------- */
    static init() {
        this.neuralNetworkCanvas.width = 350;
        this.neuralNetworkCanvas.height = 220;
        lockableElements.push(this.hiddenLayerInput);
        document.addEventListener('DOMContentLoaded', () => {
            if (cookie?.hiddenLayerSizes) {
                const cookieHiddenLayerSizes = cookie.hiddenLayerSizes;
                this.hiddenLayerInput.value = cookieHiddenLayerSizes.join(' ');
                this.hiddenLayerSizes = cookieHiddenLayerSizes;
            }
            if (cookie?.inputLayerOptions) {
                const cookieInputLayerOptions = cookie.inputLayerOptions;
                Object.keys(this.options).forEach((key) => {
                    const typedKey = key;
                    if (cookieInputLayerOptions[typedKey] !== undefined) {
                        this.options[typedKey].value = cookieInputLayerOptions[typedKey];
                        this.options[typedKey].element.checked = cookieInputLayerOptions[typedKey];
                    }
                });
            }
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
                    if (cookie === null) {
                        cookie = {};
                    }
                    cookie.inputLayerOptions = _c.serialiseInputLayerOptions();
                    updateCookie();
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
            if (cookie === null) {
                cookie = {};
            }
            cookie.hiddenLayerSizes = this.hiddenLayerSizes;
            updateCookie();
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
    currentTick: { element: document.getElementById('tickNumber') },
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
        const hash = sha1(wbString);
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
        if (isRaceMode) {
            return true;
        }
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
        LeaderBoard.leaderboard.push(...sortedCars.map(car => Cars.serialiseCarData(car, Looper.tickCount)));
        // Elimination
        let survivedCars = [];
        if (isRaceMode) {
            survivedCars = cars;
        }
        else {
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
        }
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
                newCar.colour = mutateColour(car.colour, 20);
                newCars.push(newCar);
            }
        }
        if (this.options.parentShouldMutate.value) {
            survivedCars.forEach(car => car.network.mutate());
        }
        cars = [...survivedCars, ...newCars];
        cars.forEach(car => { car.generation++; });
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
        this.tickCounter.style.setProperty('--progress', `${clamp(Looper.tickCount / NaturalSelection.options.tickLimit.value, 0, 1) * 100}%`);
    }
    /* ---------------------------------- Code ---------------------------------- */
    static init() {
        document.addEventListener('DOMContentLoaded', () => {
            if (cookie?.naturalSelectionOptions) {
                const cookieOptions = cookie.naturalSelectionOptions;
                Object.keys(this.options).forEach((key) => {
                    const typedKey = key;
                    if (cookieOptions[typedKey] !== undefined) {
                        this.options[typedKey].value = cookieOptions[typedKey];
                        this.options[typedKey].element.value = cookieOptions[typedKey].toString();
                        this.options[typedKey].element.checked = !!cookieOptions[typedKey];
                    }
                });
            }
            Object.keys(this.options).forEach((key) => {
                const typedKey = key;
                const inputOption = this.options[typedKey];
                if (!inputOption.element) {
                    throw new Error(`Input element for ${typedKey} not found`);
                }
                inputOption.element.addEventListener('change', onInputChange);
                onInputChange();
                function onInputChange() {
                    if (!inputOption.element.validity.valid) {
                        return;
                    }
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
                    if (cookie === null) {
                        cookie = {};
                    }
                    const serialisedOptions = {
                        tickLimit: NaturalSelection.options.tickLimit.value,
                        populationSize: NaturalSelection.options.populationSize.value,
                        survivalHarshness: NaturalSelection.options.survivalHarshness.value,
                        reproductionHarshness: NaturalSelection.options.reproductionHarshness.value,
                        mutationRate: NaturalSelection.options.mutationRate.value,
                        parentShouldMutate: NaturalSelection.options.parentShouldMutate.value,
                    };
                    cookie.naturalSelectionOptions = serialisedOptions;
                    updateCookie();
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
            console.log(carData);
            const entryElement = this.leaderboardEntryTemplate.content.cloneNode(true);
            entryElement.querySelector('.rank').textContent = (index + 1).toString();
            entryElement.querySelector('.id').textContent = carData.name || carData.hash.slice(0, 5);
            entryElement.querySelector('.generation').textContent = carData.generation.toString();
            entryElement.querySelector('.score').title = carData.score.toString();
            entryElement.querySelector('.score').textContent = carData.score.toPrecision(4);
            entryElement.querySelector('.lap').title = carData.lapCount.toString();
            entryElement.querySelector('.lap').textContent = carData.lapCount.toFixed(2);
            entryElement.querySelector('.avgSpeed').title = carData.averageSpeed.toString();
            entryElement.querySelector('.avgSpeed').textContent = carData.averageSpeed.toFixed(4);
            entryElement.querySelector('.onTrackPercentage').title = `${(carData.onTrackPercentage * 100)}%`;
            entryElement.querySelector('.onTrackPercentage').textContent = `${(carData.onTrackPercentage * 100).toFixed(2)}%`;
            // Store index as a data attribute for event delegation
            entryElement.firstElementChild.setAttribute('data-leaderboard-index', index.toString());
            this.leaderboardElement.appendChild(entryElement);
        });
    }
    static updateCarPeekerContent(carData) {
        _d.carPeeker.style.setProperty('--carColour', carData.colour);
        const carInputs = [];
        for (const option in carData.inputLayerOptions) {
            if (carData.inputLayerOptions[option]) {
                carInputs.push(option);
            }
        }
        const content = [
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
        NeuralNetwork.redrawNeuralNetwork(carData.network.inputNodes, carData.network.layers.map(layer => layer.nodes.length).slice(0, -1), carData.probeAngles, carData.colour, this.carPeekerNeuralNetworkCanvas, this.carPeekerNeuralNetworkCtx);
        this.carPeekerNeuralNetworkLayers.innerHTML = `Layers: ${[carData.network.inputNodes, ...carData.network.layers.map(layer => layer.nodes.length)].join(', ')}`;
        Garage.redrawCarProbes(1, carData.probeAngles, carData.colour, this.carPeekerProbeAnglesCanvas, this.carPeekerProbeAnglesCtx);
        this.carPeekerProbeAnglesList.innerHTML = `Angles: ${carData.probeAngles.map(angle => `${Math.round(angle * 180 / Math.PI * 100000) / 100000}°`).join(', ')}`;
    }
    static getSelectedLeaderboardEntryIndex(event) {
        if (!event) {
            return { index: null, entry: null };
        }
        const entry = (event?.target ?? this.leaderboardElement).closest('[data-leaderboard-index]');
        if (entry) {
            const index = parseInt(entry.getAttribute('data-leaderboard-index') || '', 10);
            if (!isNaN(index) && this.leaderboard[index]) {
                return { index, entry };
            }
        }
        return { index: null, entry: null };
    }
    static selectCar(event) {
        const { index, entry } = this.getSelectedLeaderboardEntryIndex(event);
        if (index === null || !this.leaderboard[index]) {
            return;
        }
        this.selectedCarData = this.leaderboard[index];
        this.leaderboardElement.querySelectorAll('.entry').forEach(el => el.classList.remove('selected'));
        entry?.classList.add('selected');
    }
    /* ---------------------------------- Code ---------------------------------- */
    static init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.carPeekerNeuralNetworkCanvas.width = this.CAR_PEEKER_NEURAL_NETWORK_WIDTH;
            this.carPeekerNeuralNetworkCanvas.height = this.CAR_PEEKER_NEURAL_NETWORK_HEIGHT;
            this.carPeekerProbeAnglesCanvas.width = this.CAR_PEEKER_PROBE_ANGLES_WIDTH;
            this.carPeekerProbeAnglesCanvas.height = this.CAR_PEEKER_PROBE_ANGLES_HEIGHT;
        });
        this.leaderboardElement.addEventListener('mousemove', (event) => { this.updatePeeker(event); });
        this.leaderboardElement.addEventListener('click', (event) => {
            this.updatePeeker(event);
            this.selectCar(event);
        });
        this.leaderboardElement.addEventListener('scroll', () => { this.carPeeker.classList.add('hidden'); });
        this.leaderboardElement.addEventListener('mouseleave', () => { this.carPeeker.classList.add('hidden'); });
        this.resetLeaderboardButton.addEventListener('click', () => {
            if (!confirm('Are you sure you want to reset the leaderboard?')) {
                return;
            }
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
            if (name !== null) {
                this.selectedCarData.name = name;
            }
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
_d = LeaderBoard;
/* ---------------------------------- Logic --------------------------------- */
LeaderBoard.leaderboardElement = document.getElementById('leaderboard');
LeaderBoard.leaderboardEntryTemplate = document.getElementById('leaderboardEntryTemplate');
LeaderBoard.LEADERBOARD_MAX_ENTRIES = 100;
LeaderBoard.leaderboard = [];
LeaderBoard.carPeeker = document.getElementById('carPeeker');
LeaderBoard.carPeekerTextContentElement = document.getElementById('carPeekerTextContent');
LeaderBoard.CAR_PEEKER_NEURAL_NETWORK_WIDTH = 200;
LeaderBoard.CAR_PEEKER_NEURAL_NETWORK_HEIGHT = 100;
LeaderBoard.carPeekerNeuralNetworkCanvas = document.getElementById('carPeekerNeuralNetwork');
LeaderBoard.carPeekerNeuralNetworkCtx = _d.carPeekerNeuralNetworkCanvas.getContext('2d');
LeaderBoard.carPeekerNeuralNetworkLayers = document.getElementById('carPeekerNeuralNetworkLayers');
LeaderBoard.CAR_PEEKER_PROBE_ANGLES_WIDTH = 100;
LeaderBoard.CAR_PEEKER_PROBE_ANGLES_HEIGHT = 100;
LeaderBoard.carPeekerProbeAnglesCanvas = document.getElementById('carPeekerProbeAngles');
LeaderBoard.carPeekerProbeAnglesCtx = _d.carPeekerProbeAnglesCanvas.getContext('2d');
LeaderBoard.carPeekerProbeAnglesList = document.getElementById('carPeekerProbeAnglesList');
/* ----------------------------------- UI ----------------------------------- */
LeaderBoard.selectedCarData = null;
LeaderBoard.resetLeaderboardButton = document.getElementById('resetLeaderboardButton');
LeaderBoard.exportSelectedCarButton = document.getElementById('exportSelectedCarButton');
LeaderBoard.updatePeeker = (event) => {
    const { index } = _d.getSelectedLeaderboardEntryIndex(event);
    if (index !== null && _d.leaderboard[index]) {
        _d.updateCarPeekerContent(_d.leaderboard[index]);
        if (event) {
            const rect = _d.leaderboardElement.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const X_OFFSET = 10;
            const Y_OFFSET = 0;
            _d.carPeeker.style.top = `${(y + rect.top) / zoomFactor + Y_OFFSET}px`;
            _d.carPeeker.style.left = `${(x + rect.left) / zoomFactor + X_OFFSET}px`;
        }
        _d.carPeeker.classList.remove('hidden');
        return;
    }
    _d.carPeeker.classList.add('hidden');
    return;
};
LeaderBoard.init();
/* -------------------------------------------------------------------------- */
/*                                   Looper                                   */
/* -------------------------------------------------------------------------- */
class Looper {
    static runLoop(looper) {
        function step(currentTime) {
            if (Looper.tickLoopPaused) {
                Looper.lastFrameTime = currentTime;
                requestAnimationFrame(step);
                return;
            }
            // Calculate delta time since last frame
            const deltaTime = currentTime - Looper.lastFrameTime;
            Looper.lastFrameTime = currentTime;
            // Add to accumulator
            Looper.timeAccumulator += deltaTime;
            // Fixed time step (in ms)
            const timeStep = 1000 / Looper.targetTPS;
            // Run as many ticks as needed to catch up
            let ticksThisFrame = 0;
            const maxTicksPerFrame = Math.min(100, Math.ceil(Looper.targetTPS / 30)); // Safety limit
            while (Looper.timeAccumulator >= timeStep && ticksThisFrame < maxTicksPerFrame) {
                const startTime = performance.now();
                const res = looper.next();
                const endTime = performance.now();
                Looper.tickDurations.push(endTime - startTime);
                if (Looper.tickDurations.length > 500) {
                    Looper.tickDurations.shift();
                }
                if (res.done) {
                    return;
                }
                Looper.timeAccumulator -= timeStep;
                ticksThisFrame++;
                Looper.ticksInLastSecond++;
            }
            // Update TPS counter once per second
            const tpsUpdateIntervalMs = 100;
            if (currentTime - Looper.lastTPSUpdateTime >= tpsUpdateIntervalMs) {
                Looper.actualTPS = Looper.ticksInLastSecond / (tpsUpdateIntervalMs / 1000);
                Looper.updateTickSpeedDisplay();
                Looper.ticksInLastSecond = 0;
                Looper.lastTPSUpdateTime = currentTime;
                const averageTickDuration = Looper.tickDurations.reduce((a, b) => a + b, 0) / Looper.tickDurations.length;
                Looper.maxTPS = Math.round(1000 / averageTickDuration);
                Looper.updateMaxTickSpeedDisplay();
            }
            requestAnimationFrame(step);
        }
        // Initialize and start the loop
        Looper.lastFrameTime = performance.now();
        Looper.lastTPSUpdateTime = performance.now();
        requestAnimationFrame(step);
    }
    static *generationLoop() {
        while (true) {
            this.generationCount++;
            console.log(`---------- Starting Generation ${this.generationCount} with ${cars.length} cars ----------`);
            NaturalSelection.generationStart();
            if (isRaceMode) {
                this.generationLoopButton.click();
            }
            const startTime = performance.now();
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
            const endTime = performance.now();
            console.log(`Generation ${this.generationCount} completed in ${(endTime - startTime).toFixed(2)} ms (${(this.tickCount / ((endTime - startTime) / 1000)).toFixed(2)} TPS)`);
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
            if (!isRaceMode) {
                NaturalSelection.generationPostEnd(survivedCars);
            }
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
    static updateTickSpeedDisplay() {
        this.tickSpeedDisplay.textContent = this.actualTPS.toString();
    }
    static updateMaxTickSpeedDisplay() {
        this.maxTickSpeedDisplay.textContent = this.maxTPS.toString();
    }
    /* ---------------------------------- Code ---------------------------------- */
    static init() {
        document.addEventListener('DOMContentLoaded', () => {
            const initialTargetTPS = cookie?.targetTPS ?? parseFloat(this.targetTickSpeedInput.value);
            this.targetTickSpeedInput.value = initialTargetTPS.toString();
            this.targetTPS = initialTargetTPS;
        });
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
            this.generationLoopStopped = true;
            this.generationLoopButton.disabled = true;
        });
        this.targetTickSpeedInput.addEventListener('change', onTargetTickSpeedInputChange);
        function onTargetTickSpeedInputChange() {
            if (!Looper.targetTickSpeedInput.validity.valid) {
                return;
            }
            const newTargetTPS = parseFloat(Looper.targetTickSpeedInput.value);
            Looper.targetTPS = newTargetTPS;
            if (cookie === null) {
                cookie = {};
            }
            cookie.targetTPS = newTargetTPS;
            updateCookie();
        }
    }
}
/* ---------------------------------- Logic --------------------------------- */
Looper.ticksInLastSecond = 0;
Looper.lastTPSUpdateTime = 0;
Looper.actualTPS = 0;
Looper.tickLoopPaused = true;
Looper.generationLoopStopped = false;
Looper.generationLooper = null;
Looper.targetTPS = 200;
Looper.lastFrameTime = 0;
Looper.timeAccumulator = 0;
Looper.maxTPS = 0;
Looper.tickDurations = [];
Looper.generationCount = 0;
Looper.tickCount = 0;
/* ----------------------------------- UI ----------------------------------- */
Looper.maxTickSpeedDisplay = document.getElementById('maxTickSpeed');
Looper.tickSpeedDisplay = document.getElementById('tickSpeed');
Looper.targetTickSpeedInput = document.getElementById('targetTickSpeedInput');
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
function mutateColour(colour, scale) {
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
function sha1(...inputs) {
    let input = inputs.join('|');
    // Adapted from https://geraintluff.github.io/sha1/
    function rotate_left(n, s) { return (n << s) | (n >>> (32 - s)); }
    function cvt_hex(val) {
        let str = "";
        for (let i = 7; i >= 0; i--) {
            str += ((val >>> (i * 4)) & 0x0f).toString(16);
        }
        return str;
    }
    let blockStart;
    const W = new Array(80);
    let H0 = 0x67452301;
    let H1 = 0xEFCDAB89;
    let H2 = 0x98BADCFE;
    let H3 = 0x10325476;
    let H4 = 0xC3D2E1F0;
    let A, B, C, D, E;
    let temp;
    // UTF-8 encode
    input = unescape(encodeURIComponent(input));
    const str_len = input.length;
    const word_array = [];
    for (let i = 0; i < str_len - 3; i += 4) {
        word_array.push((input.charCodeAt(i) << 24) |
            (input.charCodeAt(i + 1) << 16) |
            (input.charCodeAt(i + 2) << 8) |
            (input.charCodeAt(i + 3)));
    }
    let i = str_len % 4;
    let tmp = 0;
    if (i === 0) {
        tmp = 0x080000000;
    }
    else if (i === 1) {
        tmp = (input.charCodeAt(str_len - 1) << 24) | 0x0800000;
    }
    else if (i === 2) {
        tmp = (input.charCodeAt(str_len - 2) << 24) | (input.charCodeAt(str_len - 1) << 16) | 0x08000;
    }
    else if (i === 3) {
        tmp = (input.charCodeAt(str_len - 3) << 24) | (input.charCodeAt(str_len - 2) << 16) | (input.charCodeAt(str_len - 1) << 8) | 0x80;
    }
    word_array.push(tmp);
    while ((word_array.length % 16) !== 14)
        word_array.push(0);
    word_array.push(str_len >>> 29);
    word_array.push((str_len << 3) & 0x0ffffffff);
    for (blockStart = 0; blockStart < word_array.length; blockStart += 16) {
        for (let i = 0; i < 16; i++)
            W[i] = word_array[blockStart + i];
        for (let i = 16; i < 80; i++)
            W[i] = rotate_left(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);
        A = H0;
        B = H1;
        C = H2;
        D = H3;
        E = H4;
        for (let i = 0; i < 80; i++) {
            let f, k;
            if (i < 20) {
                f = (B & C) | ((~B) & D);
                k = 0x5A827999;
            }
            else if (i < 40) {
                f = B ^ C ^ D;
                k = 0x6ED9EBA1;
            }
            else if (i < 60) {
                f = (B & C) | (B & D) | (C & D);
                k = 0x8F1BBCDC;
            }
            else {
                f = B ^ C ^ D;
                k = 0xCA62C1D6;
            }
            temp = (rotate_left(A, 5) + f + E + k + W[i]) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }
        H0 = (H0 + A) & 0x0ffffffff;
        H1 = (H1 + B) & 0x0ffffffff;
        H2 = (H2 + C) & 0x0ffffffff;
        H3 = (H3 + D) & 0x0ffffffff;
        H4 = (H4 + E) & 0x0ffffffff;
    }
    return cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);
}
//#endregion
