using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DailyNagger.Server.Database.Migrations.Tenant
{
    /// <inheritdoc />
    public partial class ScopeNodeKeysByUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            LockNodeTables(migrationBuilder);

            // Validate before dropping any constraints. Never repair ownership implicitly.
            foreach (var (table, column, principal) in new[]
            {
                ("schedule_rule", "nag_id", "nag"),
                ("task_log", "nag_id", "nag"),
                ("task_item", "task_log_id", "task_log"),
                ("task_item", "parent_task_item_id", "task_item"),
                ("task_entry", "parent_task_item_id", "task_item"),
                ("task_entry", "task_log_id", "task_log")
            })
            {
                migrationBuilder.Sql($"""
                    if exists (
                        select 1 from [{table}] dependent
                        where dependent.[{column}] is not null
                            and not exists (
                                select 1 from [{principal}] principal
                                where principal.id = dependent.[{column}]
                                    and principal.user_id = dependent.user_id
                            )
                    )
                        throw 51000, 'ScopeNodeKeysByUser: {table}.{column} has a missing parent or mismatched UserId. No data was changed.', 1;
                    """);
            }

            migrationBuilder.DropForeignKey(
                name: "FK_schedule_rule_nag_nag_id",
                table: "schedule_rule");

            migrationBuilder.DropForeignKey(
                name: "FK_task_entry_task_item_parent_task_item_id",
                table: "task_entry");

            migrationBuilder.DropForeignKey(
                name: "FK_task_entry_task_log_task_log_id",
                table: "task_entry");

            migrationBuilder.DropForeignKey(
                name: "FK_task_item_task_item_parent_task_item_id",
                table: "task_item");

            migrationBuilder.DropForeignKey(
                name: "FK_task_item_task_log_task_log_id",
                table: "task_item");

            migrationBuilder.DropForeignKey(
                name: "FK_task_log_nag_nag_id",
                table: "task_log");

            migrationBuilder.DropPrimaryKey(
                name: "PK_user_mood",
                table: "user_mood");

            migrationBuilder.DropPrimaryKey(
                name: "PK_task_log",
                table: "task_log");

            migrationBuilder.DropPrimaryKey(
                name: "PK_task_item",
                table: "task_item");

            migrationBuilder.DropPrimaryKey(
                name: "PK_task_entry",
                table: "task_entry");

            migrationBuilder.DropPrimaryKey(
                name: "PK_schedule_rule",
                table: "schedule_rule");

            migrationBuilder.DropPrimaryKey(
                name: "PK_nag",
                table: "nag");

            migrationBuilder.AddPrimaryKey(
                name: "PK_user_mood",
                table: "user_mood",
                columns: new[] { "user_id", "id" });

            migrationBuilder.AddPrimaryKey(
                name: "PK_task_log",
                table: "task_log",
                columns: new[] { "user_id", "id" });

            migrationBuilder.AddPrimaryKey(
                name: "PK_task_item",
                table: "task_item",
                columns: new[] { "user_id", "id" });

            migrationBuilder.AddPrimaryKey(
                name: "PK_task_entry",
                table: "task_entry",
                columns: new[] { "user_id", "id" });

            migrationBuilder.AddPrimaryKey(
                name: "PK_schedule_rule",
                table: "schedule_rule",
                columns: new[] { "user_id", "id" });

            migrationBuilder.AddPrimaryKey(
                name: "PK_nag",
                table: "nag",
                columns: new[] { "user_id", "id" });

            migrationBuilder.CreateIndex(
                name: "IX_task_item_user_id_parent_task_item_id",
                table: "task_item",
                columns: new[] { "user_id", "parent_task_item_id" });

            migrationBuilder.CreateIndex(
                name: "IX_task_entry_user_id_parent_task_item_id",
                table: "task_entry",
                columns: new[] { "user_id", "parent_task_item_id" });

            migrationBuilder.AddForeignKey(
                name: "FK_schedule_rule_nag_user_id_nag_id",
                table: "schedule_rule",
                columns: new[] { "user_id", "nag_id" },
                principalTable: "nag",
                principalColumns: new[] { "user_id", "id" },
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_task_entry_task_item_user_id_parent_task_item_id",
                table: "task_entry",
                columns: new[] { "user_id", "parent_task_item_id" },
                principalTable: "task_item",
                principalColumns: new[] { "user_id", "id" },
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_task_entry_task_log_user_id_task_log_id",
                table: "task_entry",
                columns: new[] { "user_id", "task_log_id" },
                principalTable: "task_log",
                principalColumns: new[] { "user_id", "id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_task_item_task_item_user_id_parent_task_item_id",
                table: "task_item",
                columns: new[] { "user_id", "parent_task_item_id" },
                principalTable: "task_item",
                principalColumns: new[] { "user_id", "id" },
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_task_item_task_log_user_id_task_log_id",
                table: "task_item",
                columns: new[] { "user_id", "task_log_id" },
                principalTable: "task_log",
                principalColumns: new[] { "user_id", "id" },
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_task_log_nag_user_id_nag_id",
                table: "task_log",
                columns: new[] { "user_id", "nag_id" },
                principalTable: "nag",
                principalColumns: new[] { "user_id", "id" },
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            LockNodeTables(migrationBuilder);

            foreach (var table in NodeTables)
            {
                migrationBuilder.Sql($"""
                    if exists (select id from [{table}] group by id having count_big(*) > 1)
                        throw 51001, 'ScopeNodeKeysByUser rollback refused: {table} contains Id values shared by users. No data was changed.', 1;
                    """);
            }

            migrationBuilder.DropForeignKey(
                name: "FK_schedule_rule_nag_user_id_nag_id",
                table: "schedule_rule");

            migrationBuilder.DropForeignKey(
                name: "FK_task_entry_task_item_user_id_parent_task_item_id",
                table: "task_entry");

            migrationBuilder.DropForeignKey(
                name: "FK_task_entry_task_log_user_id_task_log_id",
                table: "task_entry");

            migrationBuilder.DropForeignKey(
                name: "FK_task_item_task_item_user_id_parent_task_item_id",
                table: "task_item");

            migrationBuilder.DropForeignKey(
                name: "FK_task_item_task_log_user_id_task_log_id",
                table: "task_item");

            migrationBuilder.DropForeignKey(
                name: "FK_task_log_nag_user_id_nag_id",
                table: "task_log");

            migrationBuilder.DropPrimaryKey(
                name: "PK_user_mood",
                table: "user_mood");

            migrationBuilder.DropPrimaryKey(
                name: "PK_task_log",
                table: "task_log");

            migrationBuilder.DropPrimaryKey(
                name: "PK_task_item",
                table: "task_item");

            migrationBuilder.DropIndex(
                name: "IX_task_item_user_id_parent_task_item_id",
                table: "task_item");

            migrationBuilder.DropPrimaryKey(
                name: "PK_task_entry",
                table: "task_entry");

            migrationBuilder.DropIndex(
                name: "IX_task_entry_user_id_parent_task_item_id",
                table: "task_entry");

            migrationBuilder.DropPrimaryKey(
                name: "PK_schedule_rule",
                table: "schedule_rule");

            migrationBuilder.DropPrimaryKey(
                name: "PK_nag",
                table: "nag");

            migrationBuilder.AddPrimaryKey(
                name: "PK_user_mood",
                table: "user_mood",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_task_log",
                table: "task_log",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_task_item",
                table: "task_item",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_task_entry",
                table: "task_entry",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_schedule_rule",
                table: "schedule_rule",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_nag",
                table: "nag",
                column: "id");

            migrationBuilder.AddForeignKey(
                name: "FK_schedule_rule_nag_nag_id",
                table: "schedule_rule",
                column: "nag_id",
                principalTable: "nag",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_task_entry_task_item_parent_task_item_id",
                table: "task_entry",
                column: "parent_task_item_id",
                principalTable: "task_item",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_task_entry_task_log_task_log_id",
                table: "task_entry",
                column: "task_log_id",
                principalTable: "task_log",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_task_item_task_item_parent_task_item_id",
                table: "task_item",
                column: "parent_task_item_id",
                principalTable: "task_item",
                principalColumn: "id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_task_item_task_log_task_log_id",
                table: "task_item",
                column: "task_log_id",
                principalTable: "task_log",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_task_log_nag_nag_id",
                table: "task_log",
                column: "nag_id",
                principalTable: "nag",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
        private static readonly string[] NodeTables =
            ["nag", "schedule_rule", "task_log", "task_item", "task_entry", "user_mood"];

        private static void LockNodeTables(MigrationBuilder migrationBuilder)
        {
            // EF runs this migration in a transaction. Hold write locks through validation
            // and key replacement so concurrent inserts cannot invalidate the preflight.
            foreach (var table in NodeTables)
            {
                migrationBuilder.Sql($"""
                    declare @rowCount_{table} bigint;
                    select @rowCount_{table} = count_big(*) from [{table}] with (tablockx, holdlock);
                    """);
            }
        }
    }
}
