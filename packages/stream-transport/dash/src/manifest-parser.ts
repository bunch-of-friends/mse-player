import { StreamDescriptor, AdaptationSetType, HttpHandler } from '@mse-player/core';
import { DashSegmentTemplateSegmentProvider } from './dash-segment-template-segment-provider';

const iso8601DurationRegex = /P(?:([0-9]+)Y)?(?:([0-9]+)M)?(?:([0-9]+)D)?T(?:([0-9]+)H)?(?:([0-9]+)M)?(?:([0-9]+(?:\.[0-9]+)?)?S)?/;

export class ManifestParser {
    private defaultStreamDescriptor = {
        isLive: false,
        durationMs: 634566,
        adaptationSets: [
            {
                type: AdaptationSetType.Video,
                mimeType: 'video/mp4',
                representations: [
                    {
                        codecs: 'avc1.640028',
                        id: 'bbb_30fps_1920x1080_8000k',
                        bandwidth: 9914554,
                        segmentProvider: new DashSegmentTemplateSegmentProvider(634566, this.httpHandler),
                    },
                ],
            },
        ],
    };

    constructor(private httpHandler: HttpHandler) {}

    public getStreamDescriptor(xmlString: string): StreamDescriptor {
        const xml = new DOMParser().parseFromString(xmlString, 'text/html');
        const mpdResult = this.evaluateXml('//MPD', xml);
        const mpdNode = mpdResult.iterateNext() as Element;
        if (!mpdNode) {
            return this.defaultStreamDescriptor;
        }

        const isLive = mpdNode.getAttribute('type') === 'dynamic';
        const durationAttribute = mpdNode.getAttribute('mediaPresentationDuration');
        let durationMs: number;
        if (!durationAttribute) {
            durationMs = 0;
        } else {
            durationMs = this.getSecondsFromManifestTimeValue(durationAttribute) * 1000;
        }

        console.log(mpdNode); // tslint:disable-line no-console
        console.log(`isLive: ${isLive}`); // tslint:disable-line no-console
        console.log(`durationMs: ${durationMs}`); // tslint:disable-line no-console

        return {
            ...this.defaultStreamDescriptor,
            isLive,
            durationMs,
        };
    }

    private evaluateXml(expression: string, xml: Document) {
        return xml.evaluate(expression, xml, null, XPathResult.ANY_TYPE, null);
    }

    private getSecondsFromManifestTimeValue(time: string): number {
        const timeRegexResult = iso8601DurationRegex.exec(time);
        if (!timeRegexResult) {
            return 0;
        }
        return timeRegexResult.reduce((totalTime, currentVal, index) => {
            switch (index) {
                case 1: // years
                    return totalTime + (parseFloat(currentVal) * 31536000 || 0);
                case 2: // months
                    return totalTime + (parseFloat(currentVal) * 2419200 || 0);
                case 3: // days
                    return totalTime + (parseFloat(currentVal) * 86400 || 0);
                case 4: // hours
                    return totalTime + (parseFloat(currentVal) * 3600 || 0);
                case 5: // minutes
                    return totalTime + (parseFloat(currentVal) * 60 || 0);
                case 6: // seconds
                    return totalTime + (parseFloat(currentVal) || 0);
                default:
                    return totalTime;
            }
        }, 0);
    }
}
