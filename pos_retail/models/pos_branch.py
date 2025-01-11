# -*- coding: utf-8 -*-
from odoo import api, models, fields, registry
import logging

_logger = logging.getLogger(__name__)

class PosBranch(models.Model):
    _name = "pos.branch"
    _description = "Branch of shop"

    name = fields.Char('Branch Name', required=True)
    user_id = fields.Many2one(
        'res.users',
        'Branch Manager',
        required=True,
        help='Manager of this Branch'
    )