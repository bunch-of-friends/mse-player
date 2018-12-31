import { ManifestAquisition, AdaptationSetType, HttpHandler } from '@mse-player/core';
import { TemplateSegmentProvider } from './template-segment-provider';

const iso8601DurationRegex = /P(?:([0-9]+)Y)?(?:([0-9]+)M)?(?:([0-9]+)D)?T(?:([0-9]+)H)?(?:([0-9]+)M)?(?:([0-9]+(?:\.[0-9]+)?)?S)?/;

export class ManifestParser {
    private defaultStreamDescriptor = {
        isLive: false,
        duration: 634.566,
        adaptationSets: [
            {
                type: AdaptationSetType.Video,
                mimeType: 'video/mp4',
                representations: [
                    {
                        codecs: 'avc1.640028',
                        id: 'bbb_30fps_1920x1080_8000k',
                        bandwidth: 9914554,
                        segmentProvider: new TemplateSegmentProvider(634.566, this.httpHandler),
                    },
                ],
            },
        ],
    };

    constructor(private httpHandler: HttpHandler) {}

    public getStreamDescriptor(xml: Document): ManifestAquisition {
        console.log('THIS IS OUR DOCUMENT:', xml); // tslint:disable-line no-console
        const mpdResult = this.evaluateXml('//MPD', xml);
        const mpdNode = mpdResult.iterateNext() as Element;
        if (!mpdNode) {
            return { isSuccess: true, streamDescriptor: this.defaultStreamDescriptor };
        }

        const isLive = mpdNode.getAttribute('type') === 'dynamic';
        const durationAttribute = mpdNode.getAttribute('mediaPresentationDuration');
        let duration: number;
        if (!durationAttribute) {
            duration = 0;
        } else {
            duration = this.getSecondsFromManifestTimeValue(durationAttribute);
        }

        console.log(mpdNode); // tslint:disable-line no-console
        console.log(`isLive: ${isLive}`); // tslint:disable-line no-console
        console.log(`duration: ${duration}`); // tslint:disable-line no-console

        const streamDescriptor = {
            ...this.defaultStreamDescriptor,
            isLive,
            duration,
        };

        return {
            isSuccess: true,
            streamDescriptor,
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
