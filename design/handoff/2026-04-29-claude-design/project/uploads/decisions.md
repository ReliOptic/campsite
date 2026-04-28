# Decisions - Campsite

## [2026-03-20] Product scope starts at the static contract layer

- Context: The workspace problem can be attacked either as a heavy orchestration platform or a lightweight persistent filesystem contract.
- Options considered: shell-first contract layer, full GUI workspace manager, runtime orchestration platform.
- Chosen: shell-first static contract layer.
- Rationale: durable context is the missing primitive, and it must survive across devices, sessions, and tool changes.
- Revisit if: users consistently need background daemons, live coordination, or GUI-native control surfaces.

## [2026-03-20] Ghostty is an execution surface, not the system core

- Context: There was a risk of overfitting the product to a single terminal implementation.
- Options considered: Ghostty-specific product, generic terminal-first product, full IDE integration.
- Chosen: generic terminal-first product with optional Ghostty-friendly tooling.
- Rationale: the contract must remain portable across Mac, PC, cloud shells, and future terminals.
- Revisit if: Ghostty exposes a stable automation surface that materially improves the workflow without reducing portability.

