import { AdaptationSet, AdaptationSetType, HttpHandlerBase, Representation, XpathHelper, StreamDescriptor } from '@mse-player/core';
import { TemplateSegmentProvider, TemplateSegmentInfo } from './template-segment-provider';
import * as Expressions from './constants/xpath-expressions';

const iso8601DurationRegex = /P(?:([0-9]+)Y)?(?:([0-9]+)M)?(?:([0-9]+)D)?T(?:([0-9]+)H)?(?:([0-9]+)M)?(?:([0-9]+(?:\.[0-9]+)?)?S)?/;

export class ManifestParser {
    private xpathHelper: XpathHelper;
    constructor(private httpHandler: HttpHandlerBase) {}

    public getStreamDescriptor(xml: Document): StreamDescriptor {
        this.xpathHelper = new XpathHelper(xml, this.getNamespace(xml));

        const streamInfoExpression = this.xpathHelper.concatenateExpressions(Expressions.TYPE, Expressions.DURATION);
        const streamInfo = this.xpathHelper.getAttributes(streamInfoExpression, xml);

        const isLive = streamInfo.type === 'dynamic';
        const duration = this.getSecondsFromManifestTimeValue(streamInfo.mediaPresentationDuration);
        const absoluteUrl = xml.URL.replace(xml.URL.substring(xml.URL.lastIndexOf('/') + 1), '');

        const adaptationSetNodes = this.xpathHelper.getNodes(Expressions.ADAPTATION_SET, xml);
        const adaptationSets: Array<AdaptationSet> = [];
        adaptationSetNodes.forEach(x => adaptationSets.push(this.parseAdaptationSet(x, duration, absoluteUrl)));

        const streamDescriptor = {
            streamInfo: {
                isLive,
                duration,
            },
            adaptationSets
        };

        // console.log('streamDescriptor:', streamDescriptor); // tslint:disable-line
        return streamDescriptor;
    }

    private parseAdaptationSet(adaptationSetNode: Node, assetDuration: number, absoluteUrl: string) {
        const type = this.xpathHelper.getSingleAttribute(Expressions.CONTENT_TYPE, adaptationSetNode);
        const initTemplate = this.xpathHelper.getSingleAttribute(Expressions.INIT_TEMPLATE, adaptationSetNode);
        const mediaTemplate = this.xpathHelper.getSingleAttribute(Expressions.MEDIA_TEMPLATE, adaptationSetNode);
        const representationNodes = this.xpathHelper.getNodes(Expressions.REPRESENTATION, adaptationSetNode);
        const representations: Array<Representation> = [];
        const segmentInfo = { assetDuration, initTemplate, mediaTemplate, type, absoluteUrl };
        representationNodes.forEach(y => representations.push(this.parseRepresentation(y, segmentInfo)));
        return {
            type: type as AdaptationSetType,
            mimeType: this.xpathHelper.getSingleAttribute(Expressions.MIME_TYPES, adaptationSetNode),
            representations: representations,
        };
    }

    private parseRepresentation(representationNode: Node, segmentInfo: TemplateSegmentInfo) {
        const id = this.xpathHelper.getSingleAttribute(Expressions.ID, representationNode);
        const representation = {
            codecs: this.xpathHelper.getSingleAttribute(Expressions.CODECS, representationNode),
            id: id,
            bandwidth: parseInt(this.xpathHelper.getSingleAttribute(Expressions.BANDWIDTH, representationNode), 10) || 0,
            segmentProvider: new TemplateSegmentProvider(segmentInfo, id, this.httpHandler),
        };

        if (segmentInfo.type === AdaptationSetType.Video) {
            return {
                ...representation,
                width: parseInt(this.xpathHelper.getSingleAttribute(Expressions.WIDTH, representationNode), 10) || 0,
                height: parseInt(this.xpathHelper.getSingleAttribute(Expressions.HEIGHT, representationNode), 10) || 0,
                frameRate: parseInt(this.xpathHelper.getSingleAttribute(Expressions.FRAME_RATE, representationNode), 10) || 0,
            };
        } else {
            return {
                ...representation,
                channels: parseInt(this.xpathHelper.getSingleAttribute(Expressions.AUDIO_CHANNELS, representationNode), 10) || 0,
                samplingRate: parseInt(this.xpathHelper.getSingleAttribute(Expressions.SAMPLING_RATE, representationNode), 10) || 0,
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
