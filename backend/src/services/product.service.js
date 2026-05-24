'use strict';

const { prisma } = require('../utils/prisma');

const PRODUCT_SELECT = {
  id: true, sku: true, name: true,
  categoryId: true, category: { select: { id: true, name: true } },
  colors: true, sizes: true,
  costPrice: true, sellingPrice: true, gstRate: true,
  stockQty: true, lowStockThreshold: true, isActive: true,
  createdAt: true, updatedAt: true,
};

async function list({ search, categoryId, active, page = 1, limit = 10 }) {
  const where = {};

  if (search) {
    where.OR = [
      { name:      { contains: search, mode: 'insensitive' } },
      { sku:       { contains: search, mode: 'insensitive' } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;
  if (active !== undefined) where.isActive = active === 'true' || active === true;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: PRODUCT_SELECT,
      orderBy: { name: 'asc' },
      skip,
      take: limitNum,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    }
  };
}

async function getById(id) {
  return prisma.product.findUnique({ where: { id }, select: PRODUCT_SELECT });
}

async function getBySku(sku) {
  return prisma.product.findUnique({
    where: { sku: sku.toUpperCase() },
    select: PRODUCT_SELECT,
  });
}

async function create(data) {
  return prisma.product.create({
    data: {
      sku:               data.sku.toUpperCase(),
      name:              data.name,
      categoryId:        data.categoryId || null,
      colors:            data.colors || [],
      sizes:             data.sizes || [],
      costPrice:         data.costPrice    ?? 0,
      sellingPrice:      data.sellingPrice,
      gstRate:           data.gstRate      ?? 0,
      stockQty:          data.stockQty     ?? 0,
      lowStockThreshold: data.lowStockThreshold ?? 10,
    },
    select: PRODUCT_SELECT,
  });
}

async function update(id, data) {
  // SKU is immutable – never include it in updates
  const { sku, ...safeData } = data;
  return prisma.product.update({
    where: { id },
    data: safeData,
    select: PRODUCT_SELECT,
  });
}

async function archive(id) {
  return prisma.product.update({
    where: { id },
    data: { isActive: false },
    select: PRODUCT_SELECT,
  });
}

async function activate(id) {
  return prisma.product.update({
    where: { id },
    data: { isActive: true },
    select: PRODUCT_SELECT,
  });
}

module.exports = { list, getById, getBySku, create, update, archive, activate };