/*
  Warnings:

  - You are about to drop the column `createdAt` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `documents` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `documents` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `documents` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "documents" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "mimetype" DROP NOT NULL,
ALTER COLUMN "size" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "documents_slug_key" ON "documents"("slug");
