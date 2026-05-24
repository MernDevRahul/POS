'use strict';

const { prisma }   = require('../utils/prisma');
const { ok, fail } = require('../utils/response');

// ── SERVICE ──────────────────────────────────────────────────────────────────

async function overview(query = {}) {
  const { search, page = 1, limit = 10 } = query;
  const where = { isActive: true };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ];
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true, sku: true, name: true,
        stockQty: true, lowStockThreshold: true,
        category: { select: { name: true } },
      },
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

async function lowStock() {
  // Raw query to compare stockQty with lowStockThreshold (both columns)
  const products = await prisma.$queryRaw`
    SELECT id, sku, name, "stockQty", "lowStockThreshold"
    FROM products
    WHERE "isActive" = true AND "stockQty" <= "lowStockThreshold"
    ORDER BY "stockQty" ASC
  `;
  return products;
}

async function getMovements({ productId, page = 1, limit = 10 }) {
  const where = productId ? { productId } : undefined;
  
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const [items, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: {
        product:   { select: { sku: true, name: true } },
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    }),
    prisma.stockMovement.count({ where }),
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

async function adjust(productId, qtyDelta, reason, userId) {
  return prisma.$transaction(async (tx) => {
    // Lock the row and check it exists
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw Object.assign(new Error('Product not found'), { status: 404 });
    if (!product.isActive) throw Object.assign(new Error('Cannot adjust archived product'), { status: 400 });

    const newQty = product.stockQty + qtyDelta;
    if (newQty < 0) throw Object.assign(new Error(`Insufficient stock. Current: ${product.stockQty}`), { status: 400 });

    // Update stock
    const updated = await tx.product.update({
      where: { id: productId },
      data:  { stockQty: newQty },
    });

    // Write movement log
    await tx.stockMovement.create({
      data: {
        productId,
        type:           'ADJUSTMENT',
        qtyDelta,
        stockAfter:     newQty,
        reason,
        createdByUserId: userId,
      },
    });

    // Audit log
    await tx.auditLog.create({
      data: {
        userId,
        action:   'STOCK_ADJUST',
        entityId: productId,
        meta:     { qtyDelta, reason, stockBefore: product.stockQty, stockAfter: newQty },
      },
    });

    return updated;
  });
}

// ── CONTROLLER ────────────────────────────────────────────────────────────────

exports.overview = async (req, res, next) => {
  try { ok(res, await overview(req.query)); } catch (err) { next(err); }
};

exports.lowStock = async (_req, res, next) => {
  try { ok(res, await lowStock()); } catch (err) { next(err); }
};

exports.movements = async (req, res, next) => {
  try { ok(res, await getMovements(req.query)); } catch (err) { next(err); }
};

exports.adjust = async (req, res, next) => {
  try {
    const { productId, qtyDelta, reason } = req.body;
    const product = await adjust(productId, parseInt(qtyDelta), reason, req.user.id);
    ok(res, product, 'Stock adjusted successfully');
  } catch (err) { next(err); }
};