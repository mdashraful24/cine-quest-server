import { Router } from "express";
import { upload } from "../../lib/multer";
import { validateRequest } from "../../middlewares/validateRequest";
import { MovieController } from "./movie.controller";
import { createMovieSchema, updateMovieSchema } from "./movie.validation";

const router = Router();

router.post(
	"/",
	upload.single("image"),
	validateRequest(createMovieSchema),
	MovieController.createMovie,
);
router.get("/", MovieController.movieList);
router.get("/:id/rewatch-order", MovieController.getRewatchOrder);
router.patch(
	"/:id",
	upload.single("image"),
	validateRequest(updateMovieSchema),
	MovieController.updateMovie,
);

export const MovieRoutes = router;
