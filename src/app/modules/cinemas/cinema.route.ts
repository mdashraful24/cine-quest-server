import { Router } from "express";
import { upload } from "../../lib/multer";
import { validateRequest } from "../../middlewares/validateRequest";
import { CinemaController } from "./cinema.controller";
import { createCinemaSchema } from "./cinema.validation";

const router = Router();

router.post(
	"/",
	upload.single("image"),
	validateRequest(createCinemaSchema),
	CinemaController.createCinema,
);
router.get("/", CinemaController.cinemaList);
router.get("/:id/booking", CinemaController.getBookingQuote);

export const CinemaRoutes = router;
