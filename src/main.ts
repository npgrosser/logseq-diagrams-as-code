import "@logseq/libs";
import {CachedRenderer, Renderer} from "./lib/rendering/Renderer";
import {BlockUUID} from "@logseq/libs/dist/LSPlugin";
import {Config} from "./config";
import {findCode, isRendererBlock} from "./lib/logseq-utils";
import renderers from "./renderers";
import templates, {InMemoryTemplate} from "./templates";
import {KrokiRenderer} from "./lib/rendering/KrokiRenderer";

const RENDERER_NAME = "code_diagram";
const CONTAINER_ID_PREFIX = "dac-container-";
const CONTAINER_CSS_CLASS = "dac-container";
const TITLE_CSS_CLASS = "dac-title";
const CAPTION_CSS_CLASS = "dac-caption";
const CONTENT_CSS_CLASS = "dac-content";

interface DiagramOptions {
    title?: string;
    titleStyle?: string;
    titleTag?: string;
    caption?: string;
    captionStyle?: string;
    captionTag?: string;
    containerStyle?: string;
    contentStyle?: string;

    [key: string]: string | number | boolean | SimpleObject;
}

type SimpleObject = { [key: string]: string | number | boolean | SimpleObject };


function orDefaults(diagramOptions: DiagramOptions): Required<DiagramOptions> {
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

/**
 * parses options in the format: key1=value1&key2=value2&key3=value3&...
 * @param optionsStr
 */
function parseDiagramOptions(optionsStr: string) {
    const options: DiagramOptions = {};
    if (optionsStr) {
        for (const optionStr of optionsStr.split("&")) {
            const [key, value] = optionStr.split("=").map(s => s.trim());

            const keyParts = key.split(".");
            if (keyParts.length == 1) {
                options[key] = value;
            } else {
                let current = options as SimpleObject;
                for (let i = 0; i < keyParts.length; i++) {
                    const keyPart = keyParts[i];
                    if (i == keyParts.length - 1) {
                        current[keyPart] = value;
                    } else {
                        if (!current[keyPart]) {
                            current[keyPart] = {};
                        }
                        const next = current[keyPart];
                        current = next as SimpleObject;
                    }
                }
            }
        }
    }

    return options;
}

function main() {
    for (const renderer of renderers) {
        // find all templates for the renderer
        // for each template, a slash command is registered

        let relevantTemplates = templates.filter(t => t.rendererType === renderer.type);
        if (relevantTemplates.length == 0) {
            // fallback: empty template
            relevantTemplates = [
                new InMemoryTemplate(renderer.type, `${renderer.type} (empty)`, "")
            ];
        }

        for (const template of relevantTemplates) {

            const registerSlashCommand = !Config.commandsRenderers ||
                Config.commandsRenderers.indexOf(renderer.type) >= 0;

            if (registerSlashCommand) {
                // slash command to create new diagram rendering block
                logseq.Editor.registerSlashCommand(`Create ${template.templateName}`,
                    async () => createDiagramAsCodeBlock(renderer.type, await template.load()));
            }
        }
    }

    logseq.App.onMacroRendererSlotted(async ({slot, payload}) => {
        const [rendererName, type, optionsStr] = payload.arguments;

        if (rendererName !== RENDERER_NAME) return;

        const renderer = renderers.find(r => r.type === type);
        if (!renderer) {
            console.error(`Renderer not found: ${type}`);
            return;
        }

        const options: DiagramOptions = parseDiagramOptions(optionsStr);
        await updateDiagram(slot, payload.uuid, renderer, options);
    });


    logseq.provideModel({handleDiagramClick});
}

logseq.ready(main).catch(console.error);

async function updateDiagram(slot: string, rendererBlockIdentity: BlockUUID, renderer: Renderer, opts: DiagramOptions) {


    const {
        caption,
        captionStyle,
        captionTag,
        containerStyle,
        contentStyle,
        title,
        titleStyle,
        titleTag
    } = orDefaults(opts);


    // special case (experimental): kroki diagram options
    if (opts.kroki && typeof opts.kroki === "object" && opts.kroki.diagram) {
        if (renderer instanceof CachedRenderer) {
            renderer = renderer.original;
        }
        if (renderer instanceof KrokiRenderer) {
            // todo: breaks caching (maybe overwork caching
            //       e.g. create new kroki client class with cache, that is shared between all kroki renderers)
            renderer = renderer.withDiagramOptions(opts.kroki.diagram as { [key: string]: string });
        }
    }

    const code = await findCode(rendererBlockIdentity);
    const diagramHtml = await renderer.render(code);

    const id = `${CONTAINER_ID_PREFIX}${rendererBlockIdentity}`;

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