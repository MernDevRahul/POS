'use strict';

const bcrypt = require("bcryptjs");
const { prisma } = require('../utils/prisma');

const SAFE_SELECT = {
  id: true,
  name: true,
  username: true,
  role: true,
  isActive: true,
  createdAt: true,
};

async function getAllUsers() {
    return await prisma.user.findMany({
      select: SAFE_SELECT,
      orderBy: { name: "asc" },
    });
}

async function createUser(data) {
    const { username, name, password, role } = data;
    const passwordHash = await bcrypt.hash(password, 12);
    return await prisma.user.create({
      data: { username, name, passwordHash, role },
      select: SAFE_SELECT,
    });
}

async function updateUser(id, data) {
    const { name, role, password, isActive } = data;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) updateData.passwordHash = await bcrypt.hash(password, 12);

    return await prisma.user.update({
      where: { id },
      data: updateData,
      select: SAFE_SELECT,
    });
}

async function deactivateUser(id) {
    return await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: SAFE_SELECT,
    });
}

async function activateUser(id) {
    return await prisma.user.update({
      where: { id },
      data: { isActive: true },
      select: SAFE_SELECT,
    });
}

module.exports = {
    getAllUsers,
    createUser,
    updateUser,
    deactivateUser,
    activateUser
};