export class XpathHelper {
    constructor(private document: Document, private namespace: string | null) {}

    public getAttributes(expression: string, rootNode: Node): { [key: string]: string } {
        const nodes = this.getNodes(expression, rootNode);
        const result: { [key: string]: string } = {};
        nodes.forEach(x => {
            result[x.nodeName] = x.nodeValue || '';
        });
        return result;
    }

    public getSingleAttribute(expression: string, rootNode: Node): string {
        const nodes = this.getNodes(expression, rootNode);
        if (nodes.length === 0) {
            return '';
        } else {
            return nodes[0].nodeValue || '';
        }
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
