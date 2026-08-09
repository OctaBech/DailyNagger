using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DailyNagger.Server.Data.Migrations.Data
{
    /// <inheritdoc />
    [DbContext(typeof(DailyNaggerDbContext))]
    [Migration("20260715090000_AddUserTags")]
    public partial class AddUserTags : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "description",
                table: "task_entry_unit_suggestion",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "last_used_at",
                table: "task_entry_unit_suggestion",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.DropPrimaryKey(
                name: "PK_task_entry_unit_suggestion",
                table: "task_entry_unit_suggestion");

            migrationBuilder.RenameTable(
                name: "task_entry_unit_suggestion",
                newName: "user_tag");

            migrationBuilder.RenameColumn(
                name: "unit",
                table: "user_tag",
                newName: "name");

            migrationBuilder.AddColumn<string>(
                name: "tag_type",
                table: "user_tag",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "task-entry-unit");

            migrationBuilder.AddPrimaryKey(
                name: "PK_user_tag",
                table: "user_tag",
                columns: ["user_id", "tag_type", "name"]);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_user_tag",
                table: "user_tag");

            migrationBuilder.DropColumn(
                name: "tag_type",
                table: "user_tag");

            migrationBuilder.RenameColumn(
                name: "name",
                table: "user_tag",
                newName: "unit");

            migrationBuilder.RenameTable(
                name: "user_tag",
                newName: "task_entry_unit_suggestion");

            migrationBuilder.AddPrimaryKey(
                name: "PK_task_entry_unit_suggestion",
                table: "task_entry_unit_suggestion",
                columns: ["user_id", "unit"]);

            migrationBuilder.DropColumn(
                name: "description",
                table: "task_entry_unit_suggestion");

            migrationBuilder.DropColumn(
                name: "last_used_at",
                table: "task_entry_unit_suggestion");
        }
    }
}
