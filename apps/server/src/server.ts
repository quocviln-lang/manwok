import app from "./app.js";
import { createServer } from "http";
import { initSocket } from "./socket.js";

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
