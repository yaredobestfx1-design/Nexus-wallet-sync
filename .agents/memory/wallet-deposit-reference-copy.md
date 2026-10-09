---
name: Wallet deposit reference copy
description: User chose demo-only deposits; the page must not imply live OxaPay checkout.
---

The user chose to keep the wallet in demo mode, remove payment screenshot and TXID inputs, and disable deposits. There is no live OxaPay checkout, and a disabled deposit must not change the demo balance.

**Why:** The user declined converting the wallet to authenticated, server-managed balances and chose to disable deposits instead.

**How to apply:** Keep the existing demo balance and other wallet behavior unchanged. Do not display OxaPay, minimum, fee, or payment-confirmation claims as active checkout facts unless the user later enables a real verified payment flow.
