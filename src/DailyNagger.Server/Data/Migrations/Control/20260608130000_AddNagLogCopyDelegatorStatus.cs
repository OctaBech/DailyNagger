using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DailyNagger.Server.Data.Migrations.Control
{
    [DbContext(typeof(DailyNaggerControlDbContext))]
    [Migration("20260608130000_AddNagLogCopyDelegatorStatus")]
    public partial class AddNagLogCopyDelegatorStatus : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "nag_log_copy_delegator_status",
                columns: table => new
                {
                    delegator_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    delegator_name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    community_id = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    status = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    started_at = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    last_seen_at = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    stopped_at = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    last_error_at = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    last_run_started_at = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    last_run_finished_at = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    last_run_duration_ms = table.Column<long>(type: "bigint", nullable: false),
                    last_run_max_parallelism = table.Column<int>(type: "int", nullable: false),
                    total_run_count = table.Column<long>(type: "bigint", nullable: false),
                    total_copied_count = table.Column<long>(type: "bigint", nullable: false),
                    total_stale_count = table.Column<long>(type: "bigint", nullable: false),
                    total_no_future_occurrence_count = table.Column<long>(type: "bigint", nullable: false),
                    total_no_open_log_count = table.Column<long>(type: "bigint", nullable: false),
                    total_error_count = table.Column<long>(type: "bigint", nullable: false),
                    error_count_since_last_snapshot = table.Column<long>(type: "bigint", nullable: false),
                    total_db_duration_ms = table.Column<long>(type: "bigint", nullable: false),
                    total_processing_duration_ms = table.Column<long>(type: "bigint", nullable: false),
                    max_db_duration_ms = table.Column<long>(type: "bigint", nullable: false),
                    max_processing_duration_ms = table.Column<long>(type: "bigint", nullable: false),
                    last_db_duration_ms = table.Column<long>(type: "bigint", nullable: false),
                    last_processing_duration_ms = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_nag_log_copy_delegator_status", x => x.delegator_id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_nag_log_copy_delegator_status_last_seen_at",
                table: "nag_log_copy_delegator_status",
                column: "last_seen_at");

            migrationBuilder.CreateIndex(
                name: "IX_nag_log_copy_delegator_status_status",
                table: "nag_log_copy_delegator_status",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_nag_log_copy_delegator_status_community_id",
                table: "nag_log_copy_delegator_status",
                column: "community_id");

            migrationBuilder.CreateIndex(
                name: "IX_nag_log_copy_delegator_status_delegator_name",
                table: "nag_log_copy_delegator_status",
                column: "delegator_name");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "nag_log_copy_delegator_status");
        }
    }
}
