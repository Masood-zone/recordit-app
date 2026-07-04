# RecordIT Fingerprint POC

## Requirements

- Windows
- ZKTeco ZK9500 fingerprint reader
- ZKFinger SDK driver installed
- Visual Studio or .NET Framework MSBuild
- Node.js
- npm or pnpm

## Run Fingerprint Bridge

Simple launcher from the repository root:

```bash
run-bridge.cmd
```

To skip rebuilding and only launch the existing EXE:

```bash
run-bridge.cmd -NoBuild
```

Manual Visual Studio flow:

1. Open `../recordit-fingerprint-bridge/RecordIT.FingerprintBridge.sln` in Visual Studio.
2. Set platform to `x86`.
3. Run the WinForms app.
4. Bridge should listen on `http://localhost:5050`.

CLI build used for this POC:

```bash
C:\Windows\Microsoft.NET\Framework\v4.0.30319\MSBuild.exe ..\recordit-fingerprint-bridge\RecordIT.FingerprintBridge.sln /p:Platform=x86 /p:Configuration=Debug
```

## Run Next.js POC

Simple launcher from the repository root:

```bash
run-app.cmd
```

Or manually:

```bash
pnpm install
pnpm dev
```

Open:

```txt
http://localhost:3000
```

To launch both bridge and frontend from the repository root:

```bash
run-recordit-demo.cmd
```

## Testing Flow

1. Start the fingerprint bridge.
2. Open Next.js app.
3. Click Check Bridge Health.
4. Click Connect Sensor.
5. Confirm serial number appears.
6. Register a student record with student ID, name, and class.
7. Select the student.
8. Click Enroll Left Finger.
9. Place the same left finger on the reader 3 times.
10. Confirm left enrollment `SUCCESS`.
11. Click Enroll Right Finger.
12. Place the same right finger on the reader 3 times.
13. Confirm right enrollment `SUCCESS`.
14. Click Verify L or Verify R for the selected student.
15. Place the requested finger on the reader.
16. Confirm verification `SUCCESS`.
17. Click Identify Any Finger.
18. Place any enrolled finger on the reader.
19. Confirm identification returns the student and finger side.

## Notes

This POC stores templates only in memory.
No database is used.
No authentication is used.
