/*
  Warnings:

  - A unique constraint covering the columns `[meetingCode]` on the table `Meeting` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Meeting_meetingCode_key" ON "Meeting"("meetingCode");
