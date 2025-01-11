# -*- coding: utf-8 -*-

from odoo import models, api


class PurchaseOrder(models.Model):
    _inherit = "purchase.order"

    @api.model
    def pos_create_purchase(self, vals):
        po_ids = []
        for val in vals:
            value = {
                'partner_id': val.get('partner_id'),
                'payment_term_id': val.get('payment_term_id'),
                'order_line': [],
                'origin': val.get('name')
            }
            for line in val.get('lines'):
                line = line[2]
                line_val = {
                    'product_qty': line.get('qty'),
                    'price_unit':  line.get('price_unit'),
                    'price_subtotal':  line.get('price_subtotal'),
                    'product_id': line.get('product_id'),
                    'taxes_id': line.get('tax_ids'),
                }
                value.get('order_line').append((0, 0, line_val))

            po = self.create(value)
            po_ids.append(po.id)
        return po_ids
