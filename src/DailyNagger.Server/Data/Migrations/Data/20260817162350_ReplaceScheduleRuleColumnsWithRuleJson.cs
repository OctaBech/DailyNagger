using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DailyNagger.Server.Data.Migrations.Data
{
    /// <inheritdoc />
    public partial class ReplaceScheduleRuleColumnsWithRuleJson : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("delete from schedule_rule");

            migrationBuilder.DropColumn(
                name: "day",
                table: "schedule_rule");

            migrationBuilder.DropColumn(
                name: "month",
                table: "schedule_rule");

            migrationBuilder.DropColumn(
                name: "year",
                table: "schedule_rule");

            migrationBuilder.AddColumn<string>(
                name: "rule_json",
                table: "schedule_rule",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "{}");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "rule_json",
                table: "schedule_rule");

            migrationBuilder.AddColumn<int>(
                name: "day",
                table: "schedule_rule",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "month",
                table: "schedule_rule",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "year",
                table: "schedule_rule",
                type: "int",
                nullable: true);
        }
    }
}
