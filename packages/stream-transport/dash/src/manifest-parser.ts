import { AdaptationSet, AdaptationSetType, HttpHandlerBase, ManifestAcquisition, Representation, XpathHelper } from '@mse-player/core';
import { TemplateSegmentProvider, TemplateSegmentInfo } from './template-segment-provider';
import * as Expressions from './constants/xpath-expressions';

const iso8601DurationRegex = /P(?:([0-9]+)Y)?(?:([0-9]+)M)?(?:([0-9]+)D)?T(?:([0-9]+)H)?(?:([0-9]+)M)?(?:([0-9]+(?:\.[0-9]+)?)?S)?/;

export class ManifestParser {
    private xpathHelper: XpathHelper;
    constructor(private httpHandler: HttpHandlerBase) {}

    public getStreamDescriptor(xml: Document): ManifestAcquisition {
        this.xpathHelper = new XpathHelper(xml, this.getNamespace(xml));

        const streamInfoExpression = this.xpathHelper.concatenateExpressions(Expressions.TYPE, Expressions.DURATION);
        const streamInfo = this.xpathHelper.getAttributes(streamInfoExpression, xml);

        const isLive = streamInfo[0] === 'dynamic';
        const duration = (streamInfo[1] && this.getSecondsFromManifestTimeValue(streamInfo[1])) || 0;
        const absoluteUrl = xml.URL.replace(xml.URL.substring(xml.URL.lastIndexOf('/') + 1), '');

        const adaptationSetNodes = this.xpathHelper.getNodes(Expressions.ADAPTATION_SET, xml);
        const adaptationSets: Array<AdaptationSet> = [];
        adaptationSetNodes.forEach(x => adaptationSets.push(this.parseAdaptationSet(x, duration, absoluteUrl)));

        const manifestAcquisition = {
            isSuccess: true,
            streamDescriptor: {
                streamInfo: {
                    isLive,
                    duration,
                },
                adaptationSets,
            },
        };

        console.log('manifestAcquision:', manifestAcquisition); // tslint:disable-line
        return manifestAcquisition;
    }

    private parseAdaptationSet(adaptationSetNode: Node, assetDuration: number, absoluteUrl: string) {
        const type = this.xpathHelper.getAttributes(Expressions.CONTENT_TYPE, adaptationSetNode)[0] || '';
        const initTemplate = this.xpathHelper.getAttributes(Expressions.INIT_TEMPLATE, adaptationSetNode)[0] || '';
        const mediaTemplate = this.xpathHelper.getAttributes(Expressions.MEDIA_TEMPLATE, adaptationSetNode)[0] || '';
        const representationNodes = this.xpathHelper.getNodes(Expressions.REPRESENTATION, adaptationSetNode);
        const representations: Array<Representation> = [];
        const segmentInfo = { assetDuration, initTemplate, mediaTemplate, type, absoluteUrl };
        representationNodes.forEach(y => representations.push(this.parseRepresentation(y, segmentInfo)));
        return {
            type: type as AdaptationSetType,
            mimeType: this.xpathHelper.getAttributes(Expressions.MIME_TYPES, adaptationSetNode)[0] || '',
            representations: representations,
        };
    }

    private parseRepresentation(representationNode: Node, segmentInfo: TemplateSegmentInfo) {
        const id = this.xpathHelper.getAttributes(Expressions.ID, representationNode)[0] || '';
        const representation = {
            codecs: this.xpathHelper.getAttributes(Expressions.CODECS, representationNode)[0] || '',
            id: id,
            bandwidth: parseInt(this.xpathHelper.getAttributes(Expressions.BANDWIDTH, representationNode)[0], 10) || 0,
            segmentProvider: new TemplateSegmentProvider(segmentInfo, id, this.httpHandler),
        };

        if (segmentInfo.type === AdaptationSetType.Video) {
            return {
                ...representation,
                width: parseInt(this.xpathHelper.getAttributes(Expressions.WIDTH, representationNode)[0], 10) || 0,
                height: parseInt(this.xpathHelper.getAttributes(Expressions.HEIGHT, representationNode)[0], 10) || 0,
                frameRate: parseInt(this.xpathHelper.getAttributes(Expressions.FRAME_RATE, representationNode)[0], 10) || 0,
            };
        } else {
            return {
                ...representation,
                channels: parseInt(this.xpathHelper.getAttributes(Expressions.AUDIO_CHANNELS, representationNode)[0], 10) || 0,
                samplingRate: parseInt(this.xpathHelper.getAttributes(Expressions.SAMPLING_RATE, representationNode)[0], 10) || 0,
            };
        }
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
