export function scaleSvgElement(svgElement: SVGSVGElement, scale: number) {
    if (scale == 1) {
        return;
    }

    function scaleSizeString(sizeString: string, scale: number) {
        const regex = /([0-9.]*)*(.*)/gm;
        const m = regex.exec(sizeString);
        const v = m[1];
        const u = m[2];
        return parseFloat(v) * scale + u;
    }

    svgElement.setAttribute("width",
        scaleSizeString(svgElement.getAttribute("width"), scale))
    svgElement.setAttribute("height",
        scaleSizeString(svgElement.getAttribute("height"), scale))
}

export function svgToImg(svg: string, alt: string): string {
    return `<img style="box-shadow: none" alt="${alt}" src="data:image/svg+xml;utf8,${encodeURIComponent(svg)}">`
}

export function createErrorSpan(text: string): string {
    return `<span style="white-space: pre-line;" class="error">${htmlEscape(text)}</span>`
}

export function htmlEscape(text: string) {
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("'", "&#039;")
        .replaceAll("\"", "&quot;")
        .replaceAll(" ", "&nbsp;");
}