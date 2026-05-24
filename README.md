# abhilash-test
Testing + local setup

## User engagement workflow

The repository includes a small in-memory user service and API client for testing
review flows. The engagement workflow composes those pieces so callers can:

- create a local user profile with engagement preferences
- optionally sync the signup request to the remote API
- activate pending users once they meet product-update eligibility
- update local preferences and mirror them to the API client when configured
