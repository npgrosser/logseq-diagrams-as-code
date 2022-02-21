import {dedent} from "./utils";

export interface TemplateLoader {
    readonly rendererType: string
    readonly templateName: string

    load(): Promise<string>
}

export class InMemoryTemplateLoader implements TemplateLoader {
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

const templateLoaders: TemplateLoader[] = [
    new InMemoryTemplateLoader("mermaid", "Mermaid Flowchart", dedent(`
        graph TD;
        A-->B;
        A-->C;
        B-->D;
        C-->D;`)),
    new InMemoryTemplateLoader("mermaid", "Mermaid Sequence Diagram", dedent(`
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
    new InMemoryTemplateLoader("mermaid", "Mermaid ER Diagram", dedent(`
        erDiagram
        CUSTOMER ||--o{ ORDER : places
        ORDER ||--|{ LINE-ITEM : contains
        CUSTOMER }|..|{ DELIVERY-ADDRESS : uses`)),
    new InMemoryTemplateLoader("plantuml", "PlantUML Class Diagram", dedent(`
        @startuml
        class Car
        
        Driver - Car : drives >
        Car *- Wheel : has 4 >
        Car -- Person : < owns
        
        @enduml`)),
    new InMemoryTemplateLoader("plantuml", "PlantUML Sequence Diagram", dedent(`
        @startuml
        autonumber
        Bob -> Alice : Authentication Request
        Bob <- Alice : Authentication Response
        @enduml`)),
    new InMemoryTemplateLoader("plantuml", "PlantUML C4 Container Diagram", dedent(`
        @startuml
        !include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml
        
        Person(personAlias, "Label", "Optional Description")
        Container(containerAlias, "Label", "Technology", "Optional Description")
        System(systemAlias, "Label", "Optional Description")
        
        Rel(personAlias, containerAlias, "Label", "Optional Technology")
        @enduml`)),
    new InMemoryTemplateLoader("blockdiag", "BlockDiag Diagram", dedent(`
        blockdiag {
          blockdiag -> generates -> "Block diagrams";
          blockdiag -> is -> "very easy!";
        
          blockdiag [color = "greenyellow"];
          "Block diagrams" [color = "pink"];
          "very easy!" [color = "orange"];
        }`)),
    new InMemoryTemplateLoader("seqdiag", "SeqDiag Diagram", dedent(`
    seqdiag {
      browser  -> webserver [label = "GET /seqdiag/svg/base64"];
      webserver  -> processor [label = "Convert text to image"];
      webserver <-- processor;
      browser <-- webserver;
    }`)),
    new InMemoryTemplateLoader("actdiag", "ActDiag Diagram", dedent(`
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
    new InMemoryTemplateLoader("erd", "Erd Diagram", dedent(`
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
    new InMemoryTemplateLoader("graphviz", "Graphviz Diagram", dedent(`
    digraph D {

      A -> {B, C, D} -> {F}
    
    }`)),
    new InMemoryTemplateLoader("nomnoml", "Nomnoml Diagram", dedent(`
    [Pirate|eyeCount: Int|raid();pillage()|
      [beard]--[parrot]
      [beard]-:>[foul mouth]
    ]`)),
    new InMemoryTemplateLoader("wavedrom", "WaveDrom Diagram", dedent(`
    { signal: [
      { name: "clk",  wave: "P......" },
      { name: "bus",  wave: "x.==.=x", data: ["head", "body", "tail", "data"] },
      { name: "wire", wave: "0.1..0." }
    ]}`)),
]

export function getTemplateLoadersForType(type: string): TemplateLoader[] {
    return templateLoaders.filter(it => it.rendererType === type)
}