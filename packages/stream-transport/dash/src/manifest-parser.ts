import { AdaptationSet, AdaptationSetType, HttpHandlerBase, Representation, XpathHelper, StreamDescriptor } from '@mse-player/core';
import { TemplateSegmentProvider, TemplateSegmentMetadata } from './template-segment-provider';
import * as Expressions from './constants/xpath-expressions';

const iso8601DurationRegex = /P(?:([0-9]+)Y)?(?:([0-9]+)M)?(?:([0-9]+)D)?T(?:([0-9]+)H)?(?:([0-9]+)M)?(?:([0-9]+(?:\.[0-9]+)?)?S)?/;

export class ManifestParser {
    private xpathHelper: XpathHelper;
    constructor(private httpHandler: HttpHandlerBase) {}

    public getStreamDescriptor(xml: Document, manifestUrl: string): StreamDescriptor {
        this.xpathHelper = new XpathHelper(xml, this.getNamespace(xml));

        const streamInfoExpression = this.xpathHelper.concatenateExpressions(Expressions.TYPE, Expressions.DURATION);
        const streamInfo = this.xpathHelper.getAttributes(streamInfoExpression, xml);

        const isLive = streamInfo.type === 'dynamic';
        const duration = this.getSecondsFromManifestTimeValue(streamInfo.mediaPresentationDuration);

        const absoluteUrl = manifestUrl.replace(manifestUrl.substring(manifestUrl.lastIndexOf('/') + 1), '');

        const adaptationSetNodes = this.xpathHelper.getNodes(Expressions.ADAPTATION_SET, xml);
        const adaptationSets: Array<AdaptationSet> = [];
        adaptationSetNodes.forEach(x => adaptationSets.push(this.parseAdaptationSet(x, duration, absoluteUrl)));

        const streamDescriptor = {
            streamInfo: {
                isLive,
                duration,
            },
            adaptationSets: [adaptationSets.filter((a) => a.type === 'video')[0], adaptationSets.filter((a) => a.type === 'audio')[0]],
        };

        // console.log('streamDescriptor:', streamDescriptor); // tslint:disable-line
        return streamDescriptor;
    }

    private parseAdaptationSet(adaptationSetNode: Node, assetDuration: number, absoluteUrl: string) {
        const type = this.xpathHelper.getSingleAttribute(Expressions.CONTENT_TYPE, adaptationSetNode);
        const initTemplate = this.xpathHelper.getSingleAttribute(Expressions.INIT_TEMPLATE, adaptationSetNode);
        const mediaTemplate = this.xpathHelper.getSingleAttribute(Expressions.MEDIA_TEMPLATE, adaptationSetNode);
        const defaultCodecs = this.xpathHelper.getSingleAttribute(Expressions.CODECS, adaptationSetNode);
        const timescale = parseInt(this.xpathHelper.getSingleAttribute(Expressions.SEGMENT_TIMESCALE, adaptationSetNode), 0) || 1;
        const representationNodes = this.xpathHelper.getNodes(Expressions.REPRESENTATION, adaptationSetNode);
        const representations: Array<Representation> = [];
        const segmentDurations = this.getSegmentDurations(adaptationSetNode);
        const segmentMetadata = { assetDuration, initTemplate, mediaTemplate, type, absoluteUrl, timescale, segmentDurations };

        representationNodes.forEach(y => representations.push(this.parseRepresentation(y, segmentMetadata, defaultCodecs)));
        return {
            type: type as AdaptationSetType,
            mimeType: this.xpathHelper.getSingleAttribute(Expressions.MIME_TYPES, adaptationSetNode),
            representations: representations,
        };
    }

    private parseRepresentation(representationNode: Node, segmentInfo: TemplateSegmentMetadata, defaultCodecs: string) {
        const id = this.xpathHelper.getSingleAttribute(Expressions.ID, representationNode);
        const bandwidth = parseInt(this.xpathHelper.getSingleAttribute(Expressions.BANDWIDTH, representationNode), 10) || 0;

        const representation = {
            codecs: this.xpathHelper.getSingleAttribute(Expressions.CODECS, representationNode) || defaultCodecs,
            id,
            bandwidth,
            segmentProvider: new TemplateSegmentProvider(segmentInfo, id, bandwidth, this.httpHandler),
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

    private getSegmentDurations(adaptationSetNode: Node) {
        const sNodes = this.xpathHelper.getNodes(Expressions.SEGMENT_TIMEDATA, adaptationSetNode);

        if (sNodes && sNodes.length) {
            return sNodes.map(sNode => {
                return {
                    delta: parseInt(this.xpathHelper.getSingleAttribute(Expressions.DELTA, sNode), 0),
                    repeats: (parseInt(this.xpathHelper.getSingleAttribute(Expressions.REPEATS, sNode), 0) || 0) + 1,
                };
            });
        } else {
            const duration = parseInt(this.xpathHelper.getSingleAttribute(Expressions.SEGMENT_DURATION, adaptationSetNode), 0);
            const timescale = parseInt(this.xpathHelper.getSingleAttribute(Expressions.SEGMENT_TIMESCALE, adaptationSetNode), 0);
            return [{ delta: duration, repeats: 100000 }]; // TODO: calculate how many times to repeat
        }
    }
}
