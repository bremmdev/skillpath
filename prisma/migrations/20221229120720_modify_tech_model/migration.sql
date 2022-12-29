/*
  Warnings:

  - Made the column `description` on table `Project` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `url` to the `Tech` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `Tech` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "description" SET NOT NULL;

-- AlterTable
ALTER TABLE "Tech" ADD COLUMN     "url" TEXT NOT NULL,
ALTER COLUMN "description" SET NOT NULL;
