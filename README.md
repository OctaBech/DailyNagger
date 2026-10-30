# DailyNagger

DailyNagger is a personal Android app for keeping everyday tasks, routines, shopping,
training and birthdays in one place, alongside public holidays.

Tasks appear as cards grouped by date and time interval. Each card can expand into
an editable tree of subtasks, value fields and notes. Recurrence rules can be
combined, and changes are saved locally and queued for server sync so a poor
connection does not interrupt working on a task.

## Try DailyNaggerDemo

**Android only**

<a href="https://github.com/OctaBech/DailyNagger/releases/latest/download/DailyNaggerDemo.zip">
  <img src="docs/images/dailynagger-demo-qr.svg" alt="QR code to download DailyNaggerDemo ZIP" width="240" height="240">
</a>

[Download DailyNaggerDemo ZIP](https://github.com/OctaBech/DailyNagger/releases/latest/download/DailyNaggerDemo.zip) — no password required.

The demo requires no registration or login. It automatically creates your own
sandbox in a demo database, where you can load, edit and reset demo data.

1. Scan the QR code and download the ZIP file.
2. Extract the ZIP and open `DailyNaggerDemo.apk` from your file manager.
3. If prompted, allow your file manager to **install unknown apps**.
4. Complete the installation.

The code is under ongoing development, and UX polish is also an ongoing process.

## Architecture cases

The following cases are written in Danish. Their shared theme is investing in
boundaries so the project can evolve through small, focused changes alongside a
full-time job, without each new feature requiring a major rebuild or a long
debugging expedition.

1. [Forenkl koden ved at bryde Reacts dependency-domino med en boundary](docs/cases/CV_case_1_action_boundary.md)
2. [Kompleks, persistent afsendelseskø med low maintenance](docs/cases/CV_case_2_sending.md)
3. [Kausal observability fra brugerhandling til server med low coupling](docs/cases/CV_case_3_observability.md)

## Technical stack

- **Mobile:** React Native/Expo and TypeScript, developed for personal use on a Samsung Galaxy S10 Lite.
- **Server:** C#/.NET with an ASP.NET Core API and SQL Server.
- **Observability:** Sentry tracing and structured logging with Serilog/Seq.

## Operations

DailyNagger is a personal project. Scripts for production deploy, backup,
smoke, and rollback inspection require secrets outside the repository.
