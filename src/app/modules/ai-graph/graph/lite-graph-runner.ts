import {GraphConfig, NodeId} from "../models/graph.model";
import {concatAll, from, map, Observable, observeOn, queueScheduler, take} from "rxjs";
import {LGraph} from "@comfyorg/litegraph";
import {LiteGraphModelsConverter} from "./lite-graph-models-converter";
import {NodeBase} from "./nodes/node-base";
import {GraphProcessingContextService} from "../services/graph-processing-context.service";
import {OutputFormat} from "./nodes/models";

export interface ExecutionResult {
  nodeId: NodeId;
  nodeType: string;
  nodeTitle: string;
  isSuccessful: boolean;
  nodeData?: unknown;
  outputFormat: OutputFormat | null;
}

export class LiteGraphRunner {
  static run(config: GraphConfig, graphProcessingContextService: GraphProcessingContextService): Observable<ExecutionResult> {
    const graph = new LGraph();
    graph.configure(LiteGraphModelsConverter.toSerialisableGraph(config));

    const executors = (graph._nodes_executable ?? [])
      .map(graphNode => {
          const node = graphNode as NodeBase;
          return node.executor(graphProcessingContextService).pipe(
            observeOn(queueScheduler),
            map(r => {
              return {
                nodeId: node.id as NodeId,
                nodeType: node.type!,
                nodeTitle: node.title,
                isSuccessful: r,
                nodeData: node.outputFormat != null
                  ? node.getInputData(0)
                  : node.getOutputData(0),
                outputFormat: node.outputFormat
              };
            }),
            take(1)
            // process error
          );
        }
      );

    return from(executors).pipe(
      concatAll()
    );
  }
}
