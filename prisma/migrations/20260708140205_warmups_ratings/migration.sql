-- CreateTable
CREATE TABLE "ProgramRating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stars" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProgramRating_programId_fkey" FOREIGN KEY ("programId") REFERENCES "CommunityProgram" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProgramRating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SetLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workoutId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "exerciseName" TEXT NOT NULL,
    "blockIndex" INTEGER NOT NULL DEFAULT 0,
    "setIndex" INTEGER NOT NULL,
    "targetReps" INTEGER NOT NULL,
    "targetMaxReps" INTEGER NOT NULL DEFAULT 0,
    "isAmrap" BOOLEAN NOT NULL DEFAULT false,
    "isWarmup" BOOLEAN NOT NULL DEFAULT false,
    "targetWeight" REAL NOT NULL,
    "reps" INTEGER,
    "weight" REAL,
    "rpe" REAL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "SetLog_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_SetLog" ("blockIndex", "completed", "exerciseId", "exerciseName", "id", "isAmrap", "reps", "rpe", "setIndex", "targetMaxReps", "targetReps", "targetWeight", "weight", "workoutId") SELECT "blockIndex", "completed", "exerciseId", "exerciseName", "id", "isAmrap", "reps", "rpe", "setIndex", "targetMaxReps", "targetReps", "targetWeight", "weight", "workoutId" FROM "SetLog";
DROP TABLE "SetLog";
ALTER TABLE "new_SetLog" RENAME TO "SetLog";
CREATE INDEX "SetLog_workoutId_idx" ON "SetLog"("workoutId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "ProgramRating_programId_userId_key" ON "ProgramRating"("programId", "userId");
