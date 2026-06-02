declare @user_id uniqueidentifier = '11111111-1111-1111-1111-111111111111';
declare @community_id uniqueidentifier = '22222222-2222-2222-2222-222222222222';

if not exists (select 1 from user_profiles where Id = @user_id)
begin
    insert into user_profiles (Id, DisplayName, Birthday)
    values (@user_id, 'Martin', null);
end

if not exists (select 1 from nag_communities where Id = @community_id)
begin
    insert into nag_communities (Id, Name, ConnectionStringTemplate, PasswordSecretName)
    values (
        @community_id,
        'Privat',
        'Server=localhost,1433;Database=DailyNaggerData;User Id=sa;TrustServerCertificate=True',
        null
    );
end

if not exists (
    select 1
    from nag_community_members
    where NagCommunityId = @community_id
      and UserId = @user_id
)
begin
    insert into nag_community_members (NagCommunityId, UserId)
    values (@community_id, @user_id);
end
