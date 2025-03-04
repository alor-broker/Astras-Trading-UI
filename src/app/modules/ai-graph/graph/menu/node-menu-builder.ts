import {NodeBase} from "../nodes/node-base";
import {Direction, IContextMenuValue, LGraphCanvas} from "@comfyorg/litegraph";
import {ContextMenu} from "../nodes/models";
import {TranslatorFn} from "../../../../shared/services/translator.service";
import {alignNodes, distributeNodes} from "../utils/arrange";
import {IContextMenuOptions} from "@comfyorg/litegraph/dist/interfaces";

export class NodeMenuBuilder {
  static getMenu(targetNode: NodeBase, translator: TranslatorFn): ContextMenu {
    const options: (IContextMenuValue | null)[] = [];

    options.push({
      content: targetNode.pinned
        ? translator(['labels', 'unpin'], {falback: 'Unpin'})
        : translator(['labels', 'pin'], {falback: 'Pin'}),
      callback: () => {
        const canvas = LGraphCanvas.active_canvas;
        targetNode.pin();
        canvas.setDirty(true);
        canvas.graph?.afterChange();
      }
    });

    if (targetNode.resizable ?? true) {
      options.push({
        content: translator(['labels', 'resize'], {falback: 'Adjust Size'}),
        callback: (value, subOptions, event, previousMenu) => {
          LGraphCanvas.onMenuResizeNode(value as IContextMenuValue, subOptions as IContextMenuOptions, event!, previousMenu!, targetNode);
          LGraphCanvas.active_canvas.graph?.afterChange();
        }
      });
    }

    if (targetNode.collapsible) {
      options.push({
        content: targetNode.collapsed
          ? translator(['labels', 'expand'], {falback: 'Expand'})
          : translator(['labels', 'collapse'], {falback: 'Collapse'}),
        callback: LGraphCanvas.onMenuNodeCollapse
      });
    }

    // separator
    options.push(null);

    if(Object.keys(LGraphCanvas.active_canvas.selected_nodes).length > 1) {
      options.push({
        content: translator(['labels', 'alignTo'], {falback: 'Align Selected To'}),
        has_submenu: true,
        submenu: {
          options: ['top', 'bottom', 'left', 'right'].map(value => {
            return {
              content: translator(['alignSideOptions', value], {falback: value}),
              callback: (): void => {
                const canvas = LGraphCanvas.active_canvas;
                alignNodes(
                  Object.values(canvas.selected_nodes),
                  value.toLowerCase() as Direction,
                  targetNode,
                );

                canvas.setDirty(true, true);
                canvas.graph?.afterChange();
              }
            };
          })
        }
      });

      options.push({
        content: translator(['labels', 'distribute'], {falback: 'Distribute Nodes'}),
        has_submenu: true,
        submenu: {
          options: ['vertically', 'horizontally'].map(value => {
            return {
              content: translator(['distributeOptions', value], {falback: value}),
              callback: (): void => {
                const canvas = LGraphCanvas.active_canvas;
                distributeNodes(Object.values(canvas.selected_nodes), value === "horizontally");
                canvas.setDirty(true, true);
                canvas.graph?.afterChange();
              }
            };
          })
        }
      });

      // separator
      options.push(null);
    }

    if (targetNode.clonable ?? true) {
      options.push({
        content: translator(['labels', 'clone'], {falback: 'Clone'}),
        callback: LGraphCanvas.onMenuNodeClone
      });
    }

    if (targetNode.removable ?? true) {
      options.push({
        content: translator(['labels', 'remove'], {falback: 'Remove'}),
        callback: LGraphCanvas.onMenuNodeRemove
      });
    }

    if (options[options.length - 1] != null) {
      // add separator
      options.push(null);
    }

    options.push({
      content: translator(['labels', 'properties'], {falback: 'Properties'}),
      callback: () => LGraphCanvas.active_canvas.showShowNodePanel(targetNode)
    });

    return {
      title: targetNode.getTitle(),
      items: options
    };
  }
}
