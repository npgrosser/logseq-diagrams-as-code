import {Mutex} from "async-mutex";

export class Cache<T> {
    readonly maxSize: number;
    private deleteQueue: string[] = [];
    private data: { [key: string]: T } = {};
    private mutex: Mutex = new Mutex();

    constructor(maxSize: number) {
        if (maxSize <= 0) {
            throw Error("why u do dis?");
        }
        this.maxSize = maxSize;
    }

    get size(): number {
        return Object.keys(this.data).length;
    }

    set(key: string, value: T) {
        if (Object.prototype.hasOwnProperty.call(this.data, key)) {
            this.remove(key);
        } else {
            if (this.size >= this.maxSize) {
                const toRemove = this.deleteQueue[0];
                this.remove(toRemove);
            }
        }
        this.data[key] = value;
        this.deleteQueue.push(key);
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
        });
    }

    get(key: string): T | undefined {
        return this.data[key];
    }

    private remove(key: string) {
        const index = this.deleteQueue.indexOf(key);
        if (index >= 0) {
            this.deleteQueue.splice(index, 1);
        }
        delete this.data[key];
    }
}