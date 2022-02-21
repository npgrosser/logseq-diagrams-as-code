import pako from "pako";
import {htmlEscape, urlSafeBase64} from "./utils";
import {Cache} from "./Cache";
import {Config} from "./Config";

export abstract class Renderer {
    abstract readonly type: string;

    abstract render(code: string): Promise<string>;

    cached(): CachedRenderer {
        return new CachedRenderer(this);
    }
}

class CachedRenderer extends Renderer {
    private actual: Renderer;
    private cache: Cache<string>

    constructor(actual: Renderer) {
        super();
        this.actual = actual;
        this.cache = new Cache<string>(32);
    }

    get type(): string {
        return this.actual.type;
    }

    cached(): CachedRenderer {
        return this;
    }

    render(code: string): Promise<string> {
        return this.cache.getOrSupply(code, () => this.actual.render(code));
    }
}

abstract class ImgSrcRenderer extends Renderer {
    abstract readonly type: string;

    async render(code: string): Promise<string> {
        if (code.trim().length === 0) {
            return ""
        }
        const imgSrc = await this.createImgSrc(code);

        // preload img before updating the UI
        const err = await new Promise((resolve) => {
            const img = new Image();
            img.src = imgSrc;
            img.onload = () => {
                resolve(null)
            }
            img.onerror = (err) => {
                resolve(err)
            }
        });

        return err != null ? `Rendering Error - Invalid img src ${imgSrc.substring(0, 32)} ...` :
            `<img style="box-shadow: none" src="${imgSrc}" alt="${this.type} diagram"/>`
    }

    abstract createImgSrc(code: string): Promise<string>
}


class KrokiRenderer extends ImgSrcRenderer {
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
                `<img alt="A Diagram" src='data:image/svg+xml;base64,${btoa(text)}>`
            } else {
                let lines = text.split("\n");
                // some error messages are a bit to verbose... therefore limiting the number of lines to 5
                const maxLines = 5;
                if (lines.length > maxLines) {
                    lines = lines.slice(0, maxLines);
                    lines.push("...");
                }
                return `<span style="white-space: pre-line;" class="error">${htmlEscape(lines.join("\n"))}</span>`
            }
        }
        return super.render(code);
    }

    async createImgSrc(code: string): Promise<string> {
        const compressed = pako.deflate(code, {level: 9});
        const b64encoded = urlSafeBase64(String.fromCharCode.apply(null, Array.from(compressed)));
        return new URL(`${this.type}/${this.fmt}/${b64encoded}`, Config.krokiBaseUrl).href
    }
}

// noinspection JSUnusedLocalSymbols
class MermaidRenderer extends Renderer {
    // todo: does not work yet - have to figure out how to set up mermaid properly in Logseq
    readonly type: string = "mermaid";

    async render(code: string): Promise<string> {
        return `<div class="mermaid">${code}</div>`
    }
}

const krokiTypes = [
    "plantuml",
    "mermaid",
    "blockdiag",
    "seqdiag",
    "actdiag",
    "erd",
    "nomnoml",
    "graphviz",
    "nwdiag",
    "wavedrom"
]
export const renderers: readonly Renderer[] = [
    ...krokiTypes.map(type => new KrokiRenderer(type))
].map(r => r.cached());