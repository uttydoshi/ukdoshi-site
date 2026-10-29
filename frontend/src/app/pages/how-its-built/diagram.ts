import { Component, ElementRef, inject, input, signal } from '@angular/core';

export interface DiagramNode {
  id: string;
  label: string;
  sub: string;
  icon: string; // official service or brand icon, from public/diagram-icons
  why: string; // shown in a card under the icon when it's hovered, tapped or focused
}

export interface DiagramEdge {
  d: string; // SVG path, drawn in the layout's coordinates; the arrowhead goes at its end
  dashed?: boolean;
  label?: { text: string; x: number; y: number; anchor?: 'start' | 'middle' | 'end' };
}

/** A boundary drawn around related nodes, like "AWS Cloud" in AWS's own architecture diagrams. */
export interface DiagramGroup {
  label: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: 'aws' | 'plain';
}

export interface DiagramLayout {
  width: number;
  height: number;
  groups: DiagramGroup[];
  boxes: Record<string, { x: number; y: number }>; // top-left corner of each node's slot
  edges: DiagramEdge[];
}

// Each node's slot: a 48px icon centred at the top, then its label and sub-label underneath.
export const BOX = { width: 135, height: 92, icon: 48 };

let nextId = 0;

const CARD_WIDTH_PX = 320; // 20rem, kept in sync with diagram.css

/**
 * An architecture diagram: official icons joined by arrows, inside group boundaries. It has a wide
 * layout and a narrow (phone) one, since one drawing scaled down to a phone would be too small to read.
 * Hovering, tapping or tabbing to an icon opens a card under it saying why it's there, like the
 * company logos on About me.
 */
@Component({
  selector: 'app-diagram',
  styleUrl: './diagram.css',
  templateUrl: './diagram.html',
  host: {
    '(mouseleave)': 'close()',
    '(document:click)': 'closeIfOutside($event)',
    '(document:keydown.escape)': 'close()',
  },
})
export class Diagram {
  readonly label = input.required<string>();
  readonly nodes = input.required<DiagramNode[]>();
  readonly wide = input.required<DiagramLayout>();
  readonly narrow = input.required<DiagramLayout>();

  protected readonly box = BOX;
  protected readonly arrowId = `arrow-${nextId++}`;
  protected readonly open = signal<{ node: DiagramNode; top: number; left: number; arrow: number } | null>(null);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Opens the card just under this icon's slot, kept within the diagram's width, pointing at the icon. */
  protected show(node: DiagramNode, slot: Element): void {
    const box = this.host.nativeElement.getBoundingClientRect();
    const target = slot.getBoundingClientRect();
    const width = Math.min(CARD_WIDTH_PX, box.width);
    const centre = target.left + target.width / 2 - box.left;
    const left = Math.max(0, Math.min(centre - width / 2, box.width - width));
    this.open.set({ node, top: target.bottom - box.top, left, arrow: centre - left });
  }

  protected close(): void {
    this.open.set(null);
  }

  protected closeIfOutside(event: Event): void {
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }
}
