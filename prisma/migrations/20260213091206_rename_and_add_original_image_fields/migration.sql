/*
  Warnings:

  - You are about to drop the column `blobUrl` on the `Conversion` table. All the data in the column will be lost.
  - You are about to drop the column `contentType` on the `Conversion` table. All the data in the column will be lost.
  - Added the required column `originalBlobUrl` to the `Conversion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalContentType` to the `Conversion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `processedBlobUrl` to the `Conversion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `processedContentType` to the `Conversion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Conversion" DROP COLUMN "blobUrl",
DROP COLUMN "contentType",
ADD COLUMN     "originalBlobUrl" TEXT NOT NULL,
ADD COLUMN     "originalContentType" TEXT NOT NULL,
ADD COLUMN     "processedBlobUrl" TEXT NOT NULL,
ADD COLUMN     "processedContentType" TEXT NOT NULL;
