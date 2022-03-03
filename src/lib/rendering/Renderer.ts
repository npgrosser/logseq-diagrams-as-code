import {Cache} from "../Cache";

export abstract class Renderer {
    abstract readonly type: string;

    abstract render(code: string): Promise<string>;

    cached(): CachedRenderer {
        return new CachedRenderer(this);
    }
}

class CachedRenderer extends Renderer {
    private actual: Renderer;
    private cache: Cache<string>;

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
