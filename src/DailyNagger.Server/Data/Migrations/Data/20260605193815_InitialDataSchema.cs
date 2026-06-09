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
                    schedule_updated_at = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    active_log_due_on = table.Column<DateOnly>(type: "date", nullable: true),
                    expires_on = table.Column<DateOnly>(type: "date", nullable: true),
                    is_deactivated = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    version = table.Column<int>(type: "int", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_nag", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "nag_input_unit_suggestion",
                columns: table => new
                {
                    user_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_nag_input_unit_suggestion", x => new { x.user_id, x.unit });
                });

            migrationBuilder.CreateTable(
                name: "nag_log",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    nag_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    copied_from_nag_log_id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    closed_on = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    updated_at = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    version = table.Column<int>(type: "int", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_nag_log", x => x.id);
                    table.CheckConstraint(
                        "ck_nag_log_updated_at_not_default",
                        "updated_at > '0001-01-01T00:00:00+00:00'");
                    table.ForeignKey(
                        name: "FK_nag_log_nag_nag_id",
                        column: x => x.nag_id,
                        principalTable: "nag",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "nag_time",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    nag_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    time_type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    day_of_week = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    day_of_month = table.Column<int>(type: "int", nullable: true),
                    month_of_year = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_nag_time", x => x.id);
                    table.ForeignKey(
                        name: "FK_nag_time_nag_nag_id",
                        column: x => x.nag_id,
                        principalTable: "nag",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "nag_node",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    nag_log_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    parent_nag_node_id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    sort_order = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_nag_node", x => x.id);
                    table.ForeignKey(
                        name: "FK_nag_node_nag_log_nag_log_id",
                        column: x => x.nag_log_id,
                        principalTable: "nag_log",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_nag_node_nag_node_parent_nag_node_id",
                        column: x => x.parent_nag_node_id,
                        principalTable: "nag_node",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "nag_input",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    nag_log_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    parent_nag_node_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    label = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    value_type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    value = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    previous_value = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    sort_order = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_nag_input", x => x.id);
                    table.ForeignKey(
                        name: "FK_nag_input_nag_log_nag_log_id",
                        column: x => x.nag_log_id,
                        principalTable: "nag_log",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_nag_input_nag_node_parent_nag_node_id",
                        column: x => x.parent_nag_node_id,
                        principalTable: "nag_node",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_nag_input_nag_log_id",
                table: "nag_input",
                column: "nag_log_id");

            migrationBuilder.CreateIndex(
                name: "IX_nag_input_parent_nag_node_id",
                table: "nag_input",
                column: "parent_nag_node_id");

            migrationBuilder.CreateIndex(
                name: "IX_nag_is_deactivated_active_log_due_on",
                table: "nag",
                columns: new[] { "is_deactivated", "active_log_due_on" });

            migrationBuilder.CreateIndex(
                name: "IX_nag_log_copied_from_nag_log_id",
                table: "nag_log",
                column: "copied_from_nag_log_id");

            migrationBuilder.CreateIndex(
                name: "IX_nag_log_nag_id_closed_on_updated_at",
                table: "nag_log",
                columns: new[] { "nag_id", "closed_on", "updated_at" });

            migrationBuilder.CreateIndex(
                name: "IX_nag_log_nag_id",
                table: "nag_log",
                column: "nag_id");

            migrationBuilder.CreateIndex(
                name: "IX_nag_node_nag_log_id",
                table: "nag_node",
                column: "nag_log_id");

            migrationBuilder.CreateIndex(
                name: "IX_nag_node_parent_nag_node_id",
                table: "nag_node",
                column: "parent_nag_node_id");

            migrationBuilder.CreateIndex(
                name: "IX_nag_time_nag_id",
                table: "nag_time",
                column: "nag_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "nag_input");

            migrationBuilder.DropTable(
                name: "nag_input_unit_suggestion");

            migrationBuilder.DropTable(
                name: "nag_time");

            migrationBuilder.DropTable(
                name: "nag_node");

            migrationBuilder.DropTable(
                name: "nag_log");

            migrationBuilder.DropTable(
                name: "nag");
        }
    }
}
