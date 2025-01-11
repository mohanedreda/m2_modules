# -*- coding: utf-8 -*-
from odoo import api, fields, models, _
from odoo.exceptions import UserError

class ProductUomPrice(models.Model):
    _name = "product.uom.price"
    _description = "Management product price each unit"

    uom_id = fields.Many2one('uom.uom', 'Uom', required=True)
    product_id = fields.Many2one('product.product', 'Product', domain=[('available_in_pos', '=', True)], required=True)
    price = fields.Float('Price of Unit')

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            product = self.env['product.product'].browse(vals.get('product_id'))
            unit = self.env['uom.uom'].browse(vals.get('uom_id'))
            if product.uom_id and product.uom_id.category_id != unit.category_id:
                raise UserError('Please choose unit the same category of this product, for made linked stock inventory')
        return super(ProductUomPrice, self).create(vals)

    def write(self, vals):
        if vals.get('uom_id', None):
            unit_will_change = self.env['product.uom'].browse(vals.get('uom_id'))
            for uom_price in self:
                if uom_price.product_id.uom_id and uom_price.product_id.uom_id.category_id != unit_will_change.category_id:
                    raise UserError(
                        'Please choose unit the same category of base product unit is %s, for made linked stock inventory' % uom_price.product_tmpl_id.uom_id.category_id.name)
        return super(ProductUomPrice, self).write(vals)
