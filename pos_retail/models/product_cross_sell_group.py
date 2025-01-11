# -*- coding: utf-8 -*-
from odoo import api, models, fields, registry
import logging

_logger = logging.getLogger(__name__)


class ProductCrossSellGroup(models.Model):
    _name = "product.cross.sell.group"
    _description = "Product Cross Sell Group"

    name = fields.Char('Group Name', required=True)
    product_ids = fields.Many2many(
        'product.product',
        string='Cross Sale Items',
        domain=[('cross_sell', '=', True), ('available_in_pos', '=', True)],
        required=True
    )