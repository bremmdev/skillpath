/*
  Warnings:

  - Made the column `repo` on table `Project` required. This step will fail if there are existing NULL values in that column.
  - Made the column `url` on table `Project` required. This step will fail if there are existing NULL values in that column.
  - Made the column `imageUrl` on table `Project` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "repo" SET NOT NULL,
ALTER COLUMN "url" SET NOT NULL,
ALTER COLUMN "imageUrl" SET NOT NULL;
