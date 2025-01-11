# -*- coding: utf-8 -*-
from odoo import api, fields, models, _
import logging
_logger = logging.getLogger(__name__)

class product_pricelist(models.Model):
    _inherit = "product.pricelist"

    @api.model_create_multi
    def create(self, vals_list):
        pricelists = super(product_pricelist, self).create(vals_list)
        for pricelist in pricelists:
            self.env['pos.config'].sync('product.pricelist', pricelist.id)
        return pricelists

    def write(self, vals):
        res = super(product_pricelist, self).write(vals)
        for pricelist in self:
            self.env['pos.config'].sync('product.pricelist', pricelist.ids[0])
        return res