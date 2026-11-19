import { Router } from "express";
import { BookingController } from "./booking.controller";

const router = Router();

router.get("/", BookingController.bookingList);
router.patch("/:id/cancel", BookingController.cancelBooking);
router.delete("/:id", BookingController.deleteBooking);

export const BookingRoutes = router;
