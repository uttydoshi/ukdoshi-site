import { Component } from '@angular/core';
import { Diagram, DiagramLayout, DiagramNode } from './diagram';

// Box positions are top-left corners; boxes are 135 x 56 (BOX in diagram.ts). Wide layouts read left to
// right, narrow ones top to bottom.

// --- 1. What happens when you visit ---

const VISIT_NODES: DiagramNode[] = [
  { id: 'visitor', label: 'Visitor', sub: 'web browser', why: 'You, in a browser. Everything is served over HTTPS.' },
  {
    id: 'dns',
    label: 'Route 53',
    sub: 'DNS',
    why: 'AWS DNS for ukdoshi.com. Points the site at CloudFront and the sign-in page at Cognito.',
  },
  {
    id: 'cdn',
    label: 'CloudFront',
    sub: 'CDN, HTTPS',
    why:
      'The single front door, served from locations close to visitors. Pages come from S3 and /api calls go to ' +
      'the API, so the site and its API share one address.',
  },
  {
    id: 's3',
    label: 'S3',
    sub: 'Angular site',
    why: 'The built Angular site, in a private bucket that only CloudFront can read.',
  },
  { id: 'api', label: 'API Gateway', sub: 'HTTP API', why: 'Receives /api calls from CloudFront and hands them to Lambda.' },
  {
    id: 'lambda',
    label: 'Lambda',
    sub: 'Python, FastAPI',
    why:
      'The Python API. No servers to look after, and it costs nothing while idle. It checks every sign-in ' +
      'token itself before answering.',
  },
  {
    id: 'dynamo',
    label: 'DynamoDB',
    sub: 'approved list',
    why: 'Who may enter the Inner Circle. Signing in proves who you are; this list decides what you can see.',
  },
  {
    id: 'cognito',
    label: 'Cognito',
    sub: 'sign-in',
    why: 'Managed sign-in on auth.ukdoshi.com, with no passwords at all: Google, or a one-time code by email.',
  },
  { id: 'google', label: 'Google', sub: 'sign-in', why: 'Sign in with an existing Google account.' },
  { id: 'ses', label: 'SES', sub: 'email codes', why: 'Sends the one-time sign-in codes, from ukdoshi.com.' },
];

const VISIT_WIDE: DiagramLayout = {
  width: 980,
  height: 455,
  boxes: {
    visitor: { x: 10, y: 150 },
    dns: { x: 175, y: 150 },
    cdn: { x: 340, y: 150 },
    s3: { x: 505, y: 30 },
    api: { x: 505, y: 150 },
    lambda: { x: 670, y: 150 },
    dynamo: { x: 835, y: 150 },
    cognito: { x: 175, y: 290 },
    google: { x: 340, y: 290 },
    ses: { x: 340, y: 370 },
  },
  edges: [
    { d: 'M145,178 H175' },
    { d: 'M310,178 H340' },
    { d: 'M475,166 H490 V58 H505', label: { text: 'pages', x: 482, y: 110, anchor: 'end' } },
    { d: 'M475,190 H505', label: { text: '/api', x: 490, y: 228 } },
    { d: 'M640,178 H670' },
    { d: 'M805,178 H835' },
    { d: 'M77.5,206 V318 H175', label: { text: 'signs in', x: 86, y: 266, anchor: 'start' } },
    { d: 'M310,318 H340' },
    { d: 'M290,346 V398 H340' },
    {
      d: 'M737.5,206 V440 H242.5 V346',
      dashed: true,
      label: { text: 'checks sign-in tokens', x: 600, y: 432 },
    },
  ],
};

const VISIT_NARROW: DiagramLayout = {
  width: 360,
  height: 630,
  boxes: {
    visitor: { x: 112.5, y: 10 },
    dns: { x: 112.5, y: 100 },
    cdn: { x: 112.5, y: 190 },
    s3: { x: 20, y: 290 },
    api: { x: 205, y: 290 },
    lambda: { x: 205, y: 380 },
    dynamo: { x: 205, y: 470 },
    cognito: { x: 20, y: 380 },
    google: { x: 20, y: 470 },
    ses: { x: 20, y: 560 },
  },
  edges: [
    { d: 'M180,66 V100' },
    { d: 'M180,156 V190' },
    { d: 'M150,246 V268 H87.5 V290', label: { text: 'pages', x: 80, y: 262, anchor: 'end' } },
    { d: 'M210,246 V268 H272.5 V290', label: { text: '/api', x: 282, y: 262, anchor: 'start' } },
    { d: 'M272.5,346 V380' },
    { d: 'M272.5,436 V470' },
    { d: 'M112.5,38 H8 V408 H20', label: { text: 'signs in', x: 14, y: 368, anchor: 'start' } },
    { d: 'M87.5,436 V470' },
    { d: 'M155,422 H174 V588 H155' },
    { d: 'M205,400 H155', dashed: true, label: { text: 'tokens', x: 180, y: 392 } },
  ],
};

// --- 2. How a change gets to live ---

const SHIP_NODES: DiagramNode[] = [
  { id: 'dev', label: 'Me', sub: 'with Claude Code', why: 'Writing and testing changes on my laptop, with Claude Code.' },
  {
    id: 'github',
    label: 'GitHub',
    sub: 'staging & main',
    why: 'The code and its history. Pushing to the staging branch updates staging; merging into main updates live.',
  },
  {
    id: 'actions',
    label: 'GitHub Actions',
    sub: 'test & build',
    why: 'Runs on every push: the backend tests first, then builds the Angular site. A failing test stops the deploy.',
  },
  {
    id: 'oidc',
    label: 'AWS login',
    sub: 'OIDC, no keys',
    why:
      'GitHub proves who it is to AWS with a short-lived token, so no AWS keys are stored anywhere, and only ' +
      'this repository’s two branches can deploy.',
  },
  {
    id: 'cdk',
    label: 'AWS CDK',
    sub: 'CloudFormation',
    why:
      'The whole AWS setup is Python code, so staging and live are built from the same definition and every ' +
      'infrastructure change is reviewed like any other code.',
  },
  {
    id: 'staging',
    label: 'Staging',
    sub: 'staging.ukdoshi.com',
    why: 'A full, separate copy with its own sign-in and data, for testing changes and sharing them before they go live.',
  },
  {
    id: 'live',
    label: 'Live',
    sub: 'ukdoshi.com',
    why: 'The real site. It only gets changes after they have been checked on staging.',
  },
];

const SHIP_WIDE: DiagramLayout = {
  width: 980,
  height: 330,
  boxes: {
    dev: { x: 10, y: 150 },
    github: { x: 175, y: 150 },
    actions: { x: 340, y: 150 },
    oidc: { x: 505, y: 150 },
    cdk: { x: 670, y: 150 },
    staging: { x: 835, y: 40 },
    live: { x: 835, y: 260 },
  },
  edges: [
    { d: 'M145,178 H175', label: { text: 'git push', x: 160, y: 140 } },
    { d: 'M310,178 H340' },
    { d: 'M475,178 H505' },
    { d: 'M640,178 H670' },
    { d: 'M805,166 H820 V68 H835', label: { text: 'staging branch', x: 812, y: 120, anchor: 'end' } },
    { d: 'M805,190 H820 V288 H835', label: { text: 'main branch', x: 812, y: 245, anchor: 'end' } },
  ],
};

const SHIP_NARROW: DiagramLayout = {
  width: 360,
  height: 540,
  boxes: {
    dev: { x: 112.5, y: 10 },
    github: { x: 112.5, y: 100 },
    actions: { x: 112.5, y: 190 },
    oidc: { x: 112.5, y: 280 },
    cdk: { x: 112.5, y: 370 },
    staging: { x: 20, y: 470 },
    live: { x: 205, y: 470 },
  },
  edges: [
    { d: 'M180,66 V100', label: { text: 'git push', x: 190, y: 87, anchor: 'start' } },
    { d: 'M180,156 V190' },
    { d: 'M180,246 V280' },
    { d: 'M180,336 V370' },
    { d: 'M150,426 V448 H87.5 V470', label: { text: 'staging branch', x: 80, y: 456, anchor: 'end' } },
    { d: 'M210,426 V448 H272.5 V470', label: { text: 'main branch', x: 282, y: 456, anchor: 'start' } },
  ],
};

/** How ukdoshi.com works and ships: two diagrams and the main decisions behind them. */
@Component({
  imports: [Diagram],
  selector: 'app-how-its-built',
  styleUrl: './how-its-built.css',
  templateUrl: './how-its-built.html',
})
export class HowItsBuilt {
  protected readonly visit = { nodes: VISIT_NODES, wide: VISIT_WIDE, narrow: VISIT_NARROW };
  protected readonly ship = { nodes: SHIP_NODES, wide: SHIP_WIDE, narrow: SHIP_NARROW };
}
