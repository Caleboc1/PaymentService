/*
  Warnings:

  - You are about to drop the `Course` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Purchase` DROP FOREIGN KEY `Purchase_courseId_fkey`;

-- DropTable
DROP TABLE `Course`;

-- DropTable
DROP TABLE `User`;
