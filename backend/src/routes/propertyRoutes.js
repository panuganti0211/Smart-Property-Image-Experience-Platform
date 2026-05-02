import { Router } from "express";
import multer from "multer";
import {
  createProperty,
  getProperties,
  getPropertyById,
  reanalyzeProperty,
  uploadPropertyImages,
} from "../controllers/propertyController.js";

const router = Router();
const upload = multer({ dest: "uploads/" });

router.post("/", createProperty);
router.get("/", getProperties);
router.get("/:id", getPropertyById);
router.post("/:id/images", upload.array("images", 5), uploadPropertyImages);
router.post("/:id/reanalyze", reanalyzeProperty);

export default router;
