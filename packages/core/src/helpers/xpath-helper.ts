export class XpathHelper {
    public getAttributes(expression: string, xml: Document, rootNode: Node, namespace: string | null): Array<string> {
        const nodes = this.getNodes(expression, xml, rootNode, namespace);
        const result: Array<string> = [];
        nodes.forEach(x => {
            if (x.nodeValue) {
                result.push(x.nodeValue);
            }
        });

        return result;
    }

    public getNodes(expression: string, xml: Document, rootNode: Node, namespace: string | null): Array<Node> {
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

    public concatenateExpressions(...expressions: Array<string>): string {
        return `/${expressions.join('|')}`;
    }

    public getNamespace(xml: Document): string | null {
        const firstElement = xml.firstElementChild;
        if (!firstElement) {
            return null;
        }
        return firstElement.namespaceURI;
    }
}
