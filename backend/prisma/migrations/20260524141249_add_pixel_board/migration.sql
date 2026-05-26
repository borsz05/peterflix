-- CreateTable
CREATE TABLE "PixelBoard" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL DEFAULT 'main',
    "pixels" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PixelBoard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PixelBoard_key_key" ON "PixelBoard"("key");
