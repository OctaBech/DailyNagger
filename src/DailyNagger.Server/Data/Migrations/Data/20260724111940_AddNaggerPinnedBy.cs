using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DailyNagger.Server.Data.Migrations.Data
{
    /// <inheritdoc />
    public partial class AddNaggerPinnedBy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "pinned_by",
                table: "nag",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "None");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "pinned_by",
                table: "nag");
        }
    }
}
