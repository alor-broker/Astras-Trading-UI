import {LGraphCanvas} from "@comfyorg/litegraph";

export class AtsGraphCanvas extends LGraphCanvas {
  override drawBackCanvas(): void {
    const canvas = this.bgcanvas;
    if (
      canvas.width != this.canvas.width ||
      canvas.height != this.canvas.height
    ) {
      canvas.width = this.canvas.width;
      canvas.height = this.canvas.height;
    }

    if (!this.bgctx) {
      this.bgctx = this.bgcanvas.getContext("2d") ?? undefined;
    }
    const ctx = this.bgctx!;
    // TODO: Remove this
    // @ts-expect-error
    if (ctx.start) ctx.start();

    const viewport = this.viewport ?? [0, 0, ctx.canvas.width, ctx.canvas.height];

    // clear
    if (this.clear_background) {
      ctx.clearRect(viewport[0], viewport[1], viewport[2], viewport[3]);
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    const bg_already_painted = this.onRenderBackground
      ? this.onRenderBackground(canvas, ctx)
      : false;

    // reset in case of error
    if (!this.viewport) {
      ctx.restore();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    this.visible_links!.length = 0;

    if (this.graph) {
      // apply transformations
      ctx.save();
      this.ds.toCanvasContext(ctx);

      // render BG
      if (
        this.ds.scale < 1.5 &&
        !bg_already_painted &&
        this.clear_background_color
      ) {
        ctx.fillStyle = this.clear_background_color;
        ctx.fillRect(
          this.visible_area![0],
          this.visible_area![1],
          this.visible_area![2],
          this.visible_area![3],
        );
      }

      if (this.background_image && this.ds.scale > 0.5 && !bg_already_painted) {
        if (this.zoom_modify_alpha) {
          ctx.globalAlpha = (1.0 - 0.5 / this.ds.scale) * this.editor_alpha;
        } else {
          ctx.globalAlpha = this.editor_alpha;
        }
        ctx.imageSmoothingEnabled = false;
        if (this._bg_img == null || this._bg_img.name != this.background_image) {
          this._bg_img = new Image();
          this._bg_img.name = this.background_image;
          this._bg_img.src = this.background_image;
          const that = this;
          this._bg_img.onload = function (): void {
            that.draw(true, true);
          };
        }

        let pattern = this._pattern;
        if (pattern == null && this._bg_img.width > 0) {
          pattern = ctx.createPattern(this._bg_img, "repeat") ?? undefined;
          this._pattern_img = this._bg_img;
          this._pattern = pattern;
        }

        // NOTE: This ridiculous kludge provides a significant performance increase when rendering many large (> canvas width) paths in HTML canvas.
        // I could find no documentation or explanation.  Requires that the BG image is set.
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(
            this.visible_area![0],
            this.visible_area![1],
            this.visible_area![2],
            this.visible_area![3],
          );
          ctx.fillStyle = "transparent";
        }

        ctx.globalAlpha = 1.0;
        ctx.imageSmoothingEnabled = true;
      }

      // groups
      if (this.graph._groups.length) {
        this.drawGroups(canvas, ctx);
      }

      this.onDrawBackground?.(ctx, this.visible_area);

      // DEBUG: show clipping area
      // ctx.fillStyle = "red";
      // ctx.fillRect( this.visible_area[0] + 10, this.visible_area[1] + 10, this.visible_area[2] - 20, this.visible_area[3] - 20);
      // bg
      if (this.render_canvas_border) {
        ctx.strokeStyle = "#235";
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
      }

      if (this.render_connections_shadows) {
        ctx.shadowColor = "#000";
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 6;
      } else {
        ctx.shadowColor = "rgba(0,0,0,0)";
      }

      // draw connections
      this.drawConnections(ctx);

      ctx.shadowColor = "rgba(0,0,0,0)";

      // restore state
      ctx.restore();
    }

    // TODO: Remove this
    // @ts-expect-error
    ctx.finish?.();

    this.dirty_bgcanvas = false;
    // Forces repaint of the front canvas.
    this.dirty_canvas = true;
  }
}
