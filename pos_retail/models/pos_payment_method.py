# -*- coding: utf-8 -*-
from odoo import api, models, fields


class PosPaymentMethod(models.Model):
    _inherit = "pos.payment.method"

    is_credit = fields.Boolean("Is Credit")