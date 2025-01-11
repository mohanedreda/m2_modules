# -*- coding: utf-8 -*-
from . import models
from . import controller
from . import report
from . import wizard

from odoo import api, SUPERUSER_ID
import logging

_logger = logging.getLogger(__name__)

def _auto_clean_cache_when_installed(cr):
    env = api.Environment(cr, SUPERUSER_ID, {})
    # caches = env['pos.cache.database'].search([])
    # caches.unlink()
    # env['ir.config_parameter'].sudo().set_param('license_started_date', fields.Date.today())
    _logger.info('!!!!!!! Removed caches !!!!!!!')
    _logger.info('!!!!!!! THANKS FOR PURCHASED MODULE !!!!!!!')

