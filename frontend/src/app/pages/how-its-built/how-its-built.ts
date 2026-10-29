import { Component } from '@angular/core';
import { Diagram, DiagramGroup, DiagramLayout, DiagramNode } from './diagram';

// Icons (public/diagram-icons): AWS services from the official AWS Architecture Icons package (AWS allows
// them in architecture diagrams); GitHub, GitHub Actions and Claude from Simple Icons (CC0), in each brand's
// colour (Claude as a small badge on a person for "Me"); Google's four-colour "G" from its sign-in branding. Staging and Live use this site's own logo.
const AWS_CLOUD = {
  label: 'AWS Cloud',
  icon: 'diagram-icons/aws-cloud.svg',
  style: 'aws',
} as const;
const GITHUB = { label: 'GitHub', icon: 'diagram-icons/github.svg', style: 'plain' } as const;
const group = (
  base: Omit<DiagramGroup, 'x' | 'y' | 'width' | 'height'>,
  x: number,
  y: number,
  width: number,
  height: number,
): DiagramGroup => ({ ...base, x, y, width, height });

// Positions are the top-left corners of each node's 135 x 92 slot (BOX in diagram.ts): a 48px icon centred
// at the top, label and sub-label below. So an icon's centre is (x + 67.5, y + 24). Wide layouts read left
// to right, narrow ones top to bottom.

// --- 1. What happens when you visit ---

const VISIT_NODES: DiagramNode[] = [
  {
    id: 'visitor',
    icon: 'diagram-icons/users.svg',
    label: 'Visitor',
    sub: 'web browser',
    why: 'You, in a browser. Everything is served over HTTPS.',
  },
  {
    id: 'dns',
    icon: 'diagram-icons/route-53.svg',
    label: 'Route 53',
    sub: 'DNS',
    why: 'AWS DNS for ukdoshi.com. Points the site at CloudFront and the sign-in page at Cognito.',
  },
  {
    id: 'cdn',
    icon: 'diagram-icons/cloudfront.svg',
    label: 'CloudFront',
    sub: 'CDN, HTTPS',
    why:
      'The single front door, served from locations close to visitors. Pages come from S3 and /api calls go to ' +
      'the API, so the site and its API share one address.',
  },
  {
    id: 's3',
    icon: 'diagram-icons/s3.svg',
    label: 'S3',
    sub: 'Angular site',
    why: 'The built Angular site, in a private bucket that only CloudFront can read.',
  },
  {
    id: 'api',
    icon: 'diagram-icons/api-gateway.svg',
    label: 'API Gateway',
    sub: 'HTTP API',
    why: 'Receives /api calls from CloudFront and hands them to Lambda.',
  },
  {
    id: 'lambda',
    icon: 'diagram-icons/lambda.svg',
    label: 'Lambda',
    sub: 'Python, FastAPI',
    why:
      'The Python API. No servers to look after, and it costs nothing while idle. It checks every sign-in ' +
      'token itself before answering.',
  },
  {
    id: 'dynamo',
    icon: 'diagram-icons/dynamodb.svg',
    label: 'DynamoDB',
    sub: 'approved list',
    why: 'Who may enter the Inner Circle. Signing in proves who you are; this list decides what you can see.',
  },
  {
    id: 'cognito',
    icon: 'diagram-icons/cognito.svg',
    label: 'Cognito',
    sub: 'sign-in',
    why: 'Managed sign-in on auth.ukdoshi.com. It hands sign-in to Google and gives the site a token that proves who you are.',
  },
  {
    id: 'google',
    icon: 'diagram-icons/google.svg',
    label: 'Google',
    sub: 'your account',
    why: 'You sign in with your own Google account, so this site never handles a password.',
  },
  {
    id: 'ses',
    icon: 'diagram-icons/ses.svg',
    label: 'SES',
    sub: 'email to me',
    why:
      'When a signed-in visitor clicks “Ask to join”, the API emails me their name and address, at most ' +
      'once a day per person.',
  },
];

const VISIT_WIDE: DiagramLayout = {
  width: 980,
  height: 560,
  groups: [group(AWS_CLOUD, 150, 20, 825, 405)],
  boxes: {
    visitor: { x: 10, y: 170 },
    dns: { x: 175, y: 170 },
    cdn: { x: 340, y: 170 },
    s3: { x: 505, y: 50 },
    api: { x: 505, y: 170 },
    lambda: { x: 670, y: 170 },
    dynamo: { x: 835, y: 170 },
    cognito: { x: 175, y: 320 },
    ses: { x: 835, y: 320 },
    google: { x: 175, y: 458 },
  },
  edges: [
    { d: 'M107.5,194 H212.5' },
    { d: 'M272.5,194 H377.5' },
    { d: 'M437.5,184 H470 V74 H542.5', label: { text: 'pages', x: 462, y: 130, anchor: 'end' } },
    { d: 'M437.5,204 H542.5', label: { text: '/api', x: 490, y: 222 } },
    { d: 'M602.5,194 H707.5' },
    { d: 'M767.5,190 H872.5' },
    {
      d: 'M767.5,206 H800 V344 H872.5',
      label: { text: 'join requests', x: 806, y: 300, anchor: 'start' },
    },
    { d: 'M77.5,268 V344 H212.5', label: { text: 'signs in', x: 84, y: 310, anchor: 'start' } },
    { d: 'M242.5,416 V452' },
    {
      d: 'M737.5,268 V344 H272.5',
      dashed: true,
      label: { text: 'checks sign-in tokens', x: 505, y: 336 },
    },
  ],
};

const VISIT_NARROW: DiagramLayout = {
  width: 360,
  height: 965,
  groups: [group(AWS_CLOUD, 14, 118, 340, 720)],
  boxes: {
    visitor: { x: 112.5, y: 10 },
    dns: { x: 112.5, y: 150 },
    cdn: { x: 112.5, y: 265 },
    s3: { x: 20, y: 390 },
    api: { x: 205, y: 390 },
    cognito: { x: 20, y: 505 },
    lambda: { x: 205, y: 505 },
    dynamo: { x: 205, y: 620 },
    ses: { x: 205, y: 740 },
    google: { x: 20, y: 865 },
  },
  edges: [
    { d: 'M180,102 V144' },
    { d: 'M180,242 V259' },
    { d: 'M150,357 V371 H87.5 V384', label: { text: 'pages', x: 80, y: 367, anchor: 'end' } },
    { d: 'M210,357 V371 H272.5 V384', label: { text: '/api', x: 282, y: 367, anchor: 'start' } },
    { d: 'M272.5,482 V499' },
    { d: 'M272.5,597 V614' },
    {
      d: 'M302.5,535 H345 V764 H302.5',
      label: { text: 'join requests', x: 340, y: 728, anchor: 'end' },
    },
    { d: 'M149.5,34 H6 V529 H57.5', label: { text: 'signs in', x: 20, y: 496, anchor: 'start' } },
    { d: 'M242.5,529 H117.5', dashed: true, label: { text: 'tokens', x: 180, y: 521 } },
    { d: 'M87.5,597 V859' },
  ],
};

// --- 2. How a change gets to live ---

const SHIP_NODES: DiagramNode[] = [
  {
    id: 'dev',
    icon: 'diagram-icons/me-with-claude.svg',
    label: 'Me',
    sub: '+ Claude Code',
    why: 'I design and build each change, with Claude Code as my coding partner, and try it on my laptop first.',
  },
  {
    id: 'github',
    icon: 'diagram-icons/github.svg',
    label: 'GitHub',
    sub: 'staging & main',
    why: 'The code and its history. Pushing to the staging branch updates staging; merging into main updates live.',
  },
  {
    id: 'actions',
    icon: 'diagram-icons/github-actions.svg',
    label: 'GitHub Actions',
    sub: 'CI/CD pipeline',
    why:
      'The CI/CD pipeline. On every push it runs the backend and frontend tests, builds the site, then ' +
      'deploys it to AWS. A failing test stops the deploy.',
  },
  {
    id: 'oidc',
    icon: 'diagram-icons/iam.svg',
    label: 'AWS login',
    sub: 'OIDC, no keys',
    why:
      'GitHub proves who it is to AWS with a short-lived token, so no AWS keys are stored anywhere, and only ' +
      'this repository’s two branches can deploy.',
  },
  {
    id: 'cdk',
    icon: 'diagram-icons/cdk.svg',
    label: 'AWS CDK',
    sub: 'CloudFormation',
    why:
      'The whole AWS setup is Python code, so staging and live are built from the same definition and every ' +
      'infrastructure change is reviewed like any other code.',
  },
  {
    id: 'staging',
    icon: 'favicon-staging.svg',
    label: 'Staging',
    sub: 'staging.ukdoshi.com',
    why: 'A full, separate copy with its own sign-in and data, for testing changes and sharing them before they go live.',
  },
  {
    id: 'live',
    icon: 'favicon.svg',
    label: 'Live',
    sub: 'ukdoshi.com',
    why: 'The real site. It only gets changes after they have been checked on staging.',
  },
];

const SHIP_WIDE: DiagramLayout = {
  width: 980,
  height: 395,
  groups: [group(GITHUB, 160, 110, 325, 155), group(AWS_CLOUD, 495, 20, 480, 365)],
  boxes: {
    dev: { x: 10, y: 150 },
    github: { x: 175, y: 150 },
    actions: { x: 340, y: 150 },
    oidc: { x: 505, y: 150 },
    cdk: { x: 670, y: 150 },
    staging: { x: 835, y: 50 },
    live: { x: 835, y: 280 },
  },
  edges: [
    { d: 'M107.5,174 H212.5', label: { text: 'git push', x: 132, y: 164 } },
    { d: 'M272.5,174 H377.5' },
    { d: 'M437.5,174 H542.5' },
    { d: 'M602.5,174 H707.5' },
    {
      d: 'M767.5,164 H800 V74 H872.5',
      label: { text: 'staging branch', x: 794, y: 120, anchor: 'end' },
    },
    {
      d: 'M767.5,184 H800 V304 H872.5',
      label: { text: 'main branch', x: 794, y: 260, anchor: 'end' },
    },
  ],
};

const SHIP_NARROW: DiagramLayout = {
  width: 360,
  height: 755,
  groups: [group(GITHUB, 30, 120, 300, 245), group(AWS_CLOUD, 14, 377, 340, 365)],
  boxes: {
    dev: { x: 112.5, y: 10 },
    github: { x: 112.5, y: 150 },
    actions: { x: 112.5, y: 270 },
    oidc: { x: 112.5, y: 405 },
    cdk: { x: 112.5, y: 520 },
    staging: { x: 20, y: 640 },
    live: { x: 205, y: 640 },
  },
  edges: [
    { d: 'M180,102 V144', label: { text: 'git push', x: 190, y: 116, anchor: 'start' } },
    { d: 'M180,242 V264' },
    { d: 'M180,362 V399' },
    { d: 'M180,497 V514' },
    {
      d: 'M150,612 V624 H87.5 V634',
      label: { text: 'staging branch', x: 80, y: 621, anchor: 'end' },
    },
    {
      d: 'M210,612 V624 H272.5 V634',
      label: { text: 'main branch', x: 282, y: 621, anchor: 'start' },
    },
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
    detail:
      'CloudFront sends /api calls to the API, so the browser never talks to a second domain.',
    icon: [
      'M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0',
      'M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18',
    ], // globe
  },
  {
    title: 'No passwords',
    detail: 'Sign-in is with Google, so this site has no passwords to forget, reuse or leak.',
    icon: ['M4 15a4 4 0 1 0 8 0a4 4 0 1 0-8 0', 'M10.8 12.2 20 3M16 7l3 3M14 9l2 2'], // key
  },
  {
    title: 'Signing in isn’t access',
    detail:
      'The API checks every token itself, then an approved list decides who sees the Inner Circle.',
    icon: ['M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z', 'M8.5 12l2.5 2.5 4.5-5'], // shield with a tick
  },
  {
    title: 'No cloud keys stored anywhere',
    detail:
      'GitHub logs in to AWS with short-lived tokens (OIDC), limited to this repository’s branches.',
    icon: [
      'M7 11h10a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z',
      'M8 11V7a4 4 0 0 1 8 0v4',
    ], // padlock
  },
  {
    title: 'Infrastructure as code',
    detail: 'The AWS setup is Python (AWS CDK), so staging and live are built from one definition.',
    icon: ['M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 6l-3 12'], // </>
  },
  {
    title: 'Staging before live',
    detail:
      'Every change runs on a full, separate copy of the site first, where it can be shared and tested.',
    icon: ['M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3', 'M7.5 15h9'], // test flask
  },
  {
    title: 'Private by default',
    detail:
      'No analytics or tracking. And private content isn’t stored by your browser, so once you sign out, ' +
      'nobody using the same device can bring it back.',
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
  {
    term: 'Angular',
    meaning: 'Google’s framework for building web apps. The pages of this site are an Angular app.',
  },
  {
    term: 'API',
    full: 'Application Programming Interface',
    meaning:
      'How the site’s pages ask the server for information, such as whether you’re signed in.',
  },
  {
    term: 'API Gateway',
    meaning:
      'The front desk for the site’s API: an AWS service that receives each request and passes it to the code ' +
      'that answers it.',
  },
  {
    term: 'AWS',
    full: 'Amazon Web Services',
    meaning: 'Amazon’s cloud platform, where everything on this site runs.',
  },
  {
    term: 'CDK',
    full: 'Cloud Development Kit',
    meaning:
      'An AWS tool for writing down the whole cloud setup as code, like a blueprint. Here the blueprint is ' +
      'written in Python.',
  },
  {
    term: 'CDN',
    full: 'Content Delivery Network',
    meaning:
      'Servers around the world that deliver a website from somewhere close to each visitor, so it loads fast.',
  },
  {
    term: 'CI/CD',
    full: 'Continuous Integration / Continuous Delivery',
    meaning: 'Testing and releasing every change automatically, instead of by hand.',
  },
  {
    term: 'Claude Code',
    meaning: 'Anthropic’s AI coding assistant, which I used to design and build this site.',
  },
  {
    term: 'CloudFormation',
    meaning:
      'The AWS service that builds what the CDK blueprint describes, and updates it whenever the blueprint ' +
      'changes.',
  },
  {
    term: 'CloudFront',
    meaning:
      'AWS’s CDN: it keeps copies of the site on servers around the world, so pages load quickly wherever ' +
      'you are. Every visit comes in through it, like the site’s front door.',
  },
  { term: 'Cognito', meaning: 'AWS’s sign-in service. It handles signing in with Google.' },
  {
    term: 'DNS',
    full: 'Domain Name System',
    meaning:
      'The internet’s address book: it turns a name like ukdoshi.com into the address of a server.',
  },
  {
    term: 'DynamoDB',
    meaning: 'An AWS database. It holds the list of people approved for the Inner Circle.',
  },
  {
    term: 'FastAPI',
    meaning: 'A Python framework for building APIs. The site’s API is written with it.',
  },
  { term: 'GitHub', meaning: 'Where the site’s code and its full history are stored.' },
  {
    term: 'GitHub Actions',
    meaning:
      'GitHub’s automation, used here as the CI/CD pipeline: every change is tested, built and released ' +
      'without anyone doing it by hand.',
  },
  {
    term: 'HTTPS',
    full: 'Hypertext Transfer Protocol Secure',
    meaning: 'The encrypted way browsers and websites talk: the padlock in the address bar.',
  },
  {
    term: 'Infrastructure as code',
    meaning:
      'Defining servers, databases and networks in code, rather than by clicking around a console.',
  },
  {
    term: 'Lambda',
    meaning:
      'An AWS service that runs code only at the moment it’s needed, so there’s no computer to keep switched ' +
      'on and nothing to pay while nobody is using the site.',
  },
  {
    term: 'OIDC',
    full: 'OpenID Connect',
    meaning:
      'A standard way for one system to prove who it is to another, using short-lived tokens instead of passwords or keys.',
  },
  {
    term: 'Route 53',
    meaning:
      'AWS’s DNS service, the address book for ukdoshi.com: when you type the address, it tells your browser ' +
      'where to find the site.',
  },
  {
    term: 'S3',
    full: 'Simple Storage Service',
    meaning: 'AWS’s file storage. It holds the website’s files.',
  },
  {
    term: 'Serverless',
    meaning:
      'Running on cloud services that scale automatically and charge only for what’s used, with no servers to look after.',
  },
  {
    term: 'SES',
    full: 'Simple Email Service',
    meaning: 'AWS’s email sending service. It tells me when someone asks to join the Inner Circle.',
  },
  {
    term: 'Staging',
    meaning: 'A full test copy of the site, where changes are checked before they go live.',
  },
  {
    term: 'Token',
    meaning: 'A signed, short-lived proof of who you are, given to your browser when you sign in.',
  },
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
