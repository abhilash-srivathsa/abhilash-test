# abhilash-test
Testing + local setup

## Calculator audit log

This branch adds a small audit trail for calculator operations. The audit model
captures the action, actor, status, timestamp, and operation metadata, while the
service can filter events and roll up success/failure counts by action.
