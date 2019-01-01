import { ManifestAcquisition, AdaptationSetType, HttpHandler } from '@mse-player/core';
import { TemplateSegmentProvider } from './template-segment-provider';

const iso8601DurationRegex = /P(?:([0-9]+)Y)?(?:([0-9]+)M)?(?:([0-9]+)D)?T(?:([0-9]+)H)?(?:([0-9]+)M)?(?:([0-9]+(?:\.[0-9]+)?)?S)?/;

export class ManifestParser {
    private defaultStreamDescriptor = {
        streamInfo: {
            isLive: false,
            duration: 634.566,
        },
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

    public getStreamDescriptor(xml: Document): ManifestAcquisition {
        const xmlns = this.getNamespace(xml);
        const typeExpression = '*/@type';
        const durationExpression = '*/@mediaPresentationDuration';
        const periodExpression = '//xmlns:Period';

        const mpdResult = xml.evaluate(
            this.concatenateXpathExpressions(typeExpression, durationExpression, periodExpression),
            xml,
            prefix => {
                // tslint:enable
                switch (prefix) {
                    case 'xmlns':
                        return xmlns;
                    default:
                        return null;
                }
            },
            XPathResult.ANY_TYPE,
            null
        );

        const mpdTypeNode = mpdResult.iterateNext();
        const mpdDurationNode = mpdResult.iterateNext();
        const periodNode = mpdResult.iterateNext();

        const isLive = (mpdTypeNode && mpdTypeNode.nodeValue) === 'dynamic';
        const duration = (mpdDurationNode && mpdDurationNode.nodeValue && this.getSecondsFromManifestTimeValue(mpdDurationNode.nodeValue)) || 0;
        // tslint:disable no-console
        console.log('!!!!!!!!!!!!!!! LOOK BELOW !!!!!!!!!!!!!!!');
        console.log('isLive', isLive);
        console.log('duration', duration);
        console.log('period node', periodNode);
        console.log('!!!!!!!!!!!!!!! LOOK ABOVE !!!!!!!!!!!!!!!');
        // tslint:enable

        const streamDescriptor = {
            ...this.defaultStreamDescriptor,
            streamInfo: {
                isLive,
                duration,
            },
        };

        return {
            isSuccess: true,
            streamDescriptor,
        };
    }

    private concatenateXpathExpressions(...expressions: Array<string>): string {
        return `/${expressions.join('|')}`;
    }

    private getNamespace(xml: Document): string | null {
        const firstElement = xml.firstElementChild;
        if (!firstElement) {
            return null;
        }
        return firstElement.namespaceURI;
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
