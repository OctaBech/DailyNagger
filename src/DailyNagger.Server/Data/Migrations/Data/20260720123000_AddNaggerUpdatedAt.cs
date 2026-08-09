using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DailyNagger.Server.Data.Migrations.Data;

[DbContext(typeof(DailyNaggerDbContext))]
[Migration("20260720123000_AddNaggerUpdatedAt")]
public partial class AddNaggerUpdatedAt : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            if col_length('nag', 'updated_at') is null
            begin
                alter table nag add updated_at datetimeoffset not null constraint DF_nag_updated_at default sysutcdatetime()
                alter table nag drop constraint DF_nag_updated_at
            end
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            """
            if col_length('nag', 'updated_at') is not null
            begin
                alter table nag drop column updated_at
            end
            """);
    }
}
