import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { MovieController } from "./movie.controller";
import { createMovieSchema, updateMovieSchema } from "./movie.validation";

const router = Router();

router.post(
	"/",
	validateRequest(createMovieSchema),
	MovieController.createMovie,
);
router.get("/", MovieController.movieList);
router.get("/:id/rewatch-order", MovieController.getRewatchOrder);
router.patch(
	"/:id",
	validateRequest(updateMovieSchema),
	MovieController.updateMovie,
);
router.delete("/:id", MovieController.deleteMovie);

export const MovieRoutes = router;
