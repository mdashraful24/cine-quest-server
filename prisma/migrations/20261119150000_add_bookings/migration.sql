CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "cinemaId" TEXT NOT NULL,
    "groupSize" INTEGER NOT NULL,
    "totalBundles" INTEGER NOT NULL,
    "bundles" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bookings_cinemaId_idx" ON "bookings"("cinemaId");
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_group_size_check" CHECK ("groupSize" >= 1 AND "groupSize" <= 10000);

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_total_bundles_check" CHECK ("totalBundles" >= 0);

ALTER TABLE "bookings"
  ADD CONSTRAINT "bookings_status_check" CHECK ("status" IN ('CONFIRMED', 'CANCELLED'));

ALTER TABLE "bookings" ADD CONSTRAINT "bookings_cinemaId_fkey" FOREIGN KEY ("cinemaId") REFERENCES "cinemas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
