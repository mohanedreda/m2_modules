# -*- coding: utf-8 -*-
from odoo import api, fields, models, _
from odoo.exceptions import ValidationError

import logging

_logger = logging.getLogger(__name__)


class ProductBarcode(models.Model):
    _name = "product.barcode"
    _description = "Product multi barcode"

    name = fields.Char("Barcode", required=True)
    product_id = fields.Many2one("product.product", string="Product", required=True)

    @api.constrains('name')
    def check_unique_name(self):
        for rec in self:
            products = self.env['product.product'].sudo().search([
                '|', ('barcode', '=', rec.name),
                ('product_barcode_ids.name', '=', rec.name),
                ('id', '!=', rec.product_id.id)
            ])
            if products:
                raise ValidationError(_('Barcode must be unique!'))
            else:
                barcodes = self.env['product.barcode'].search(
                    [('name', '=', rec.name), ('id', '!=', rec.id)])
                if barcodes:
                    raise ValidationError(_('Barcode must be unique!'))
