import "dotenv/config";
import { connectDB } from "./config/db";
import app from "./app";
import { createAdmin } from "./seeds/createAdmin";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    (async () => {
  const result = await createAdmin();
  console.log("✅ Admin created:", result.data?.user.email);
})();
    app.listen(PORT, () => {
      console.log(`Server started on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server failed to start:", error);
    process.exit(1);
  }
};

startServer();
