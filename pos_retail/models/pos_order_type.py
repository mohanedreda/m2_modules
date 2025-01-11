# -*- coding: utf-8 -*-
from odoo import api, models, fields, registry
import logging

_logger = logging.getLogger(__name__)

class PosOrderType(models.Model):
    _name = "pos.order.type"
    _description = "POS Order Type"

    name = fields.Char('Name', required=True)
    home_delivery = fields.Boolean('Is Home Delivery ?')
    active = fields.Boolean('Active')