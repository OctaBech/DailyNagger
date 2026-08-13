# Documentation

DailyNagger documentation is intentionally small and close to current work.

## Active Docs

- `adr/` contains accepted architecture and product direction decisions.

## Local READMEs

Important code folders can have a local `README.md` that explains the rules,
boundaries, and vocabulary for that part of the system.

Use top-level docs to explain direction. Use local READMEs to explain how to work
safely inside a specific folder.

## Documentation Boundaries

A local README should answer: "What do I need to know to work in this folder?"

Treat README files like code boundaries.

If every README explains the folders that call it, the docs become tangled in the
same way code does when every module knows too much about the rest of the app. A
small change in one area then forces cleanup in several docs, and readers have to
hold the whole system in their head before they can edit one folder.

That is the documentation domino we want to avoid.

A local README should stay local:

- why this folder exists
- what this folder owns
- what rules matter while editing files here
- what lower-level helpers this folder uses

It should not explain the folders that call it. Higher-level docs can explain
how pieces are wired together.

If another README owns a rule, link to it instead of repeating it. That keeps one
place responsible for changing the rule later.

## Local Archive

- `archive/` contains old notes and working documents.
- `archive/` is ignored by Git and is not repo truth.
- Use the archive as source material when writing small current docs.

## Rule

Prefer a short doc that answers one current question over a large doc that tries
to describe the whole project.
