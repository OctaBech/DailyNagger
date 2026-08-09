using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DailyNagger.Server.Data.Migrations.Data;

[DbContext(typeof(DailyNaggerDbContext))]
[Migration("20260720124500_AddUpdatedByClientIdentity")]
public partial class AddUpdatedByClientIdentity : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        AddColumnIfMissing(migrationBuilder, "nag", "updated_by_client_id", "nvarchar(100)");
        AddColumnIfMissing(migrationBuilder, "nag", "updated_by_device_name", "nvarchar(200)");
        AddColumnIfMissing(migrationBuilder, "nag", "updated_by_device_model", "nvarchar(200)");
        AddColumnIfMissing(migrationBuilder, "task_log", "updated_by_client_id", "nvarchar(100)");
        AddColumnIfMissing(migrationBuilder, "task_log", "updated_by_device_name", "nvarchar(200)");
        AddColumnIfMissing(migrationBuilder, "task_log", "updated_by_device_model", "nvarchar(200)");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        DropColumnIfExists(migrationBuilder, "task_log", "updated_by_device_model");
        DropColumnIfExists(migrationBuilder, "task_log", "updated_by_device_name");
        DropColumnIfExists(migrationBuilder, "task_log", "updated_by_client_id");
        DropColumnIfExists(migrationBuilder, "nag", "updated_by_device_model");
        DropColumnIfExists(migrationBuilder, "nag", "updated_by_device_name");
        DropColumnIfExists(migrationBuilder, "nag", "updated_by_client_id");
    }

    private static void AddColumnIfMissing(
        MigrationBuilder migrationBuilder,
        string table,
        string column,
        string sqlType)
    {
        migrationBuilder.Sql($"""
            if col_length('{table}', '{column}') is null
            begin
                alter table {table} add {column} {sqlType} null
            end
            """);
    }

    private static void DropColumnIfExists(
        MigrationBuilder migrationBuilder,
        string table,
        string column)
    {
        migrationBuilder.Sql($"""
            if col_length('{table}', '{column}') is not null
            begin
                alter table {table} drop column {column}
            end
            """);
    }
}
