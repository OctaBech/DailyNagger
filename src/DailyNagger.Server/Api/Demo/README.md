# Demo data API

- `POST /api/demo/data?communityId=<guid>&userId=<guid>` copies or overwrites template rows for that user.
- `DELETE /api/demo/data?communityId=<guid>&userId=<guid>` deletes ALL data for that user in the allowed tables.
- Both return 200 with an empty JSON object and use the existing bearer-token and request-id middleware.

The community is supplied by the client, as with other APIs. The endpoint checks
`nag_communities.is_demo` in the control database and only accepts active demo
communities. Unknown, deactivated or non-demo communities return 404. The new flag
defaults to false; explicitly mark the intended demo community after migration.
There is no `DemoData:CommunityId` or `DemoData:TemplateUserId` configuration.

The template user id is fixed in `DemoApi.TemplateUserId` and matches the mobile
demo editor identity. Both operations allow that identity too: self-copy writes
existing values back, while delete clears the template. Empty user ids are rejected.

The table allowlist lives in `Operations/Demo/DemoDataOperations.cs`. Columns and
primary keys are read from SQL metadata. Values are copied unchanged except for
user_id. Existing matching rows are overwritten, missing rows inserted and unrelated
user-created rows retained. Removed template rows are NOT pruned from old copies.
Computed/generated/identity/rowversion columns are excluded. Copy returns 409 when
the template has no tasks. Each operation uses one transaction with foreign keys enabled.

This is database scoping, not per-user authorization. The shared API token does not
prove ownership of a submitted userId. The editor's model-name check is only a UI
convenience. Client identity switches are immediate; queued writes may use the new
identity, as deliberately accepted for this demo tool.
