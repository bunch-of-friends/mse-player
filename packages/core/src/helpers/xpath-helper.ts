export class XpathHelper {
    constructor(private document: Document, private namespace: string | null) {}

    public getAttributes(expression: string, rootNode: Node): Array<string> {
        const nodes = this.getNodes(expression, rootNode);
        const result: Array<string> = [];
        nodes.forEach(x => {
            if (x.nodeValue) {
                result.push(x.nodeValue);
            }
        });

        return result;
    }

    public getNodes(expression: string, rootNode: Node): Array<Node> {
        const res = this.document.evaluate(
            expression,
            rootNode,
            prefix => {
                switch (prefix) {
                    case 'xmlns':
                        return this.namespace;
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

    public concatenateExpressions(...expressions: Array<string>): string {
        return `/${expressions.join('|')}`;
    }
}
