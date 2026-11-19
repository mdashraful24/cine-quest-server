-- CreateTable
CREATE TABLE "cinemas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cinemas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cinema_bundle_sizes" (
    "cinemaId" TEXT NOT NULL,
    "seatCount" INTEGER NOT NULL,

    CONSTRAINT "cinema_bundle_sizes_pkey" PRIMARY KEY ("cinemaId","seatCount")
);

-- CreateTable
CREATE TABLE "movies" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "releaseYear" INTEGER NOT NULL,
    "runtimeMinutes" INTEGER NOT NULL,
    "watched" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "movies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movie_prerequisites" (
    "movieId" TEXT NOT NULL,
    "prerequisiteId" TEXT NOT NULL,

    CONSTRAINT "movie_prerequisites_pkey" PRIMARY KEY ("movieId","prerequisiteId")
);

-- CreateIndex
CREATE UNIQUE INDEX "cinemas_name_key" ON "cinemas"("name");

-- CreateIndex
CREATE UNIQUE INDEX "movies_title_key" ON "movies"("title");

-- CreateIndex
CREATE INDEX "movies_releaseYear_idx" ON "movies"("releaseYear");

-- CreateIndex
CREATE INDEX "movies_watched_idx" ON "movies"("watched");

-- CreateIndex
CREATE INDEX "movie_prerequisites_prerequisiteId_idx" ON "movie_prerequisites"("prerequisiteId");

-- AddForeignKey
ALTER TABLE "cinema_bundle_sizes" ADD CONSTRAINT "cinema_bundle_sizes_cinemaId_fkey" FOREIGN KEY ("cinemaId") REFERENCES "cinemas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_prerequisites" ADD CONSTRAINT "movie_prerequisites_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movie_prerequisites" ADD CONSTRAINT "movie_prerequisites_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "movies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
