import express from "express";
import cors from "cors";
import propertyRoutes from "./routes/propertyRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/properties", propertyRoutes);
app.use(errorHandler);

export default app;
