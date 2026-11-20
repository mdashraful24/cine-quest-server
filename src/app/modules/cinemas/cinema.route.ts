import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { CinemaController } from "./cinema.controller";
import {
	createBookingSchema,
	createCinemaSchema,
	updateCinemaSchema,
} from "./cinema.validation";

const router = Router();

router.post(
	"/",
	validateRequest(createCinemaSchema),
	CinemaController.createCinema,
);
router.get("/", CinemaController.cinemaList);
router.patch(
	"/:id",
	validateRequest(updateCinemaSchema),
	CinemaController.updateCinema,
);
router.get("/:id/booking", CinemaController.getBookingQuote);
router.post(
	"/:id/booking",
	validateRequest(createBookingSchema),
	CinemaController.createBooking,
);
router.delete("/:id", CinemaController.deleteCinema);

export const CinemaRoutes = router;
