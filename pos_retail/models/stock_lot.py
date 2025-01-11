# -*- coding: utf-8 -*-

from odoo import api, models
from odoo.tools import float_compare


class ProductionLot(models.Model):
    _inherit = "stock.lot"

    @api.model
    def get_lots_by_product_id(self, product_id, company_id):
        lots = self.sudo().search(
            [
                "&",
                ["product_id", "=", product_id],
                "|",
                ["company_id", "=", company_id],
                ["company_id", "=", False],
            ]
        )

        lots = lots.filtered(
            lambda l: float_compare(
                l.product_qty, 0, precision_digits=l.product_uom_id.rounding
            )
            > 0
        )

        return lots.mapped("name")
