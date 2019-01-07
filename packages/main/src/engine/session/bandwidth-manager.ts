import { HttpHandlerResponseMetadata } from '@mse-player/core';
interface BandwidthSample {
    sizeKb: number;
    timeTakenSeconds: number;
}
export class BandwidthManager {
    private bandwidthBuffer = new Array<BandwidthSample>();
    private averageBandwidth: number;
    private readonly BANDWIDTH_SAMPLE_SIZE = 10; // TODO: configurable based on chunk size?
    public addToBandwidthSample(res: HttpHandlerResponseMetadata) {
        const sample: BandwidthSample = {
            sizeKb: this.roundDecimal(res.responseSizeInBytes / 1000, 2),
            timeTakenSeconds: this.roundDecimal(res.timeTaken / 1000, 2),
        };

        this.bandwidthBuffer.push(sample);
        if (this.bandwidthBuffer.length > this.BANDWIDTH_SAMPLE_SIZE) {
            this.bandwidthBuffer.shift();
        }
    console.log('DOWNLOADED: ' + sample.sizeKb, 'kb IN: ', sample.timeTakenSeconds, 'SECONDS');
        this.averageBandwidth = this.calculateAverageBandwidth();
    }

    public getAverageBandwidth() {
        return this.averageBandwidth;
    }

    private calculateAverageBandwidth() {
        let sampleTotal = 0;
        this.bandwidthBuffer.forEach(item => {
            sampleTotal += item.sizeKb / item.timeTakenSeconds;
        });

        return Math.round(sampleTotal / this.bandwidthBuffer.length);
    }

    private roundDecimal(num: number, decimalPlaces: number) {
        return Number.parseFloat(num.toFixed(decimalPlaces));
    }
}
