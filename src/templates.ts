import {dedent} from "./lib/string-utils";

export interface Template {
    readonly rendererType: string
    readonly templateName: string

    load(): Promise<string>
}

export class InMemoryTemplate implements Template {
    readonly rendererType: string;
    readonly templateName: string;
    readonly template: string;

    constructor(rendererType: string, templateName: string, template: string) {
        this.templateName = templateName;
        this.rendererType = rendererType;
        this.template = template;
    }

    async load(): Promise<string> {
        return this.template;
    }
}

// todo: option to enable/disable templates (and languages)

const templates: Template[] = [
    new InMemoryTemplate("mermaid", "Mermaid Flowchart", dedent(`
        graph TD;
        A-->B;
        A-->C;
        B-->D;
        C-->D;`)),
    new InMemoryTemplate("mermaid", "Mermaid Sequence Diagram", dedent(`
        sequenceDiagram
            participant Alice
            participant Bob
            Alice->>John: Hello John, how are you?
            loop Healthcheck
                John->>John: Fight against hypochondria
            end
            Note right of John: Rational thoughts <br/>prevail!
            John-->>Alice: Great!
            John->>Bob: How about you?
            Bob-->>John: Jolly good!
    `)),
    new InMemoryTemplate("mermaid", "Mermaid ER Diagram", dedent(`
        erDiagram
        CUSTOMER ||--o{ ORDER : places
        ORDER ||--|{ LINE-ITEM : contains
        CUSTOMER }|..|{ DELIVERY-ADDRESS : uses`)),
    new InMemoryTemplate("plantuml", "PlantUML Class Diagram", dedent(`
        @startuml
        class Car
        
        Driver - Car : drives >
        Car *- Wheel : has 4 >
        Car -- Person : < owns
        
        @enduml`)),
    new InMemoryTemplate("plantuml", "PlantUML Sequence Diagram", dedent(`
        @startuml
        autonumber
        Bob -> Alice : Authentication Request
        Bob <- Alice : Authentication Response
        @enduml`)),
    new InMemoryTemplate("plantuml", "PlantUML C4 Container Diagram", dedent(`
        @startuml
        !include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml
        
        Person(personAlias, "Label", "Optional Description")
        Container(containerAlias, "Label", "Technology", "Optional Description")
        System(systemAlias, "Label", "Optional Description")
        
        Rel(personAlias, containerAlias, "Label", "Optional Technology")
        @enduml`)),
    new InMemoryTemplate("blockdiag", "BlockDiag Diagram", dedent(`
        blockdiag {
          blockdiag -> generates -> "Block diagrams";
          blockdiag -> is -> "very easy!";
        
          blockdiag [color = "greenyellow"];
          "Block diagrams" [color = "pink"];
          "very easy!" [color = "orange"];
        }`)),
    new InMemoryTemplate("seqdiag", "SeqDiag Diagram", dedent(`
    seqdiag {
      browser  -> webserver [label = "GET /seqdiag/svg/base64"];
      webserver  -> processor [label = "Convert text to image"];
      webserver <-- processor;
      browser <-- webserver;
    }`)),
    new InMemoryTemplate("actdiag", "ActDiag Diagram", dedent(`
    actdiag {
      write -> convert -> image
    
      lane user {
        label = "User"
        write [label = "Writing text"];
        image [label = "Get diagram image"];
      }
      lane actdiag {
        convert [label = "Convert text to image"];
      }
    }`)),
    new InMemoryTemplate("erd", "Erd Diagram", dedent(`
    [Person]
    *name
    height
    weight
    +birth_location_id
    
    [Location]
    *id
    city
    state
    country
    
    Person *--1 Location`)),
    new InMemoryTemplate("graphviz", "Graphviz Diagram", dedent(`
    digraph D {

      A -> {B, C, D} -> {F}
    
    }`)),
    new InMemoryTemplate("nomnoml", "Nomnoml Diagram", dedent(`
    [Pirate|eyeCount: Int|raid();pillage()|
      [beard]--[parrot]
      [beard]-:>[foul mouth]
    ]`)),
    new InMemoryTemplate("wavedrom", "WaveDrom Diagram", dedent(`
    { signal: [
      { name: "clk",  wave: "P......" },
      { name: "bus",  wave: "x.==.=x", data: ["head", "body", "tail", "data"] },
      { name: "wire", wave: "0.1..0." }
    ]}`)),
    new InMemoryTemplate("nwdiag", "NwDiag Diagram", dedent(`
    nwdiag {
      network dmz {
          address = "210.x.x.x/24"
    
          web01 [address = "210.x.x.1"];
          web02 [address = "210.x.x.2"];
      }
      network internal {
          address = "172.x.x.x/24";
    
          web01 [address = "172.x.x.1"];
          web02 [address = "172.x.x.2"];
          db01;
          db02;
      }
    }`)),
    new InMemoryTemplate("asciimath", "AsciiMath Formula", "E=mc^2"),
    new InMemoryTemplate("tex", "TeX Formula", "E=mc^2")
];


export default templates;