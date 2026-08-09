using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DailyNagger.Server.Data.Migrations.Data
{
    /// <inheritdoc />
    public partial class AddInteractionStamps : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "interaction_at",
                table: "task_item",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "interaction_locale",
                table: "task_item",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "interaction_mood",
                table: "task_item",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "interaction_mood_at",
                table: "task_item",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "interaction_time_zone",
                table: "task_item",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "interaction_at",
                table: "task_entry",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "interaction_locale",
                table: "task_entry",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "interaction_mood",
                table: "task_entry",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "interaction_mood_at",
                table: "task_entry",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "interaction_time_zone",
                table: "task_entry",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "interaction_at",
                table: "task_item");

            migrationBuilder.DropColumn(
                name: "interaction_locale",
                table: "task_item");

            migrationBuilder.DropColumn(
                name: "interaction_mood",
                table: "task_item");

            migrationBuilder.DropColumn(
                name: "interaction_mood_at",
                table: "task_item");

            migrationBuilder.DropColumn(
                name: "interaction_time_zone",
                table: "task_item");

            migrationBuilder.DropColumn(
                name: "interaction_at",
                table: "task_entry");

            migrationBuilder.DropColumn(
                name: "interaction_locale",
                table: "task_entry");

            migrationBuilder.DropColumn(
                name: "interaction_mood",
                table: "task_entry");

            migrationBuilder.DropColumn(
                name: "interaction_mood_at",
                table: "task_entry");

            migrationBuilder.DropColumn(
                name: "interaction_time_zone",
                table: "task_entry");
        }
    }
}
