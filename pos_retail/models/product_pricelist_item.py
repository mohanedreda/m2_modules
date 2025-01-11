# -*- coding: utf-8 -*-
from odoo import api, fields, models, _

import logging
_logger = logging.getLogger(__name__)

class product_pricelist_item(models.Model):
    _inherit = "product.pricelist.item"

    applied_on = fields.Selection(selection_add=[
        ('pos_category', "POS Category")
    ], ondelete={'pos_category': 'set default'})
    pos_category_ids = fields.Many2many('pos.category', string="Pos Category")

    @api.onchange('applied_on')
    def _oc_applied_on(self):
        if self.applied_on == 'pos_category':
            self.product_id = None
            self.product_tmpl_id = None
    @api.model_create_multi
    def create(self, vals_list):
        pricelist_items = super(product_pricelist_item, self).create(vals_list)
        for pricelist_item in pricelist_items:
            self.env['pos.config'].sync('product.pricelist', pricelist_item.pricelist_id.id)
        return pricelist_items

    def write(self, vals):
        res = super(product_pricelist_item, self).write(vals)
        for pricelist_item in self:
            self.env['pos.config'].sync('product.pricelist', pricelist_item.pricelist_id.id)
        return res