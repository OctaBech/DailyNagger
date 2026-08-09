use DailyNaggerControl;

if not exists (select 1 from user_profiles where Id = '11111111-1111-1111-1111-111111111111')
begin
    insert into user_profiles (Id, DisplayName, Birthday)
    values ('11111111-1111-1111-1111-111111111111', 'Martin', null);
end;

if not exists (select 1 from nag_communities where Id = '22222222-2222-2222-2222-222222222222')
begin
    insert into nag_communities (Id, Name, ConnectionStringTemplate, PasswordSecretName, is_deactivated)
    values
        (
            '22222222-2222-2222-2222-222222222222',
            'Privat',
            'Server=sqlserver,1433;Database=DailyNaggerData;User Id=DailyNaggerApp;Encrypt=True;TrustServerCertificate=True',
            null,
            0
        );
end;

if not exists (
    select 1
    from nag_community_members
    where NagCommunityId = '22222222-2222-2222-2222-222222222222'
      and UserId = '11111111-1111-1111-1111-111111111111'
)
begin
    insert into nag_community_members (NagCommunityId, UserId)
    values ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111');
end;
