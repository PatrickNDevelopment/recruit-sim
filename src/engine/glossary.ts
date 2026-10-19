/** Glossary. Plain-language practice definitions; laws differ by jurisdiction and none of this is legal advice. */

export interface Term {
  id: string;
  term: string;
  definition: string;
}

export const GLOSSARY: Term[] = [
  {
    id: 'claim-verification',
    term: 'Claim verification',
    definition:
      'Checking a candidate’s statements (titles, team sizes, certifications, dates) with documents, issuers or references before presenting them as fact. Unverified claims should be labelled as such.',
  },
  {
    id: 'consent-to-submit',
    term: 'Consent to submit',
    definition:
      'A candidate’s specific, informed and freely given permission to send their CV to a named client for a named role. Silence, a general interest in “opportunities” or agreement under pressure is not consent.',
  },
  {
    id: 'contingency-fee',
    term: 'Contingency fee',
    definition:
      'A fee paid to the agency only if a candidate it introduced is hired, usually a percentage of first-year salary.',
  },
  {
    id: 'discovery-call',
    term: 'Discovery call',
    definition:
      'The first detailed conversation with a hiring client about the role, the team, how the decision will be made, pay and the terms of working together.',
  },
  {
    id: 'escalation',
    term: 'Escalation',
    definition:
      'Bringing a matter to someone with the authority or expertise to handle it: your manager for a discriminatory request, a lawyer for a legal question, the client for a missing approval.',
  },
  {
    id: 'exclusivity',
    term: 'Exclusivity',
    definition:
      'An agreement that only one agency works on a role for a period. It affects how much effort an agency can reasonably invest.',
  },
  {
    id: 'must-haves',
    term: 'Must-haves and nice-to-haves',
    definition:
      'The requirements a hire needs on day one, separated from those that are preferred or can be learned. Ranking them turns a wish list into a searchable brief.',
  },
  {
    id: 'protected-characteristics',
    term: 'Protected characteristics',
    definition:
      'Personal attributes such as age, sex, race, religion, disability, pregnancy or family status that many laws forbid using in hiring decisions. The exact list differs by jurisdiction.',
  },
  {
    id: 'replacement-guarantee',
    term: 'Replacement guarantee',
    definition:
      'A term promising a replacement search or partial refund if a placed hire leaves within an agreed period.',
  },
  {
    id: 'restrictive-covenant',
    term: 'Restrictive covenant (non-compete)',
    definition:
      'A contract clause limiting where someone may work after leaving. Whether it applies is a legal question for a lawyer, not for a recruiter.',
  },
  {
    id: 'right-to-represent',
    term: 'Right to represent',
    definition:
      'A candidate’s confirmation that this agency, and no other, may put them forward for a specific role. It avoids duplicate submissions.',
  },
  {
    id: 'salary-band',
    term: 'Approved pay range',
    definition:
      'The range the employer has actually approved for a role. Any other figure is a guess and should not be presented as the salary.',
  },
  {
    id: 'salary-history',
    term: 'Salary history',
    definition:
      'A candidate’s current or past pay. Candidates may decline to share it, and some places restrict asking. Expectations are usually what a recruiter needs.',
  },
  {
    id: 'screening-call',
    term: 'Screening call',
    definition:
      'A conversation with a candidate to understand fit, motivation, pay expectations and constraints, and to agree whether and how they will be put forward.',
  },
  {
    id: 'terms-of-business',
    term: 'Terms of business',
    definition:
      'The written agreement between an agency and a client: fee, payment timing, exclusivity, replacement guarantee and what counts as an introduction.',
  },
];

export function term(id: string): Term | undefined {
  return GLOSSARY.find((t) => t.id === id);
}
