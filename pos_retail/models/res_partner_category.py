# -*- coding: utf-8 -*-
from odoo import api, models, fields, registry
import logging

_logger = logging.getLogger(__name__)

class ResPartnerCategory(models.Model):
    _inherit = "res.partner.category"

    pos_discount = fields.Integer("Pos Discount (%)")
    pos_discount_categ_ids = fields.Many2many(
        "pos.category",
        string="Discount POS Categories"
    )