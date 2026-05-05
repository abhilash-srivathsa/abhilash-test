# abhilash-test
Testing + local setup

## Calculator audit log

This branch adds a small audit trail for calculator operations. The audit model
captures the action, actor, status, timestamp, and operation metadata, while the
service can filter events and roll up success/failure counts by action.

The `AuditedCalculator` wraps the existing calculator implementation and records
each operation with the requesting actor, operands, result, and failure reason.
This keeps arithmetic behavior separate from audit storage while giving callers
a single integration point for audited calculator workflows.
