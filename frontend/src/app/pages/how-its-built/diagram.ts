import { Component, computed, input, signal } from '@angular/core';

export interface DiagramNode {
  id: string;
  label: string;
  sub: string;
  icon: string; // official service or brand icon, from public/diagram-icons
  why: string; // shown under the diagram when the box is hovered, tapped or focused
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

/**
 * An architecture diagram: official icons joined by arrows, inside group boundaries. It has a wide
 * layout and a narrow (phone) one, since one drawing scaled down to a phone would be too small to read.
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
