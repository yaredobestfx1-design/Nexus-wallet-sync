---
name: Special-account Wallet display rule
description: User-stated account-specific display behavior for special-email Wallet accounts.
---

The normal and special-email Wallet accounts use the same overall layout. The special withdrawal notice and its history row should appear only in the special-account flow.

**Why:** The user specified this account-display rule as part of the Wallet layout requirements.

**How to apply:** Keep the shared page layout consistent. Gate only the special notice and history row to the special-account flow; if the account predicate is missing, ask which account criterion identifies it rather than inventing one.
