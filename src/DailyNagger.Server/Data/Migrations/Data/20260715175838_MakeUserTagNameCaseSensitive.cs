using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DailyNagger.Server.Data.Migrations.Data
{
    /// <inheritdoc />
    public partial class MakeUserTagNameCaseSensitive : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_user_tag",
                table: "user_tag");

            migrationBuilder.AlterColumn<string>(
                name: "name",
                table: "user_tag",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                collation: "Latin1_General_100_CS_AS",
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.AddPrimaryKey(
                name: "PK_user_tag",
                table: "user_tag",
                columns: ["user_id", "tag_type", "name"]);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_user_tag",
                table: "user_tag");

            migrationBuilder.AlterColumn<string>(
                name: "name",
                table: "user_tag",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50,
                oldCollation: "Latin1_General_100_CS_AS");

            migrationBuilder.AddPrimaryKey(
                name: "PK_user_tag",
                table: "user_tag",
                columns: ["user_id", "tag_type", "name"]);
        }
    }
}
