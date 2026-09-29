use DailyNaggerControl;

delete from nag_community_members;
delete from nag_communities;
delete from user_profiles;

insert into user_profiles (Id, DisplayName, Birthday)
values
    ('11111111-1111-1111-1111-111111111111', 'Martin', null);

insert into nag_communities (Id, Name, ConnectionStringTemplate, PasswordSecretName, is_deactivated)
values
    (
        '22222222-2222-2222-2222-222222222222',
        'Privat',
        'Server=sqlserver,1433;Database=DailyNaggerData;User Id=DailyNaggerApp;Encrypt=True;TrustServerCertificate=True',
        null,
        0
    );

insert into nag_community_members (NagCommunityId, UserId)
values
    ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111');

use DailyNaggerData;

delete from task_entry;
delete from task_item;
delete from schedule_rule;
delete from task_log;
delete from user_tag;
delete from nag;

insert into user_tag (user_id, tag_type, name, description, last_used_at)
values
    ('11111111-1111-1111-1111-111111111111', 'task-entry-unit', 'kg', null, sysdatetimeoffset()),
    ('11111111-1111-1111-1111-111111111111', 'task-entry-unit', 'min', null, sysdatetimeoffset()),
    ('11111111-1111-1111-1111-111111111111', 'task-entry-unit', 'pcs', null, sysdatetimeoffset());
