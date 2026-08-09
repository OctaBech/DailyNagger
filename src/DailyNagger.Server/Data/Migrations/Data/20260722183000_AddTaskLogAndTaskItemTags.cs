using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DailyNagger.Server.Data.Migrations.Data
{
    [DbContext(typeof(DailyNaggerDbContext))]
    [Migration("20260722183000_AddTaskLogAndTaskItemTags")]
    public partial class AddTaskLogAndTaskItemTags : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "tag",
                table: "task_log",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "tag",
                table: "task_item",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "tag",
                table: "task_log");

            migrationBuilder.DropColumn(
                name: "tag",
                table: "task_item");
        }
    }
}
