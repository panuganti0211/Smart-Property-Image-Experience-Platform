import app from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { resumePendingAnalyses } from "./controllers/propertyController.js";

async function start() {
  try {
    await connectDb();
    app.listen(env.port, () => {
      console.log(`Backend running on ${env.port}`);
      console.log(`AI providerrrr: ${env.aiProvider}`);
      console.log(
        `AI provider: ${env.aiProvider}` +
          (env.aiProvider === "mock" ? " (no external API; deterministic demo insights)" : "")
      );
    });

    // Recover any in-flight analysis jobs left in pending state.
    const resumed = await resumePendingAnalyses();
    if (resumed > 0) {
      console.log(`Resumed ${resumed} pending AI analysis job(s).`);
    }
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

start();
