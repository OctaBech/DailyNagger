using DailyNagger.Server.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DailyNagger.Server.Data.Migrations.Data
{
    [DbContext(typeof(DailyNaggerDbContext))]
    [Migration("20260729153000_AddTaskRolloverBehavior")]
    public partial class AddTaskRolloverBehavior : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "rollover_behavior",
                table: "task_item",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Keep");

            migrationBuilder.AddColumn<string>(
                name: "rollover_behavior",
                table: "task_entry",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Keep");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "rollover_behavior",
                table: "task_item");

            migrationBuilder.DropColumn(
                name: "rollover_behavior",
                table: "task_entry");
        }
    }
}
