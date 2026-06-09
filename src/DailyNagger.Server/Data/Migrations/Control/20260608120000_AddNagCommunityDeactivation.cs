using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DailyNagger.Server.Data.Migrations.Control
{
    [DbContext(typeof(DailyNaggerControlDbContext))]
    [Migration("20260608120000_AddNagCommunityDeactivation")]
    public partial class AddNagCommunityDeactivation : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_deactivated",
                table: "nag_communities",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "is_deactivated",
                table: "nag_communities");
        }
    }
}
