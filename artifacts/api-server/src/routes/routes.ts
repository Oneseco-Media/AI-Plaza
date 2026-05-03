import { Router } from "express";
import { storage } from "../storage";

const appRouter = Router();

// put application routes here
// prefix all routes with /api
// use storage to perform CRUD operations on the storage interface
// e.g. storage.insertUser(user) or storage.getUserByUsername(username)

export default appRouter;
