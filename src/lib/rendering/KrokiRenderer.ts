import {ImgSrcRenderer} from "./ImgSrcRenderer";
import pako from "pako";
import {Config} from "../../config";
import {urlSafeBase64} from "../string-utils";
import {createErrorSpan, svgToImg} from "./html-utils";

export class KrokiRenderer extends ImgSrcRenderer {
    readonly type: string;
    readonly fmt: string

    constructor(type: string, fmt: string = "svg") {
        super();
        this.type = type;
        this.fmt = fmt;
    }

    async render(code: string): Promise<string> {
        if (this.fmt === "svg") {
            const response = await fetch(await this.createImgSrc(code));
            const text = await response.text()
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
        } else {
            return super.render(code);
        }
    }

    async createImgSrc(code: string): Promise<string> {
        const compressed = pako.deflate(code, {level: 9});
        const b64encoded = urlSafeBase64(String.fromCharCode.apply(null, Array.from(compressed)));
        return new URL(`${this.type}/${this.fmt}/${b64encoded}`, Config.krokiBaseUrl).href
    }
}