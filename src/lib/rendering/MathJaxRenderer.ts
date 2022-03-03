/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import {SvgRenderer} from "./SvgRenderer";
import {scaleSvgElement} from "./html-utils";
// @ts-ignore
import AsciiMathParser from "asciimath2tex";

const asciiMathParser = new AsciiMathParser();

type MathJaxRendererType = "mml" | "tex" | "asciimath";

export class MathJaxRenderer extends SvgRenderer {
    protected static readonly defaultScale = 1.2;
    readonly type: MathJaxRendererType;
    readonly scale: number;

    constructor(type: MathJaxRendererType, scale: number = MathJaxRenderer.defaultScale) {
        super();
        this.type = type;
        this.scale = scale;
    }

    async createSvg(code: string): Promise<string> {
        // @ts-ignore
        const MathJax = window["MathJax"] as any;
        await MathJax.startup.promise;

        let htmlElement: HTMLElement;
        switch (this.type) {
            case "mml":
                htmlElement = MathJax.mathml2svg(code);
                break;
            case "tex":
                htmlElement = MathJax.tex2svg(code);
                break;
            case "asciimath":
                htmlElement = MathJax.tex2svg(asciiMathParser.parse(code));
                break;
            default:
                throw Error(`unsupported type '${this.type}'`);
        }
        const svgElement = htmlElement.getElementsByTagName("svg")[0];

        scaleSvgElement(svgElement, this.scale);

        return htmlElement.getElementsByTagName("svg")[0].outerHTML;
    }
}