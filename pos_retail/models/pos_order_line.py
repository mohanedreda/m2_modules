# -*- coding: utf-8 -*-
from odoo import api, models, fields


class PosOrderLine(models.Model):
    _inherit = "pos.order.line"

    product_uom_id = fields.Many2one('uom.uom', string='Product UoM', related=False, readonly=True)
    extra_discount = fields.Float("Extra Discount", readonly=True)
    pos_branch_id = fields.Many2one(
        'pos.branch',
        related='order_id.pos_branch_id',
        store=True,
        string='Branch',
        readonly=True)

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if not vals.get("product_uom_id", None):
                product = self.env["product.product"].browse(vals.get("product_id"))
                vals.update({"product_uom_id": product.uom_id.id if product.uom_id else None})
        partners = super(PosOrderLine, self).create(vals_list)
        return partners
