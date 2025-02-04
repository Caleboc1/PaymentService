/*
  Warnings:

  - Made the column `reference` on table `Transaction` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `Transaction` MODIFY `reference` VARCHAR(191) NOT NULL;
