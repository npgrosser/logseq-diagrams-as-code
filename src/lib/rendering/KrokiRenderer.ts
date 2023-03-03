import {ImgSrcRenderer} from "./ImgSrcRenderer";
import pako from "pako";
import {Config} from "../../config";
import {urlSafeBase64} from "../string-utils";
import {createErrorSpan, svgToImg} from "./html-utils";

export class KrokiRenderer extends ImgSrcRenderer {
    readonly type: string;
    readonly fmt: string;
    readonly diagramOptions: { [key: string]: string };

    constructor(type: string, fmt = "svg", diagramOptions: { [key: string]: string } = {}) {
        super();
        this.type = type;
        this.fmt = fmt;
        this.diagramOptions = diagramOptions;
    }

    withDiagramOptions(diagramOptions: { [key: string]: string }): KrokiRenderer {
        return new KrokiRenderer(this.type, this.fmt, diagramOptions);
    }

    async render(code: string): Promise<string> {
        if (code.trim().length == 0) {
            return "";
        }
        if (this.fmt === "svg") {
            let response;
            try {
                response = await fetch(await this.createImgSrc(code));
            } catch (error) {

                const err = error as Error;

                if (err.name === "TypeError" && err.message === "Failed to fetch") {
                    console.warn(error);
                    console.warn("Falling back to default ImgSrcRenderer:", error);
                    return await super.render(code);
                } else {
                    throw error;
                }
            }

            const text = await response.text();
            if (response.status === 200) {
                return svgToImg(text, `A ${this.type} Diagram`);
            } else {
                let lines = text.split("\n");
                // some error messages are a bit to verbose... therefore limiting the number of lines to 5
                const maxLines = 5;
                if (lines.length > maxLines) {
                    lines = lines.slice(0, maxLines);
                    lines.push("...");
                }
                return createErrorSpan(lines.join("\n"));
            }
        }


        return await super.render(code);
    }

    async createImgSrc(code: string): Promise<string> {
        const compressed = pako.deflate(code, {level: 9});
        const b64encoded = urlSafeBase64(String.fromCharCode.apply(null, Array.from(compressed)));

        const diagramOptions = Object.entries(this.diagramOptions).map(([key, value]) => `${key}=${value}`).join("&");

        const query = diagramOptions.length > 0 ? `?${diagramOptions}` : "";

        return new URL(`${this.type}/${this.fmt}/${b64encoded}`, Config.krokiBaseUrl).href + query;
    }
}