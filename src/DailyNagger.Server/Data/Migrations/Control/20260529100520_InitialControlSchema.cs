using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DailyNagger.Server.Data.Migrations.Control
{
    /// <inheritdoc />
    public partial class InitialControlSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "debug_log_targets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AppInstanceId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    UserId = table.Column<string>(type: "nvarchar(64)", maxLength: 64, nullable: true),
                    MinimumLevel = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_debug_log_targets", x => x.Id);
                    table.CheckConstraint("CK_debug_log_targets_TargetRequired", "AppInstanceId IS NOT NULL OR UserId IS NOT NULL");
                });

            migrationBuilder.CreateIndex(
                name: "IX_debug_log_targets_AppInstanceId",
                table: "debug_log_targets",
                column: "AppInstanceId");

            migrationBuilder.CreateIndex(
                name: "IX_debug_log_targets_ExpiresAt",
                table: "debug_log_targets",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_debug_log_targets_UserId",
                table: "debug_log_targets",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "debug_log_targets");
        }
    }
}
