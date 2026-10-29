import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** The landing page: a warm hello, a personal philosophy, what I've delivered, and a way into About me. */
@Component({
  imports: [RouterLink],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {
  // Words behind the portrait, scattered just outside my outline (measured from the cut-out photo).
  // `top` and `x` are % of the photo's box; `left` words end at x (they grow away from me), `right`
  // words start at it. Size in rem (scaled down on phones), tilt in degrees.
  // What I've delivered, most recent first. No numbers on purpose: those stay on my resume.
  // `tags` are skills (orange); `stack` is the tech, from each role's "Tech stack & tools" on my resume.
  protected readonly delivered = [
    {
      company: 'Culture Amp',
      logo: 'logos/culture-amp.png',
      role: 'Engineering Manager',
      years: '2021 – 2026',
      headline: 'Made shipping AI features fast and safe.',
      points: [
        'Led the AI Platform team of AI engineers and data scientists.',
        'Built an LLM gateway with tracing, model evaluation and de-identification of customer data.',
        'Product teams across the company used it to ship AI features to customers quickly.',
      ],
      tags: ['AI platform', 'Platform teams'],
      stack: ['AWS', 'GCP', 'Vertex AI', 'Python', 'LiteLLM', 'OpenTelemetry', 'Datadog', 'Langfuse', 'Claude Code'],
    },
    {
      company: 'Coles Group',
      logo: 'logos/coles.svg',
      role: 'Engineering Manager',
      years: '2020 – 2021',
      headline: 'Built a team and a new service from scratch.',
      points: [
        'Formed and grew the Enterprise Services team.',
        'Launched Coles’ first cloud-based file transfer service for its suppliers.',
      ],
      tags: ['Team building', 'Cloud'],
      stack: ['Azure', 'Node.js', 'TypeScript', '.NET'],
    },
    {
      company: 'MYOB',
      logo: 'logos/myob.png',
      role: 'Delivery Manager · Development Lead',
      years: '2016 – 2020',
      headline: 'A faster, cheaper path to production.',
      points: [
        'Led DevOps and developer experience across MYOB’s engineering teams.',
        'Rolled out a new CI/CD platform, brought AWS costs down and sped up deployments.',
        'Gave teams a secure, friction-free path to production.',
      ],
      tags: ['DevOps', 'Delivery'],
      stack: ['AWS', 'Go', 'Bash', 'Kubernetes', 'Buildkite', 'GitHub'],
      scale: 1.15,
    },
  ];

  protected readonly words = [
    { text: 'Curious mind', side: 'right', x: 69, top: 1, size: 1.45, serif: true, tilt: -3 },
    { text: 'Optimist', side: 'left', x: 42, top: 3, size: 1.75, serif: true },
    { text: 'Hiker', side: 'right', x: 84, top: 12, size: 1.15, tilt: 2 },
    { text: 'Listener', side: 'left', x: 37, top: 15, size: 2.1, serif: true },
    { text: 'Coffee fan', side: 'right', x: 84, top: 24, size: 1.4, serif: true },
    { text: 'Runner', side: 'left', x: 40, top: 31, size: 1.2, tilt: -2 },
    { text: 'Nature lover', side: 'right', x: 78.5, top: 39, size: 1.2 },
    { text: 'Husband', side: 'left', x: 42, top: 43, size: 1.1, tilt: 2 },
    { text: 'Podcast lover', side: 'left', x: 33, top: 52, size: 1.1, serif: true, tilt: -2 },
  ];
}
