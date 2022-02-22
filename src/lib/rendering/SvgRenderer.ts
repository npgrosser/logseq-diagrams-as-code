import {Renderer} from "./Renderer";

export abstract class SvgRenderer extends Renderer {

    static svgToImg(svg: string, alt: string): string {
        return `<img style="box-shadow: none" alt="${alt}" src="data:image/svg+xml;base64,${btoa(svg)}">`
    }

    async render(code: string): Promise<string> {
        const svg = await this.createSvg(code);
        return SvgRenderer.svgToImg(svg, `A ${this.type} Diagram`);
    }

    abstract createSvg(code: string): Promise<string>;
}