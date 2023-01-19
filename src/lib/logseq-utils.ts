import {BlockEntity, BlockIdentity, BlockUUID} from "@logseq/libs/dist/LSPlugin";


interface CodeBlockContent {
    before: string;
    code: string;
    after: string;
}

/**
 * find the code block in the block content
 * returns the code itself, the content before the code and the content after the code
 */
function getFirstCodeBlockContent(content: string): CodeBlockContent | null {
    const lines = content.trim().split("\n");

    let start: number | null = null;
    let end: number | null = null;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().startsWith("```")) {
            if (start === null) {
                start = i + 1;
            } else {
                end = i;
                break;
            }
        }
    }
    if (end === null) {
        return null;
    } else {
        const before = lines.slice(0, start - 1).join("\n");
        const code = lines.slice(start, end).join("\n");
        const after = lines.slice(end + 1).join("\n");
        return {before, code, after};
    }
}

/**
 * find the first code block in the given block
 * @param rendererBlockIdentity
 */
export async function findCodeBlock(rendererBlockIdentity: BlockIdentity): Promise<[BlockUUID, CodeBlockContent] | null> {
    let block = await logseq.Editor.getBlock(rendererBlockIdentity, {includeChildren: true});
    let codeBlockContent = getFirstCodeBlockContent(block.content);
    if (codeBlockContent === null) {
        if (block.children.length == 0) {
            return null;
        } else {
            block = (block.children[0] as BlockEntity);
            codeBlockContent = getFirstCodeBlockContent(block.content);
        }
    }
    return [block.uuid, codeBlockContent];
}

/**
 * Same as findCodeBlock but only returns the code content
 * @param rendererBlockIdentity
 */
export async function findCode(rendererBlockIdentity: BlockIdentity): Promise<string> {
    const [, codeBlockContent] = await findCodeBlock(rendererBlockIdentity);
    return codeBlockContent.code;
}

/**
 * check if block is a renderer block (e.g. {{renderer x}})
 * @param blockEntity
 */
export function isRendererBlock(blockEntity: BlockEntity | null | undefined): boolean {
    if (!blockEntity) {
        return false;
    }
    const content = blockEntity.content;

    return content != null && content.split("\n").findIndex(line => line.trim().startsWith("{{renderer")) >= 0;
}