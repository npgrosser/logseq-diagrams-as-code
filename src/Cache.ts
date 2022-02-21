import {Mutex} from "async-mutex";

export class Cache<T> {
    private data: { [key: string]: T } = {}
    private deleteQueue: string[] = [];
    private mutex: Mutex = new Mutex()
    readonly maxSize: number

    constructor(maxSize: number) {
        if (maxSize <= 0) {
            throw Error("why u do dis?")
        }
        this.maxSize = maxSize;
    }

    private remove(key: string) {
        const index = this.deleteQueue.indexOf(key);
        if (index >= 0) {
            this.deleteQueue.splice(index, 1);
        }
        delete this.data[key]
    }

    set(key: string, value: T) {
        if (this.data.hasOwnProperty(key)) {
            this.remove(key);
        } else {
            if (this.size >= this.maxSize) {
                const toRemove = this.deleteQueue[0]
                this.remove(toRemove);
            }
        }
        this.data[key] = value;
        this.deleteQueue.push(key);
    }

    get size(): number {
        return Object.keys(this.data).length
    }

    get(key: string): T | undefined {
        return this.data[key];
    }

    async getOrSupply(key: string, valueSupplier: () => Promise<T>): Promise<T> {
        return await this.mutex.runExclusive(async () => {
            const existing = this.get(key);
            if (existing !== undefined) {
                return existing;
            } else {
                const value = await valueSupplier();
                this.set(key, value);
                return value;
            }
        })
    }
}