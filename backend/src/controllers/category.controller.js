"use strict";

const categoryService = require('../services/category.service');
const { ok, fail } = require('../utils/response');

async function get(req,res,next){
    try {
        const result = await categoryService.getAllCategories();
        if(!result) return fail(res, 'Category not found');
        ok(res, result, 'Category found Successfully')
    } catch (err) {
        next(err);
    }
}

async function create(req,res,next){
    try {
        const result = await categoryService.createCategory(req.body);
        if(!result) return fail(res, 'Category not Created');
        ok(res, result, 'Category Created Successfully')
    } catch (err) {
        next(err);
    }
}

async function deleteCategory(req, res, next) {
    try {
        const count = await categoryService.getProductCountByCategory(req.params.id);
        if (count > 0) return fail(res, `Cannot delete: ${count} product(s) use this category`, 409);
        await categoryService.deleteCategory(req.params.id);
        ok(res, null, 'Category deleted');
    } catch (err) {
        next(err);
    }
}

module.exports = { get, create, deleteCategory };