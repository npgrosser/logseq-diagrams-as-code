import {Renderer} from "./Renderer";
import {createErrorSpan, svgToImg} from "./html-utils";

export abstract class SvgRenderer extends Renderer {

    async render(code: string): Promise<string> {
        let svg: string = ""
        try {
            svg = await this.createSvg(code);
        } catch (e: any) {
            return createErrorSpan(e.message);
        }
        return svgToImg(svg, `A ${this.type} Diagram`);
    }

    abstract createSvg(code: string): Promise<string>;
}