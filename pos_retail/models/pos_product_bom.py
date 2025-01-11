# -*- coding: utf-8 -*-
from odoo import api, models, fields, registry
import logging

_logger = logging.getLogger(__name__)


class PosProductBom(models.Model):
    _name = "pos.product.bom"
    _description = "Product Bill of material"
    _sql_constraints = [
        ('uniq_product_id', 'unique(product_id)',
         'Product must be unique. Each product only one BOM, System have another BOM of current Product you selected'),
    ]

    name = fields.Char('Bom Name', required=True)
    quantity = fields.Float('Quantity', required=True)
    product_id = fields.Many2one('product.product', string='Product', required=True)
    component_ids = fields.One2many(
        'pos.product.bom.component',
        'bom_id',
        string='Components'
    )
    active = fields.Boolean('Active', default=True)


class PosProductBomComponent(models.Model):
    _name = "pos.product.bom.component"
    _description = "Bom Components"

    bom_id = fields.Many2one('pos.product.bom', 'Bom', required=True)
    quantity = fields.Float('Quantity', help='This is qty will redeem stock when 1 qty Bom sold out', required=True)
    product_id = fields.Many2one('product.product', domain=[('detailed_type', '=', 'product')], string='Component')
