using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DailyNagger.Server.Database.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class AddNaggerTargetTime : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<TimeOnly>(
                name: "target_time",
                table: "nag",
                type: "time",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "target_time",
                table: "nag");
        }
    }
}
