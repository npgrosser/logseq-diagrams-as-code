import {KrokiRenderer} from "./lib/rendering/KrokiRenderer";
import {Renderer} from "./lib/rendering/Renderer";

const krokiTypes = [
    "plantuml",
    "mermaid",
    "blockdiag",
    "seqdiag",
    "actdiag",
    "erd",
    "nomnoml",
    "graphviz",
    "nwdiag",
    "wavedrom"
]
const renderers: readonly Renderer[] = [
    ...krokiTypes.map(type => new KrokiRenderer(type))
].map(r => r.cached());

export default renderers;