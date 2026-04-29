import type { ITagsWidget } from '../types/widgets'
import { BaseWidget } from './BaseWidget'
import type { DrawWidgetOptions, WidgetEventOptions } from './BaseWidget'

/**
 * Widget for editing user tags applied to saved assets.
 * Vue-only — the canvas renderer draws nothing.
 */
export class TagsWidget extends BaseWidget<ITagsWidget> implements ITagsWidget {
  override type = 'tags' as const

  drawWidget(
    _ctx: CanvasRenderingContext2D,
    _options: DrawWidgetOptions
  ): void {
    // Vue-only widget; nothing to draw on canvas.
  }

  onClick(_options: WidgetEventOptions): void {
    // Vue-only widget; click handled in the Vue component.
  }
}
