import { Component, computed, input, signal } from '@angular/core';

export interface DiagramNode {
  id: string;
  label: string;
  sub: string;
  why: string; // shown under the diagram when the box is hovered, tapped or focused
}

export interface DiagramEdge {
  d: string; // SVG path, drawn in the layout's coordinates; the arrowhead goes at its end
  dashed?: boolean;
  label?: { text: string; x: number; y: number; anchor?: 'start' | 'middle' | 'end' };
}

export interface DiagramLayout {
  width: number;
  height: number;
  boxes: Record<string, { x: number; y: number }>; // top-left corner of each node's box
  edges: DiagramEdge[];
}

export const BOX = { width: 135, height: 56 };

let nextId = 0;

/**
 * A boxes-and-arrows diagram in the site's style. It has a wide layout and a narrow (phone) one,
 * since one drawing scaled down to a phone would make its text too small to read.
 */
@Component({
  selector: 'app-diagram',
  styleUrl: './diagram.css',
  templateUrl: './diagram.html',
})
export class Diagram {
  readonly label = input.required<string>();
  readonly nodes = input.required<DiagramNode[]>();
  readonly wide = input.required<DiagramLayout>();
  readonly narrow = input.required<DiagramLayout>();

  protected readonly box = BOX;
  protected readonly arrowId = `arrow-${nextId++}`;
  protected readonly selected = signal<string | null>(null);
  protected readonly explanation = computed(() => this.nodes().find((node) => node.id === this.selected()));
}
