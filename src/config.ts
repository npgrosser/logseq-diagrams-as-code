/* eslint-disable @typescript-eslint/no-explicit-any */
const KROKI_BASE_URL_KEY = "kroki.baseUrl";
const INLINE_CODE_BLOCK_KEY = "inlineCodeBlock";
const COMMANDS_RENDERERS = "commands.renderers";

export class Config {
    private static select(key: string): any | undefined {
        return this.selectFrom(logseq.settings, key);
    }

    private static selectFrom(obj: any, key: string): any | undefined {
        if (obj === undefined) {
            return undefined;
        }
        const keys = key.split(".");
        if (keys.length > 1) {
            return this.selectFrom(obj[keys.shift()], keys.join("."));
        } else {
            return obj[key];
        }
    }

    static get krokiBaseUrl(): string {
        return this.select(KROKI_BASE_URL_KEY) || "https://kroki.io/";
    }

    static get inlineCodeBlock(): boolean {
        const value = this.select(INLINE_CODE_BLOCK_KEY);
        return value === true || value == "true";
    }

    /**
     * explicit list of renderers for which commands should be registered
     * if undefined, all renderers will be registered
     */
    static get commandsRenderers(): string[] | undefined {
        return this.select(COMMANDS_RENDERERS);
    }
}