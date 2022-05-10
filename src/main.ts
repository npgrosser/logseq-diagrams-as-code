import "@logseq/libs";
import {Renderer} from "./lib/rendering/Renderer";
import {BlockUUID} from "@logseq/libs/dist/LSPlugin";
import {Config} from "./config";
import {findCode, isRendererBlock} from "./lib/logseq-utils";
import renderers from "./renderers";
import templates, {InMemoryTemplate} from "./templates";

const RENDERER_NAME = "code_diagram";
const CONTAINER_ID_PREFIX = "dac-container-";
const CONTAINER_CSS_CLASS = "dac-container";
const TITLE_CSS_CLASS = "dac-title";
const CAPTION_CSS_CLASS = "dac-caption";
const CONTENT_CSS_CLASS = "dac-content";

interface DiagramOptions {
    title?: string
    titleStyle?: string
    titleTag?: string
    caption?: string
    captionStyle?: string
    captionTag?: string
    containerStyle?: string;
    contentStyle?: string

    [key: string]: string | number | boolean
}

function processOptions(diagramOptions: DiagramOptions): Required<DiagramOptions> {
    return {
        title: diagramOptions.title || "",
        titleTag: diagramOptions.titleTag || "h4",
        titleStyle: diagramOptions.titleStyle || "",
        caption: diagramOptions.caption || "",
        captionTag: diagramOptions.captionTag || "h6",
        captionStyle: diagramOptions.captionStyle || "",
        contentStyle: diagramOptions.contentStyle || "",
        containerStyle: diagramOptions.containerStyle || ""
    };
}

function main() {
    for (const renderer of renderers) {
        let loaders = templates.filter(t => t.rendererType === renderer.type);
        if (loaders.length == 0) {
            // fallback loader with empty template
            loaders = [
                new InMemoryTemplate(renderer.type, `${renderer.type} (empty)`, "")
            ];
        }

        for (const loader of loaders) {

            const registerSlashCommand = !Config.commandsRenderers ||
                Config.commandsRenderers.indexOf(renderer.type) >= 0;

            if (registerSlashCommand) {
                logseq.Editor.registerSlashCommand(`Create ${loader.templateName}`,
                    async () => createDiagramAsCodeBlock(renderer.type, await loader.load()));
            }

            logseq.App.onMacroRendererSlotted(async ({slot, payload}) => {
                const [rendererName, type, optionsStr] = payload.arguments;
                const options: DiagramOptions = {};
                if (optionsStr) {
                    for (const optionStr of optionsStr.split("&")) {
                        const [key, value] = optionStr.split("=").map(s => s.trim());
                        if (key) {
                            options[key] = value;
                        }
                    }
                }
                if (rendererName !== RENDERER_NAME || type !== renderer.type) return;
                await updateDiagram(slot, payload.uuid, renderer, options);
            });
        }
    }

    logseq.provideModel({handleDiagramClick});
}

logseq.ready(main).catch(console.error);

async function updateDiagram(slot: string, rendererBlockIdentity: BlockUUID, renderer: Renderer, opts: DiagramOptions) {
    const code = await findCode(rendererBlockIdentity);
    const diagramHtml = await renderer.render(code);

    const id = `${CONTAINER_ID_PREFIX}${rendererBlockIdentity}`;

    const {
        caption,
        captionStyle,
        captionTag,
        containerStyle,
        contentStyle,
        title,
        titleStyle,
        titleTag
    } = processOptions(opts);

    const titleElement = title ? `
        <${titleTag} class="${TITLE_CSS_CLASS} ${TITLE_CSS_CLASS}-${renderer.type}" style="${titleStyle}">
            ${title}
        </${titleTag}>` : "";
    const captionElement = caption ? `
        <${captionTag} class="${CAPTION_CSS_CLASS} ${CAPTION_CSS_CLASS}-${renderer.type}" style="${captionStyle}">
            ${caption}
        </${captionTag}>` : "";

    const template = `
    <div 
        class="${CONTAINER_CSS_CLASS} ${CONTAINER_CSS_CLASS}-${renderer.type}"
        id="${id}" 
        style="${containerStyle + ";white-space: normal; min-width: 20px; min-height: 20px; text-align: center"}"
        data-on-click="handleDiagramClick">
         ${titleElement}
         <div class="${CONTENT_CSS_CLASS} ${CONTENT_CSS_CLASS}-${renderer.type}" style="${contentStyle}">
            ${diagramHtml}
         </div>
         ${captionElement}
    </div>`;

    logseq.provideUI({
        key: id,
        slot,
        reset: true,
        template
    });
}

async function handleDiagramClick() {
    // const blockIdentity = evt.id.split("-").slice(CONTAINER_ID_PREFIX.split("-").length).join("-") as BlockUUID

    // silly trick to trigger instant reload
    //  should be improved (or code update should be recognized while user is editing)
    const editing = await logseq.Editor.checkEditing();
    if (typeof editing === "string") {
        let block = await logseq.Editor.getBlock(editing);

        if (!isRendererBlock(block)) {
            // parent
            block = await logseq.Editor.getBlock(block.parent.id);
            if (isRendererBlock(block)) {
                await logseq.Editor.editBlock(block.uuid);
                await logseq.Editor.exitEditingMode();
            }
        } else {
            // combined renderer and code block
            // todo
            // the trick does not work because it would reset the code content
        }
    }
}

/**
 * insert renderer and empty code-block
 */
async function createDiagramAsCodeBlock(type: string, template: string) {
    const parentBlockContent = `{{renderer ${RENDERER_NAME},${type}}}`;

    await logseq.Editor.insertAtEditingCursor(parentBlockContent);
    const parentBlock = await logseq.Editor.getCurrentBlock();

    const codeBlockContent = `\`\`\`${type}\n${template}\n\`\`\``;

    if (Config.inlineCodeBlock) {
        await logseq.Editor.insertAtEditingCursor("\n" + codeBlockContent);
    } else {
        await logseq.Editor.insertBlock(parentBlock.uuid, codeBlockContent, {
            sibling: false,
            before: false
        });
    }
}