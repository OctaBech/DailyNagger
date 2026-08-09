using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DailyNagger.Server.Data.Migrations.Data
{
    /// <inheritdoc />
    public partial class DropScheduleUpdatedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                if col_length('nag', 'schedule_updated_at') is not null
                begin
                    alter table nag drop column schedule_updated_at
                end
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                if col_length('nag', 'schedule_updated_at') is null
                begin
                    alter table nag add schedule_updated_at datetimeoffset not null default sysutcdatetime()
                end
                """);
        }
    }
}
