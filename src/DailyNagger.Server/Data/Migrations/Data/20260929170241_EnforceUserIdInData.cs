using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DailyNagger.Server.Data.Migrations.Data
{
    /// <inheritdoc />
    public partial class EnforceUserIdInData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "user_id",
                table: "task_log",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "user_id",
                table: "task_item",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "user_id",
                table: "task_entry",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "user_id",
                table: "schedule_rule",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "user_id",
                table: "nag",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.Sql(
                """
                declare @martinUserId uniqueidentifier = '11111111-1111-1111-1111-111111111111';

                update nag
                set user_id = @martinUserId
                where user_id is null;

                update schedule_rule
                set user_id = @martinUserId
                where user_id is null;

                update task_log
                set user_id = @martinUserId
                where user_id is null;

                update task_item
                set user_id = @martinUserId
                where user_id is null;

                update task_entry
                set user_id = @martinUserId
                where user_id is null;
                """);

            migrationBuilder.AlterColumn<Guid>(
                name: "user_id",
                table: "task_log",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "user_id",
                table: "task_item",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "user_id",
                table: "task_entry",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "user_id",
                table: "schedule_rule",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "user_id",
                table: "nag",
                type: "uniqueidentifier",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_task_log_user_id_nag_id",
                table: "task_log",
                columns: new[] { "user_id", "nag_id" });

            migrationBuilder.CreateIndex(
                name: "IX_task_log_user_id_nag_id_closed_on_updated_at",
                table: "task_log",
                columns: new[] { "user_id", "nag_id", "closed_on", "updated_at" });

            migrationBuilder.CreateIndex(
                name: "IX_task_item_user_id_task_log_id",
                table: "task_item",
                columns: new[] { "user_id", "task_log_id" });

            migrationBuilder.CreateIndex(
                name: "IX_task_entry_user_id_task_log_id",
                table: "task_entry",
                columns: new[] { "user_id", "task_log_id" });

            migrationBuilder.CreateIndex(
                name: "IX_schedule_rule_user_id_nag_id",
                table: "schedule_rule",
                columns: new[] { "user_id", "nag_id" });

            migrationBuilder.CreateIndex(
                name: "IX_nag_user_id_is_deactivated_active_log_due_on",
                table: "nag",
                columns: new[] { "user_id", "is_deactivated", "active_log_due_on" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_task_log_user_id_nag_id",
                table: "task_log");

            migrationBuilder.DropIndex(
                name: "IX_task_log_user_id_nag_id_closed_on_updated_at",
                table: "task_log");

            migrationBuilder.DropIndex(
                name: "IX_task_item_user_id_task_log_id",
                table: "task_item");

            migrationBuilder.DropIndex(
                name: "IX_task_entry_user_id_task_log_id",
                table: "task_entry");

            migrationBuilder.DropIndex(
                name: "IX_schedule_rule_user_id_nag_id",
                table: "schedule_rule");

            migrationBuilder.DropIndex(
                name: "IX_nag_user_id_is_deactivated_active_log_due_on",
                table: "nag");

            migrationBuilder.DropColumn(
                name: "user_id",
                table: "task_log");

            migrationBuilder.DropColumn(
                name: "user_id",
                table: "task_item");

            migrationBuilder.DropColumn(
                name: "user_id",
                table: "task_entry");

            migrationBuilder.DropColumn(
                name: "user_id",
                table: "schedule_rule");

            migrationBuilder.DropColumn(
                name: "user_id",
                table: "nag");
        }
    }
}
