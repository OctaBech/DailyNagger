using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DailyNagger.Server.Data.Migrations.Data
{
    /// <inheritdoc />
    public partial class AddTaskProgressCounters : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "descendant_task_item_count",
                table: "task_log",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "done_descendant_task_item_count",
                table: "task_log",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "descendant_task_item_count",
                table: "task_item",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "done_descendant_task_item_count",
                table: "task_item",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "is_done",
                table: "task_item",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "descendant_task_item_count",
                table: "task_log");

            migrationBuilder.DropColumn(
                name: "done_descendant_task_item_count",
                table: "task_log");

            migrationBuilder.DropColumn(
                name: "descendant_task_item_count",
                table: "task_item");

            migrationBuilder.DropColumn(
                name: "done_descendant_task_item_count",
                table: "task_item");

            migrationBuilder.DropColumn(
                name: "is_done",
                table: "task_item");
        }
    }
}
