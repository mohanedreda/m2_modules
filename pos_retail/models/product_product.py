# -*- coding: utf-8 -*-
from odoo import api, fields, models, _
import logging

_logger = logging.getLogger(__name__)


class product_product(models.Model):
    _inherit = "product.product"

    product_barcode_ids = fields.One2many(
        "product.barcode",
        "product_id",
        string="Multi Barcode")
    product_unit_ids = fields.One2many(
        "product.uom.price",
        "product_id",
        string="Multi Unit")
    uom_ids = fields.Many2many(
        "uom.uom",
        string="Units the same Category",
        compute="_get_uoms_the_same_category")
    suggest_product_ids = fields.Many2many(
        "product.product",
        "product_product_suggestion_rel",
        "from_p_id",
        "to_p_id",
        string="Products Suggestion Sale")
    is_credit = fields.Boolean("Is Credit")
    cross_sell = fields.Boolean("Is Global for Cross Sell")
    cross_sell_group_ids = fields.Many2many(
        'product.cross.sell.group',
        'product_product_cross_sale_group_rel',
        'p_id',
        'group_id',
        string='Cross Sale Groups'
    )
    cross_sell_item_ids = fields.Many2many(
        'product.product',
        'product_product_cross_item_rel',
        'p1_id',
        'p2_id',
        string='Cross Sale Items',
        domain=[('cross_sell', '=', True), ('available_in_pos', '=', True)]
    )
    pack_include = fields.Boolean('Include/Compute with Pack Items')
    pack_group_ids = fields.Many2many(
        'product.pack.group',
        'product_product_pack_group_rel',
        'product_id',
        'pack_group_id',
        string='Pack Groups'
    )


    @api.onchange('cross_sell_group_ids')
    def _oc_cross_sell_group_ids(self):
        if self.cross_sell_group_ids:
            current_cross_item_ids = []
            for p in self.cross_sell_item_ids:
                current_cross_item_ids.append(p.id)
            current_cross_item_ids = [p.id for p in self.cross_sell_item_ids]
            for group in self.cross_sell_group_ids:
                for p in group.product_ids:
                    if p.id not in current_cross_item_ids:
                        current_cross_item_ids.append(p.id)
            self.cross_sell_item_ids = [(6, 0, current_cross_item_ids)]

    def _get_uoms_the_same_category(self):
        for product in self:
            if product.uom_id:
                uoms = self.env["uom.uom"].search(
                    [("category_id", "=", product.uom_id.category_id.id), ("id", "!=", product.uom_id.id)])
                product.uom_ids = [(6, 0, [uom.id for uom in uoms])]
            else:
                product.uom_ids = [(6, 0, [])]

    @api.model_create_multi
    def create(self, vals_list):
        products = super(product_product, self).create(vals_list)
        for product in products:
            if product.available_in_pos:
                self.env["pos.config"].sync("product.product", product.id)
        return products

    def unlink(self):
        res = super().unlink()
        for product in self:
            self.env["pos.config"].unlink_record("product.product", product.id)
        return res

    def write(self, vals):
        res = super().write(vals)
        if ("available_in_pos" in vals.keys() and vals.get("available_in_pos") == False) or (
                "active" in vals.keys() and vals.get("active") == False):
            for product in self:
                self.env["pos.config"].unlink_record("product.product", product.id)
        return res


class product_template(models.Model):
    _inherit = "product.template"

    def write(self, vals):
        res = super(product_template, self).write(vals)
        for product_tmpl in self:
            products = self.env["product.product"].search([
                ("product_tmpl_id", "=", product_tmpl.id),
                ("available_in_pos", "=", True),
            ])
            for p in products:
                self.env["pos.config"].sync("product.product", p.id)
        if ("available_in_pos" in vals.keys() and vals.get("available_in_pos") == False) or (
                "active" in vals.keys() and vals.get("active") == False):
            products = self.env["product.product"].search([
                ("product_tmpl_id", "=", product_tmpl.id),
            ])
            for product in products:
                self.env["pos.config"].unlink_record("product.product", product.id)
        return res
