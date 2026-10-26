import { Router } from "express";
import {getAllUsers, getUserById, createUser, updateUser,} from "../controllers/user.controller";
import {authenticateToken, authorizeRoles,} from "../middleware/auth.middleware";

const router = Router();

router.use(authenticateToken, authorizeRoles("ADMIN"));

router.get("/", getAllUsers);

router.get("/:id", getUserById);

router.post("/", createUser);

router.put("/:id", updateUser);

export default router;
