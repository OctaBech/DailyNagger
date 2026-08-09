using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DailyNagger.Server.Data.Migrations.Data
{
    /// <inheritdoc />
    [DbContext(typeof(DailyNaggerDbContext))]
    [Migration("20260721120000_AddUserMood")]
    public partial class AddUserMood : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "user_mood",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    user_id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    mood = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    recorded_at = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    time_zone = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    locale = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    created_by_client_id = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    created_by_device_name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    created_by_device_model = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_mood", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_user_mood_user_id_recorded_at",
                table: "user_mood",
                columns: ["user_id", "recorded_at"]);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "user_mood");
        }
    }
}
