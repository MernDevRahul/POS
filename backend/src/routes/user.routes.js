"use strict";

const router = require("express").Router();
const { body } = require("express-validator");
const { validate } = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const userController = require("../controllers/user.controller");

router.use(authenticate, authorize("ADMIN"));

// GET /api/v1/users
router.get("/", userController.getAllUsers);

// POST /api/v1/users
router.post(
  "/",
  [
    body("username")
      .trim()
      .notEmpty()
      .withMessage("Username is required")
      .matches(/^[a-z0-9_]+$/)
      .withMessage("Username: lowercase letters, numbers and _ only"),
    body("name").trim().notEmpty().withMessage("Full name is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role")
      .isIn(["ADMIN", "MANAGER", "CASHIER"])
      .withMessage("Role must be ADMIN, MANAGER, or CASHIER"),
  ],
  validate,
  userController.createUser
);

// PATCH /api/v1/users/:id
router.patch(
  "/:id",
  [
    body("name").optional().trim().notEmpty(),
    body("role").optional().isIn(["ADMIN", "MANAGER", "CASHIER"]),
    body("password")
      .optional()
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("isActive").optional().isBoolean(),
  ],
  validate,
  userController.updateUser
);

// Deactivate 
router.patch("/:id/deactivate", userController.deactivateUser);

// Activate
router.patch("/:id/activate", userController.activateUser);

// DELETE /api/v1/users/:id  (deactivate, not hard delete)
router.delete("/:id", userController.deleteUser);

module.exports = router;
