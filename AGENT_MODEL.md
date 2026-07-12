# Nexa Model Naming Guide

Nexa model releases must use Nexa-owned public model names. Do not expose the
upstream base model name in product UI, admin dashboards, public docs, marketing
pages, release notes, or customer-facing API descriptions.

## Current Naming Sequence

Use this sequence for Nexa model versioning unless a newer approved sequence is
added to this file:

1. Ember 0.5
2. Ember 1.0
3. Ember 1.5
4. Nova 2.0
5. Apex 3

## Rules For Agents

- Treat the Nexa model name as the product identity.
- Use the approved Nexa model name in admin pages, public pages, docs, API
  labels, billing plan copy, and release notes.
- Do not show upstream model names such as local checkpoint names, research
  model names, provider names, or training base names in customer-facing text.
- Keep upstream model details only in private runtime configuration, internal
  deployment notes, or restricted engineering diagnostics when needed.
- When a new model is introduced, add it to the sequence above before using it
  elsewhere in the product.
- If a model is experimental, label it with the Nexa name plus a clear status,
  for example `Ember 1.0 Experimental`.
- If replacing a model, keep historical usage under the old Nexa name so
  metrics remain understandable.

## Current Production Model

The active Nexa text/chat model should be presented as:

`Ember 0.5`

Use `Ember 0.5` for the first production Nexa model version across the product.
