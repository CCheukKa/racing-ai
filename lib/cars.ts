import { getRandomColour } from "./utils/canvasUtils";
import { MathExtra } from "./utils/mathExtra";
import { Network, NeuralNetwork, type SerialisedInputLayerOptions } from "./components/neuralNetwork";
import { Stadium } from "./components/stadium";

export class Cars {
    public static serialiseCarData(car: Car, ticksInGeneration: number): SerialisedCarData {
        const probeAngles = car.probes.map(probe => probe.angle);
        return {
            name: car.name ?? "",
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
    public static deserialiseCarData(carData: SerialisedCarData, importMode: boolean = false): Car {
        const car = new Car(undefined, undefined, carData.probeAngles);
        const network = new Network([
            importMode ? carData.network.inputNodes : NeuralNetwork.getInputLayerSize(),
            ... (importMode ? carData.network.layers.map(layer => layer.nodes.length).slice(0, -1) : NeuralNetwork.hiddenLayerSizes),
            2]);
        network.layers = carData.network.layers;
        car.name = carData.name ?? "";
        car.lapCount = carData.lapCount;
        car.score = carData.score;
        car.network = network;
        car.inputLayerOptions = { ...(carData.inputLayerOptions ?? NeuralNetwork.serialiseInputLayerOptions()) };
        car.generation = carData.generation;
        car.colour = carData.colour;
        return car;
    }

    private static getHash(car: Car): string {
        const probeAnglesHash = JSON.stringify(car.probes);
        const networkWeightsHash = car.network.getHash();
        const hash = MathExtra.sha1(probeAnglesHash, networkWeightsHash);
        return hash;
    }
}
class Probe {
    public angle: number;
    public distance: number = Infinity;

    constructor(angle: number) {
        this.angle = angle;
    }
}
export class Car {
    public colour: string;
    public name?: string;
    public generation: number = 0;

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

    public inputLayerOptions: SerialisedInputLayerOptions;

    constructor(x: number = Stadium.TRACK_START_X, y: number = Stadium.TRACK_START_Y, probeAngles: number[] = []) {
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
        this.engineInput = MathExtra.clamp(this.engineInput, -1, 1);
        this.steerInput = MathExtra.clamp(this.steerInput, -1, 1);

        this.isOnTrack = Stadium.isOnTrack({ x: this.x, y: this.y });

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

        this.speed = MathExtra.clamp(this.speed, -1, 5); // Limit speed
        this.speed *= this.isOnTrack ? 1 : 0.99; // Slow down on grass

        const turnSpeed = 0.02 * MathExtra.map(this.speed, -1, 1, -1, 1, true);
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

    clone(): Car {
        const newCar = new Car(this.x, this.y, this.probes.map(probe => probe.angle));
        newCar.network = this.network.clone();
        newCar.inputLayerOptions = { ...this.inputLayerOptions };
        newCar.generation = this.generation;
        return newCar;
    }
}
export type SerialisedCarData = {
    name?: string;
    colour: string;
    probeAngles: number[];
    generation: number;
    lapCount: number;
    score: number;
    averageSpeed: number;
    onTrackPercentage: number;
    network: Network;
    inputLayerOptions: SerialisedInputLayerOptions;
    hash: string;
}