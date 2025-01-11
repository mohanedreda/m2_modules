# -*- coding: utf-8 -*-

from odoo import fields, models, api


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    index_db = fields.Boolean(related='pos_config_id.index_db', readonly=False, store=True)
