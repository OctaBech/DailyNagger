using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DailyNagger.Server.Database.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class DropNaggerExpiresOn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "expires_on",
                table: "nag");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "expires_on",
                table: "nag",
                type: "date",
                nullable: true);
        }
    }
}
