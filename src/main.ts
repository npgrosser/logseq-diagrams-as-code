import '@logseq/libs';
import {Renderer, renderers} from "./Renderer";
import {findCode, isRendererBlock} from "./utils";
import {BlockIdentity} from "@logseq/libs/dist/LSPlugin";
import {getTemplateLoadersForType, InMemoryTemplateLoader, TemplateLoader} from "./TemplateLoader";
import {Config} from "./Config";

const RENDERER_NAME = "code_diagram"
const CONTAINER_CSS_CLASS = "dac-diagram-container"
const CONTAINER_ID_PREFIX = "dac-diagram-container-"

function main() {
    for (let renderer of renderers) {
        let loaders = getTemplateLoadersForType(renderer.type);
        if (loaders.length == 0) {
            // fallback loader with empty template
            loaders = [
                new InMemoryTemplateLoader(renderer.type, `${renderer.type} Diagram (empty)`, "")
            ];
        }

        for (let loader of loaders) {
            logseq.Editor.registerSlashCommand(`Create ${loader.templateName}`,
                () => createDiagramAsCodeBlock(renderer, loader));

            logseq.App.onMacroRendererSlotted(async ({slot, payload}) => {
                let [rendererName, type] = payload.arguments;
                if (rendererName !== RENDERER_NAME || type !== renderer.type) return;
                await updateDiagram(slot, payload.uuid, renderer);
            });
        }
    }

    logseq.provideModel({handleDiagramClick});
}

logseq.ready(main).catch(console.error);


async function updateDiagram(slot: string, rendererBlockIdentity: BlockIdentity, renderer: Renderer) {
    const code = await findCode(rendererBlockIdentity);
    const diagramHtml = await renderer.render(code);

    const template = `
    <div 
        class="${CONTAINER_CSS_CLASS} ${CONTAINER_CSS_CLASS}-${renderer.type}"
        id="${CONTAINER_ID_PREFIX}${rendererBlockIdentity}" 
        style="white-space: normal;" 
        data-on-click="handleDiagramClick">
        <span style="all: unset">${diagramHtml}</span>
    </div>`;

    logseq.provideUI({
        // key: payload.uuid,
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
        let block = await logseq.Editor.getBlock(editing)

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
            // the trick does not work because it resets the code content
        }
    }
}

/**
 * insert renderer and empty code-block
 */
async function createDiagramAsCodeBlock({type}: Renderer, templateLoader: TemplateLoader) {
    const parentBlockContent = `{{renderer ${RENDERER_NAME},${type}}}`;
    const codeBlockContent = `\`\`\`${type}\n${await templateLoader.load()}\n\`\`\``;

    await logseq.Editor.insertAtEditingCursor(parentBlockContent);
    const parentBlock = await logseq.Editor.getCurrentBlock();

    if (Config.inlineCodeBlock) {
        await logseq.Editor.insertAtEditingCursor("\n" + codeBlockContent);
    } else {
        await logseq.Editor.insertBlock(parentBlock.uuid, codeBlockContent, {
            sibling: false,
            before: false
        });
    }
}

