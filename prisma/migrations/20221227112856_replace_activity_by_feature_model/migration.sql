/*
  Warnings:

  - You are about to drop the `Activity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ActivityToTech` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Activity" DROP CONSTRAINT "Activity_projectId_fkey";

-- DropForeignKey
ALTER TABLE "_ActivityToTech" DROP CONSTRAINT "_ActivityToTech_A_fkey";

-- DropForeignKey
ALTER TABLE "_ActivityToTech" DROP CONSTRAINT "_ActivityToTech_B_fkey";

-- DropTable
DROP TABLE "Activity";

-- DropTable
DROP TABLE "_ActivityToTech";

-- CreateTable
CREATE TABLE "Feature" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dateLearned" TIMESTAMP(3),
    "learned" BOOLEAN NOT NULL,
    "techId" TEXT NOT NULL,

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Feature" ADD CONSTRAINT "Feature_techId_fkey" FOREIGN KEY ("techId") REFERENCES "Tech"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
