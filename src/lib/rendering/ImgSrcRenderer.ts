import {Renderer} from "./Renderer";

export abstract class ImgSrcRenderer extends Renderer {
    abstract readonly type: string;

    async render(code: string): Promise<string> {
        if (code.trim().length === 0) {
            return "";
        }
        const imgSrc = await this.createImgSrc(code);

        // preload img before updating the UI
        const err = await new Promise((resolve) => {
            const img = new Image();
            img.src = imgSrc;
            img.onload = () => {
                resolve(null);
            };
            img.onerror = (err) => {
                resolve(err);
            };
        });

        return err != null ? `Rendering Error - Invalid img src ${imgSrc.substring(0, 32)} ...` :
            `<img style="box-shadow: none" src="${imgSrc}" alt="${this.type} diagram"/>`;
    }

    abstract createImgSrc(code: string): Promise<string>
}