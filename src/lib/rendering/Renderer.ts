import {Cache} from "../Cache";

export abstract class Renderer {
    abstract readonly type: string;

    abstract render(code: string): Promise<string>;

    cached(): CachedRenderer {
        return new CachedRenderer(this);
    }
}

export class CachedRenderer extends Renderer {
    private readonly actual: Renderer;
    private readonly cache: Cache<string>;

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

    get original(): Renderer {
        return this.actual;
    }

    render(code: string): Promise<string> {
        return this.cache.getOrSupply(code, () => this.actual.render(code));
    }
}
