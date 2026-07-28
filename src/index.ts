import http from "http";
import app from "./app";
import connectDB from "./database/db";
import { initSocket } from "./sockets";
import { env } from "./config/env";

const httpServer = http.createServer(app);

connectDB().then(() => {
  initSocket(httpServer);

  httpServer.listen(env.port, () => {
    console.log(`Server running at: http://localhost:${env.port}`);
  });
});
