ALTER TABLE "movie_prerequisites"
  ADD CONSTRAINT "movie_prerequisites_no_self_check" CHECK ("movieId" <> "prerequisiteId");

ALTER TABLE "cinema_bundle_sizes"
  ADD CONSTRAINT "cinema_bundle_sizes_seat_count_check" CHECK ("seatCount" >= 1 AND "seatCount" <= 500);
