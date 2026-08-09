using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DailyNagger.Server.Data.Migrations.Data
{
    /// <inheritdoc />
    public partial class InitialDataSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "nag",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    active_log_due_on = table.Column<DateOnly>(type: "date", nullable: true),
                    expires_on = table.Column<DateOnly>(type: "date", nullable: true),
                    is_deactivated = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    updated_at = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    updated_by_client_id = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    updated_by_device_name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    updated_by_device_model = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    version = table.Column<int>(type: "int", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_nag", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "task_entry_unit_suggestion",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_task_entry_unit_suggestion", x => new { x.user_id, x.unit });
                });

            migrationBuilder.CreateTable(
                name: "task_log",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    nag_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    copied_from_task_log_id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    closed_on = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    updated_by_client_id = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    updated_by_device_name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    updated_by_device_model = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    version = table.Column<int>(type: "int", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_task_log", x => x.id);
                    table.CheckConstraint(
                        "ck_task_log_updated_at_not_default",
                        "updated_at > '0001-01-01T00:00:00+00:00'");
                    table.ForeignKey(
                        name: "FK_task_log_nag_nag_id",
                        column: x => x.nag_id,
                        principalTable: "nag",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "schedule_rule",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    nag_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    rule_type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    day = table.Column<int>(type: "int", nullable: true),
                    month = table.Column<int>(type: "int", nullable: true),
                    year = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_schedule_rule", x => x.id);
                    table.ForeignKey(
                        name: "FK_schedule_rule_nag_nag_id",
                        column: x => x.nag_id,
                        principalTable: "nag",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "task_item",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    task_log_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    parent_task_item_id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    sort_order = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_task_item", x => x.id);
                    table.ForeignKey(
                        name: "FK_task_item_task_log_task_log_id",
                        column: x => x.task_log_id,
                        principalTable: "task_log",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_task_item_task_item_parent_task_item_id",
                        column: x => x.parent_task_item_id,
                        principalTable: "task_item",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "task_entry",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    task_log_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    parent_task_item_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    label = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    value_type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    value = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    last_task_run_reference_value = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    sort_order = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_task_entry", x => x.id);
                    table.ForeignKey(
                        name: "FK_task_entry_task_log_task_log_id",
                        column: x => x.task_log_id,
                        principalTable: "task_log",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_task_entry_task_item_parent_task_item_id",
                        column: x => x.parent_task_item_id,
                        principalTable: "task_item",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_task_entry_task_log_id",
                table: "task_entry",
                column: "task_log_id");

            migrationBuilder.CreateIndex(
                name: "IX_task_entry_parent_task_item_id",
                table: "task_entry",
                column: "parent_task_item_id");

            migrationBuilder.CreateIndex(
                name: "IX_nag_is_deactivated_active_log_due_on",
                table: "nag",
                columns: new[] { "is_deactivated", "active_log_due_on" });

            migrationBuilder.CreateIndex(
                name: "IX_task_log_copied_from_task_log_id",
                table: "task_log",
                column: "copied_from_task_log_id");

            migrationBuilder.CreateIndex(
                name: "IX_task_log_nag_id_closed_on_updated_at",
                table: "task_log",
                columns: new[] { "nag_id", "closed_on", "updated_at" });

            migrationBuilder.CreateIndex(
                name: "IX_task_log_nag_id",
                table: "task_log",
                column: "nag_id");

            migrationBuilder.CreateIndex(
                name: "IX_task_item_task_log_id",
                table: "task_item",
                column: "task_log_id");

            migrationBuilder.CreateIndex(
                name: "IX_task_item_parent_task_item_id",
                table: "task_item",
                column: "parent_task_item_id");

            migrationBuilder.CreateIndex(
                name: "IX_schedule_rule_nag_id",
                table: "schedule_rule",
                column: "nag_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "task_entry");

            migrationBuilder.DropTable(
                name: "task_entry_unit_suggestion");

            migrationBuilder.DropTable(
                name: "schedule_rule");

            migrationBuilder.DropTable(
                name: "task_item");

            migrationBuilder.DropTable(
                name: "task_log");

            migrationBuilder.DropTable(
                name: "nag");
        }
    }
}
