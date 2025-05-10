-- CreateTable
CREATE TABLE "StorageBin" (
    "binId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locationDescription" TEXT,
    "dimensions" TEXT,
    "maxCapacityWeight" DOUBLE PRECISION,
    "maxCapacityUnits" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageBin_pkey" PRIMARY KEY ("binId")
);

-- CreateTable
CREATE TABLE "ProductLocation" (
    "productLocationId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "binId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductLocation_pkey" PRIMARY KEY ("productLocationId")
);

-- CreateIndex
CREATE UNIQUE INDEX "StorageBin_name_key" ON "StorageBin"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ProductLocation_productId_binId_key" ON "ProductLocation"("productId", "binId");

-- AddForeignKey
ALTER TABLE "ProductLocation" ADD CONSTRAINT "ProductLocation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Products"("productId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductLocation" ADD CONSTRAINT "ProductLocation_binId_fkey" FOREIGN KEY ("binId") REFERENCES "StorageBin"("binId") ON DELETE CASCADE ON UPDATE CASCADE;
