'use strict';

const userService = require('../services/user.service');
const { ok, created, fail } = require('../utils/response');

async function getAllUsers(req, res, next) {
    try {
        const users = await userService.getAllUsers();
        ok(res, users);
    } catch (err) {
        next(err);
    }
}

async function createUser(req, res, next) {
    try {
        const user = await userService.createUser(req.body);
        created(res, user, "User created");
    } catch (err) {
        next(err);
    }
}

async function updateUser(req, res, next) {
    try {
        const user = await userService.updateUser(req.params.id, req.body);
        ok(res, user, "User updated");
    } catch (err) {
        next(err);
    }
}

async function deactivateUser(req, res, next) {
    try {
        const user = await userService.deactivateUser(req.params.id);
        ok(res, user, "User deactivated");
    } catch (err) {
        next(err);
    }
}

async function activateUser(req, res, next) {
    try {
        const user = await userService.activateUser(req.params.id);
        ok(res, user, "User activated");
    } catch (err) {
        next(err);
    }
}

async function deleteUser(req, res, next) {
    try {
        if (req.params.id === req.user.id) {
            return fail(res, "Cannot deactivate your own account", 400);
        }
        const user = await userService.deactivateUser(req.params.id);
        ok(res, user, "User deactivated");
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getAllUsers,
    createUser,
    updateUser,
    deactivateUser,
    activateUser,
    deleteUser
};