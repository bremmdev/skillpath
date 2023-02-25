/*
  Warnings:

  - You are about to drop the column `learned` on the `Feature` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `statusId` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the `ProjectStatus` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `description` on table `Feature` required. This step will fail if there are existing NULL values in that column.
  - Made the column `dateLearned` on table `Feature` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_statusId_fkey";

-- AlterTable
ALTER TABLE "Feature" DROP COLUMN "learned",
ADD COLUMN     "dateReviewed" TIMESTAMP(3),
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "dateLearned" SET NOT NULL;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "endDate",
DROP COLUMN "statusId",
ALTER COLUMN "imageUrl" DROP NOT NULL;

-- DropTable
DROP TABLE "ProjectStatus";
