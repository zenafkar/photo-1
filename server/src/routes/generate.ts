import { Router } from "express";
import { createGeneration, deleteGeneration, syncGenerations } from "../controllers/generateController.js";

const router = Router();

router.post("/", createGeneration);
router.delete("/:id", deleteGeneration);
router.post("/sync", syncGenerations);

export default router;
