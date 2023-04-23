import {KrokiRenderer} from "./lib/rendering/KrokiRenderer";
import {MathJaxRenderer} from "./lib/rendering/MathJaxRenderer";
import {Renderer} from "./lib/rendering/Renderer";

const krokiRenderers = [
    "actdiag",
    "blockdiag",
    "bpmn",
    "bytefield",
    "ditaa",
    "erd",
    "excalidraw",
    "graphviz",
    "mermaid",
    "nomnoml",
    "nwdiag",
    "packetdiag",
    "pikchr",
    "plantuml",
    "rackdiag",
    "seqdiag",
    "structurizr",
    "umlet",
    "svgbob",
    "vega",
    "vegalite",
    "wavedrom",
    "d2",
    "tikz"
].map(type => new KrokiRenderer(type));

export const renderers: readonly Renderer[] = [
    ...krokiRenderers,
    new MathJaxRenderer("tex"),
    new MathJaxRenderer("asciimath")
].map(r => r.cached());

export default renderers;