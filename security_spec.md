# Security Specification for Firestore Rules

## 1. Data Invariants
- `date` must be a valid ISO date string matching `^[0-9]{4}-[0-9]{2}-[0-9]{2}$` and max 10 characters.
- Document ID `{date}` must match `^[0-9]{4}-[0-9]{2}-[0-9]{2}$`.
- `leadsReceived`, `qualifiedLeads`, `onboardedLeads` must be non-negative numbers.
- `quality` must be one of `['Poor', 'Fair', 'Good', 'Excellent']`.
- `receivedNotes`, `qualifiedNotes`, `onboardedNotes` must be strings and within safe size boundaries (max 10000 chars).
- `qualifiedProofs` and `onboardedProofs` must be lists bounded to at most 50 items.
- Inbound write operations cannot contain unapproved arbitrary keys.

## 2. The Dirty Dozen Payloads (Designed to Fail)
1. Missing `date` field.
2. Negative `leadsReceived` (-5).
3. Invalid `quality` value ("Awesome").
4. Non-string `receivedNotes` ({ hack: true }).
5. Unbounded oversized string payload (>10,000 characters).
6. Array overflow (>50 proofs).
7. Invalid date pattern ID ("2026/09/16" or "abc-date").
8. Extra injection keys (e.g. `__role: 'admin'`).
9. String value instead of number for `qualifiedLeads` ("10").
10. Negative `onboardedLeads` (-1).
11. Malformed date format ("2026-9-1").
12. Attempting to write into an unmapped path (e.g., `/admin_secrets/leak`).
