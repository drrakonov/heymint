/*
  Warnings:

  - Added the required column `isProtected` to the `Meeting` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "isProtected" BOOLEAN NOT NULL,
ADD COLUMN     "password" TEXT;
