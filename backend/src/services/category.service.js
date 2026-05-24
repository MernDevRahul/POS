"use strict"

const { prisma } = require("../utils/prisma");

async function getAllCategories(){
    return await prisma.category.findMany({ orderBy: { name: 'asc' } });
}

async function createCategory(data){
    const { name } = data;
    return await prisma.category.create( { data: {name: name } });
}

async function getProductCountByCategory(categoryId) {
    return await prisma.product.count({ where: { categoryId } });
}

async function deleteCategory(id) {
    return await prisma.category.delete({ where: { id } });
}

module.exports = { getAllCategories, createCategory, getProductCountByCategory, deleteCategory };