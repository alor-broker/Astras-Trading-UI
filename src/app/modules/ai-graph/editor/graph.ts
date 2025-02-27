import {LGraph, LGraphCanvas} from "@comfyorg/litegraph";

export class Graph extends LGraph {
  override attachCanvas(graphcanvas: LGraphCanvas): void {
    if (graphcanvas.graph != this)
      graphcanvas.graph?.detachCanvas(graphcanvas);

    graphcanvas.graph = this;

    this.list_of_graphcanvas ||= [];
    this.list_of_graphcanvas.push(graphcanvas);
  }
}
