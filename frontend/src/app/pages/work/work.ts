import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WorkHistory } from './work-history';

interface Role {
  title: string;
  shown: number; // how many points show before "Show all"; the strongest come first
  points: string[];
}

interface Delivered {
  company: string;
  logo: string;
  scale?: number; // evens out heavy logos
  headline: string;
  tags: string[];
  stack: string[];
  roles: Role[];
}

/** Everything professional in one place, for recruiters: outcomes, how I work, where, and how to reach me. */
@Component({
  imports: [RouterLink, WorkHistory],
  selector: 'app-work',
  styleUrl: './work.css',
  templateUrl: './work.html',
})
export class Work {
  // What I've delivered, most recent first, with the points from my resume. No dates here: the
  // timeline in "Where I've worked" has them. No numbers on purpose:
  // those stay on my resume. `tags` are skills (orange); `stack` is the tech, from each role's
  // "Tech stack & tools". A company can have more than one role, each with its own points.
  // Companies whose cards are showing every point.
  protected readonly expanded = signal(new Set<string>());

  protected toggle(company: string): void {
    this.expanded.update((open) => {
      const next = new Set(open);
      if (!next.delete(company)) next.add(company);
      return next;
    });
  }

  protected total(item: Delivered): number {
    return item.roles.reduce((sum, role) => sum + role.points.length, 0);
  }

  protected readonly delivered: Delivered[] = [
    {
      company: 'Culture Amp',
      logo: 'logos/culture-amp.png',
      headline: 'Built and managed the AI Platform that made shipping AI features fast and safe.',
      tags: [
        'Agentic AI coding',
        'Automated dashboards',
        'LLM observability',
        'Risk management',
        'Dependency management',
      ],
      stack: ['AWS', 'GCP', 'Vertex AI', 'Python', 'Datadog', 'Langfuse', 'Claude Code'],
      roles: [
        {
          title: 'Engineering Manager',
          shown: 4,
          points: [
            'Led AI engineers and data scientists building and running Culture Amp’s centralised AI Platform, which product teams used to ship AI-powered features to customers',
            'Cut AI feature development time from weeks to days with a LiteLLM-based LLM gateway with cost tracking, rate limiting and fallbacks',
            'Gave product teams observability out of the box, with an OpenTelemetry collector that routes all AI feature traces to the data lake, Datadog and Langfuse from day one',
            'Built a control center that alerts months before in-use LLM models retire, catching a mid-flight date change in time to migrate',
            'Owned engineering execution (solution previews, RFCs, DACIs, risks, dependencies), people management and delivery',
            'Built a de-identification service that anonymises personal data in production data and Langfuse traces, enabling research, model evaluation and production monitoring on real customer data',
            'Cut LLM model comparison from days to hours with an evaluation engine for choosing new models and moving off deprecated ones',
            'Extended it into a live timeline of sprint goals and roadmap for engineering, product and leadership, bringing Jira, Atlassian Atlas and Jira Product Discovery into one view',
            'Kept delivery on schedule through a stretch without a product manager, partnering with the Director of Product on the roadmap, stakeholder alignment and intake',
          ],
        },
      ],
    },
    {
      company: 'Coles Group',
      logo: 'logos/coles.svg',
      headline: 'Built a team and a new service from scratch.',
      tags: ['Team building', 'CI/CD', 'Offshore team management', 'Agile coaching'],
      stack: ['Azure', 'Node.js', 'TypeScript', '.NET'],
      roles: [
        {
          title: 'Engineering Manager',
          shown: 4,
          points: [
            'Managed the Enterprise Services domain, with onshore and offshore direct reports, building the B2B file transfer services suppliers use to exchange inventory, promotions, pricing and demand data with Coles',
            'Launched, in phases, Coles’ first cloud-based (Azure) SFTP service, building the workstream from scratch with a technical and product roadmap',
            'Built the greenfield team, hiring engineers and a tech lead, and aligned onshore and offshore teams around a shared vision and delivery plan to launch on time',
            'Moved production deployments from every few months towards weekly or fortnightly with continuous delivery tooling and processes',
            'Drove solution previews, RFCs and new repos, working with the tech lead and architects to meet Coles standards',
            'Led technical sessions on the main challenge, latency (Azure Blob Storage vs containers running OpenSSH), and paired with developers on bugs and blockers',
            'Kept cloud costs visible with Azure cost analysis and allocation tags, broken down by division and supplier',
          ],
        },
      ],
    },
    {
      company: 'MYOB',
      logo: 'logos/myob.png',
      scale: 1.15,
      headline: 'DevOps tooling that enabled a faster, cheaper path to production.',
      tags: ['DevOps', 'Delivery', '12-month roadmap', 'Vendor management', 'Cost optimisation'],
      stack: ['AWS', 'Go', 'Bash', 'Kubernetes', 'Buildkite', 'GitHub'],
      roles: [
        {
          title: 'Delivery Manager',
          shown: 2,
          points: [
            'Managed the Developer Experience domain: DevOps tooling, automation and central AWS services for teams across MYOB',
            'Set the domain’s purpose and key results, and planned a long-range delivery roadmap that gave senior leadership a clear view of its direction',
            'Created a learning program for new engineers on the MYOB way of development and DevOps foundations',
            'Managed external vendors across contract renewals, access management, cost reviews and operational hygiene',
          ],
        },
        {
          title: 'Development Lead',
          shown: 3,
          points: [
            'Led a DevOps team running MYOB’s release systems (CI/CD, artifact management, AWS account management), alongside planning, agile coaching and vendor management',
            'Cut deployment times by leading a CI/CD tool rollout across teams',
            'Reduced AWS spend substantially by optimising teams’ resource usage across the company’s AWS accounts',
            'Cut the effort to roll out new features across AWS accounts from many hours to minutes by centralising tools',
            'Strengthened AWS security (access controls, account-level guardrails) for revenue-critical products',
            'Brought all vendor documents, legal and contract information into one place for better vendor management',
            'Managed additional teams for a few months while other leaders were away, keeping delivery on track',
          ],
        },
      ],
    },
  ];

}
