# -*- coding: utf-8 -*-
from odoo import api, models, fields, registry
import logging

_logger = logging.getLogger(__name__)


class ProductPackGroup(models.Model):
    _name = "product.pack.group"
    _description = "Product Pack Group"

    name = fields.Char('Name', required=True)
    max_qty_selected = fields.Integer('Max qty selected', default=10)
    item_ids = fields.One2many(
        'product.pack',
        'group_id',
        string='Items'
    )

class ProductPack(models.Model):
    _name = "product.pack"
    _description = "Product Pack"

    product_id = fields.Many2one(
        "product.product",
        string="Product",
        domain=[('available_in_pos', '=', True)],
        required=True)
    extra_price = fields.Float("Price Extra", default=0.0)
    extra_discount = fields.Float('Discount Extra (%)')
    lst_price = fields.Float("Original Price", related="product_id.lst_price")
    sale_price = fields.Float(compute='_get_sale_price', store=True, string='Sale Price')
    group_id = fields.Many2one("product.pack.group")
    default_selected = fields.Boolean('Default selected')
    default_required = fields.Boolean('Required selected')

    @api.depends('extra_price', 'extra_discount', 'lst_price', 'product_id')
    def _get_sale_price(self):
        for item in self:
            item.sale_price = item.lst_price + item.extra_price
            item.sale_price = item.sale_price - (item.sale_price * item.extra_discount / 100)