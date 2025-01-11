# -*- coding: utf-8 -*-
from odoo import api, fields, models, _

import logging

_logger = logging.getLogger(__name__)


class PosConfig(models.Model):
    _inherit = 'pos.config'

    index_db = fields.Boolean("Indexed Database")
