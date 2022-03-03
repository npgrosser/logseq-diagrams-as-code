import {Renderer} from "./Renderer";

// noinspection JSUnusedLocalSymbols
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class MermaidRenderer extends Renderer {
    // todo: does not work yet - have to figure out how to set up mermaid properly in Logseq
    readonly type: string = "mermaid";

    async render(code: string): Promise<string> {
        return `<div class="mermaid">${code}</div>`;
    }
}