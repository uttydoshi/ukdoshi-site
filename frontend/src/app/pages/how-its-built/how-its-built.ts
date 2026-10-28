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
    why: 'Managed sign-in on auth.ukdoshi.com. It hands sign-in to Google and gives the site a token that proves who you are.',
  },
  {
    id: 'google',
    label: 'Google',
    sub: 'your account',
    why: 'You sign in with your own Google account, so this site never handles a password.',
  },
];

const VISIT_WIDE: DiagramLayout = {
  width: 980,
  height: 400,
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
    {
      d: 'M737.5,206 V385 H242.5 V346',
      dashed: true,
      label: { text: 'checks sign-in tokens', x: 600, y: 377 },
    },
  ],
};

const VISIT_NARROW: DiagramLayout = {
  width: 360,
  height: 540,
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

// --- Decisions, each with an icon (24 x 24 line drawings, like the About me activity icons) ---

interface Decision {
  title: string;
  detail: string;
  icon: string[]; // SVG path data
}

const DECISIONS: Decision[] = [
  {
    title: 'Serverless, pay for what’s used',
    detail: 'No servers to patch or keep running, and a quiet personal site costs very little.',
    icon: ['M7 18a4.5 4.5 0 0 1-.5-9 6 6 0 0 1 11.4 1.6A3.75 3.75 0 0 1 17.5 18z'], // cloud
  },
  {
    title: 'One address for the site and its API',
    detail: 'CloudFront sends /api calls to the API, so the browser never talks to a second domain.',
    icon: ['M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0', 'M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18'], // globe
  },
  {
    title: 'No passwords',
    detail: 'Sign-in is with Google, so this site has no passwords to forget, reuse or leak.',
    icon: ['M4 15a4 4 0 1 0 8 0a4 4 0 1 0-8 0', 'M10.8 12.2 20 3M16 7l3 3M14 9l2 2'], // key
  },
  {
    title: 'Signing in isn’t access',
    detail: 'The API checks every token itself, then an approved list decides who sees the Inner Circle.',
    icon: ['M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z', 'M8.5 12l2.5 2.5 4.5-5'], // shield with a tick
  },
  {
    title: 'No cloud keys stored anywhere',
    detail: 'GitHub logs in to AWS with short-lived tokens (OIDC), limited to this repository’s branches.',
    icon: ['M7 11h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z', 'M8 11V7a4 4 0 0 1 8 0v4'], // padlock
  },
  {
    title: 'Infrastructure as code',
    detail: 'The AWS setup is Python (AWS CDK), so staging and live are built from one definition.',
    icon: ['M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 6l-3 12'], // </>
  },
  {
    title: 'Staging before live',
    detail: 'Every change runs on a full, separate copy of the site first, where it can be shared and tested.',
    icon: ['M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3', 'M7.5 15h9'], // test flask
  },
  {
    title: 'Private by default',
    detail: 'No analytics or trackers, and personal API answers are never kept in the browser’s cache.',
    icon: [
      'M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8',
      'M9.9 5.1A9.7 9.7 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-2.9 3.9',
      'M6.6 6.6C3.9 8.3 2.5 12 2.5 12S6 19 12 19c1.8 0 3.4-.6 4.7-1.4',
    ], // eye with a line through it
  },
];

// --- Glossary: every acronym and AWS name on the page, A to Z, in plain English ---

interface Term {
  term: string;
  full?: string;
  meaning: string;
}

const GLOSSARY: Term[] = [
  { term: 'Angular', meaning: 'Google’s framework for building web apps. The pages of this site are an Angular app.' },
  { term: 'API', full: 'Application Programming Interface', meaning: 'How the site’s pages ask the server for information, such as whether you’re signed in.' },
  { term: 'API Gateway', meaning: 'An AWS service that receives API requests and passes them on to the code that answers them.' },
  { term: 'AWS', full: 'Amazon Web Services', meaning: 'Amazon’s cloud platform, where everything on this site runs.' },
  { term: 'CDK', full: 'Cloud Development Kit', meaning: 'An AWS tool for describing cloud resources in code. Here it’s written in Python.' },
  { term: 'CDN', full: 'Content Delivery Network', meaning: 'Servers around the world that deliver a website from somewhere close to each visitor, so it loads fast.' },
  { term: 'CI/CD', full: 'Continuous Integration / Continuous Delivery', meaning: 'Testing and releasing every change automatically, instead of by hand.' },
  { term: 'Claude Code', meaning: 'Anthropic’s AI coding assistant, which I used to design and build this site.' },
  { term: 'CloudFormation', meaning: 'The AWS service that creates and updates the cloud resources that CDK describes.' },
  { term: 'CloudFront', meaning: 'AWS’s CDN. It’s the site’s front door.' },
  { term: 'Cognito', meaning: 'AWS’s sign-in service. It handles signing in with Google.' },
  { term: 'DNS', full: 'Domain Name System', meaning: 'The internet’s address book: it turns a name like ukdoshi.com into the address of a server.' },
  { term: 'DynamoDB', meaning: 'An AWS database. It holds the list of people approved for the Inner Circle.' },
  { term: 'FastAPI', meaning: 'A Python framework for building APIs. The site’s API is written with it.' },
  { term: 'GitHub', meaning: 'Where the site’s code and its full history are stored.' },
  { term: 'GitHub Actions', meaning: 'GitHub’s automation. It tests, builds and deploys every change.' },
  { term: 'HTTPS', full: 'Hypertext Transfer Protocol Secure', meaning: 'The encrypted way browsers and websites talk: the padlock in the address bar.' },
  { term: 'Infrastructure as code', meaning: 'Defining servers, databases and networks in code, rather than by clicking around a console.' },
  { term: 'Lambda', meaning: 'An AWS service that runs code only when it’s needed, with no servers to manage.' },
  { term: 'OIDC', full: 'OpenID Connect', meaning: 'A standard way for one system to prove who it is to another, using short-lived tokens instead of passwords or keys.' },
  { term: 'Route 53', meaning: 'AWS’s DNS service.' },
  { term: 'S3', full: 'Simple Storage Service', meaning: 'AWS’s file storage. It holds the website’s files.' },
  { term: 'Serverless', meaning: 'Running on cloud services that scale automatically and charge only for what’s used, with no servers to look after.' },
  { term: 'Staging', meaning: 'A full test copy of the site, where changes are checked before they go live.' },
  { term: 'Token', meaning: 'A signed, short-lived proof of who you are, given to your browser when you sign in.' },
];

/** How ukdoshi.com works and ships: two diagrams, the main decisions behind them, and a glossary. */
@Component({
  imports: [Diagram],
  selector: 'app-how-its-built',
  styleUrl: './how-its-built.css',
  templateUrl: './how-its-built.html',
})
export class HowItsBuilt {
  protected readonly visit = { nodes: VISIT_NODES, wide: VISIT_WIDE, narrow: VISIT_NARROW };
  protected readonly ship = { nodes: SHIP_NODES, wide: SHIP_WIDE, narrow: SHIP_NARROW };
  protected readonly decisions = DECISIONS;
  protected readonly glossary = GLOSSARY;
}
