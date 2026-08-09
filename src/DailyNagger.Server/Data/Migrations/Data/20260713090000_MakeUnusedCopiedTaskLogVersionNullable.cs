using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DailyNagger.Server.Data.Migrations.Data
{
    /// <inheritdoc />
    [DbContext(typeof(DailyNaggerDbContext))]
    [Migration("20260713090000_MakeUnusedCopiedTaskLogVersionNullable")]
    public partial class MakeUnusedCopiedTaskLogVersionNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                update task_log
                set version = 0
                where version is null
                """);

            migrationBuilder.AlterColumn<int>(
                name: "version",
                table: "task_log",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
