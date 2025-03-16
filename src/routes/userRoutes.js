import express from "express";
import {
  signup,
  signIn,
  confirmSignup,
  logOut,
} from "../controllers/userController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signIn);
router.post("/logout", logOut);
router.post("/confirm-signup", confirmSignup);

export default router;
