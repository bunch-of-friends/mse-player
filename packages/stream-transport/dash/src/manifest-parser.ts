import { ManifestAcquisition, AdaptationSetType, HttpHandler, AdaptationSet, VideoRepresentation, AudioRepresentation } from '@mse-player/core';
import { TemplateSegmentProvider } from './template-segment-provider';

const iso8601DurationRegex = /P(?:([0-9]+)Y)?(?:([0-9]+)M)?(?:([0-9]+)D)?T(?:([0-9]+)H)?(?:([0-9]+)M)?(?:([0-9]+(?:\.[0-9]+)?)?S)?/;
const TYPE_EXPRESSION = '*/@type';
const DURATION_EXPRESSION = '*/@mediaPresentationDuration';
const ADAPTATION_SET_EXPRESSION = '*//xmlns:AdaptationSet';
const CONTENT_TYPE_EXPRESSION = '@contentType';
const MIME_TYPES_EXPRESSION = '@mimeType';
const INIT_TEMPLATE_EXPRESSION = 'xmlns:SegmentTemplate/@initialization';
const MEDIA_TEMPLATE_EXPRESSION = 'xmlns:SegmentTemplate/@media';
const REPRESENTATION_EXPRESSION = 'xmlns:Representation';
const CODECS_EXPRESSION = '@codecs';
const ID_EXPRESSION = '@id';
const BANDWIDTH_EXPRESSION = '@bandwidth';
const WIDTH_EXPRESSION = '@width';
const HEIGHT_EXPRESSION = '@height';
const FRAME_RATE_EXPRESSION = '@frameRate';
const SAMPLING_RATE_EXPRESSION = '@audioSamplingRate';
const AUDIO_CHANNELS_EXPRESSION = 'xmlns:AudioChannelConfiguration/@value';

export class ManifestParser {
    constructor(private httpHandler: HttpHandler) {}

    public getStreamDescriptor(xml: Document): ManifestAcquisition {
        const namespace = this.getNamespace(xml);
        const streamInfo = this.evaluateXpathAttributes(this.concatenateXpathExpressions(TYPE_EXPRESSION, DURATION_EXPRESSION), xml, xml, namespace);

        const isLive = streamInfo[0] === 'dynamic';
        const duration = (streamInfo[1] && this.getSecondsFromManifestTimeValue(streamInfo[1])) || 0;
        const absoluteUrl = xml.URL.replace(xml.URL.substring(xml.URL.lastIndexOf('/') + 1), '');

        const adaptationSetNodes = this.evaluateXpathNodes(ADAPTATION_SET_EXPRESSION, xml, xml, namespace);
        const adaptationSets: Array<AdaptationSet> = [];
        adaptationSetNodes.forEach(x => adaptationSets.push(this.parseAdaptationSet(x, xml, namespace, duration, absoluteUrl)));

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

    private parseAdaptationSet(adaptationSetNode: Node, document: Document, namespace: string | null, duration: number, baseUrl: string) {
        const type = this.evaluateXpathAttributes(CONTENT_TYPE_EXPRESSION, document, adaptationSetNode, namespace)[0] || '';
        const initTemplate = this.evaluateXpathAttributes(INIT_TEMPLATE_EXPRESSION, document, adaptationSetNode, namespace)[0] || '';
        const mediaTemplate = this.evaluateXpathAttributes(MEDIA_TEMPLATE_EXPRESSION, document, adaptationSetNode, namespace)[0] || '';
        const representationNodes = this.evaluateXpathNodes(REPRESENTATION_EXPRESSION, document, adaptationSetNode, namespace);
        const representations: Array<VideoRepresentation | AudioRepresentation> = [];
        representationNodes.forEach(y =>
            representations.push(this.parseRepresentation(y, document, namespace, duration, initTemplate, mediaTemplate, type, baseUrl))
        );
        return {
            type: type as AdaptationSetType,
            mimeType: this.evaluateXpathAttributes(MIME_TYPES_EXPRESSION, document, adaptationSetNode, namespace)[0] || '',
            representations: representations,
        };
    }

    private parseRepresentation(
        representationNode: Node,
        document: Document,
        namespace: string | null,
        duration: number,
        initTemplate: string,
        mediaTemplate: string,
        type: string,
        baseUrl: string
    ) {
        const id = this.evaluateXpathAttributes(ID_EXPRESSION, document, representationNode, namespace)[0] || '';
        const representation = {
            codecs: this.evaluateXpathAttributes(CODECS_EXPRESSION, document, representationNode, namespace)[0] || '',
            id: id,
            bandwidth: parseInt(this.evaluateXpathAttributes(BANDWIDTH_EXPRESSION, document, representationNode, namespace)[0], 10) || 0,
            segmentProvider: new TemplateSegmentProvider(duration, initTemplate, mediaTemplate, baseUrl, id, this.httpHandler),
        };

        if (type === AdaptationSetType.Video) {
            return {
                ...representation,
                width: parseInt(this.evaluateXpathAttributes(WIDTH_EXPRESSION, document, representationNode, namespace)[0], 10) || 0,
                height: parseInt(this.evaluateXpathAttributes(HEIGHT_EXPRESSION, document, representationNode, namespace)[0], 10) || 0,
                frameRate: parseInt(this.evaluateXpathAttributes(FRAME_RATE_EXPRESSION, document, representationNode, namespace)[0], 10) || 0,
            };
        } else {
            return {
                ...representation,
                channels: parseInt(this.evaluateXpathAttributes(AUDIO_CHANNELS_EXPRESSION, document, representationNode, namespace)[0], 10) || 0,
                samplingRate: parseInt(this.evaluateXpathAttributes(SAMPLING_RATE_EXPRESSION, document, representationNode, namespace)[0], 10) || 0,
            };
        }
    }

    private evaluateXpathAttributes(expression: string, xml: Document, rootNode: Node, namespace: string | null): Array<string> {
        const nodes = this.evaluateXpathNodes(expression, xml, rootNode, namespace);
        const result: Array<string> = [];
        nodes.forEach(x => {
            if (x.nodeValue) {
                result.push(x.nodeValue);
            }
        });

        return result;
    }

    private evaluateXpathNodes(expression: string, xml: Document, rootNode: Node, namespace: string | null): Array<Node> {
        const res = xml.evaluate(
            expression,
            rootNode,
            prefix => {
                switch (prefix) {
                    case 'xmlns':
                        return namespace;
                    default:
                        return null;
                }
            },
            XPathResult.ANY_TYPE,
            null
        );

        let value = res.iterateNext();
        const result = [];
        while (value) {
            result.push(value);
            value = res.iterateNext();
        }

        return result;
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
