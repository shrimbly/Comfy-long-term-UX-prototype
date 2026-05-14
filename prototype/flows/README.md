# Flow plans

One markdown file per flow being prototyped, named `<NN>-<slug>.md` (zero-padded order, kebab-case slug).

Each file describes:

- **Actor** — which persona(s) execute this flow (link `../IA_Plan/wiki/concepts/personas-and-flows.md`)
- **Entry point** — where the user is when this starts (URL, screen)
- **Step-by-step** — numbered steps; include UI affordances
- **Branches / decision points** — what differs by persona, role, or state
- **Surfaces touched** — sidebar, library, members, settings, billing, etc.
- **Edge cases** — what happens when X is unavailable / Y has no items / etc.
- **Fixture state required** — what the persona's mock data needs to demonstrate this flow
- **Wiki cross-refs** — every wiki entry the flow implements / depends on
- **Open questions surfaced** — design choices that need a wiki decision later

Plans are not specs — keep them tight enough to be useful as you build, not so detailed they become the spec.
