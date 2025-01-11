# -*- coding: utf-8 -*-
from odoo import api, fields, models, _
from odoo.tools import DEFAULT_SERVER_DATETIME_FORMAT
from odoo.tools import date_utils

import logging
from datetime import datetime, timedelta
import logging
import json
import ast
import base64

_logger = logging.getLogger(__name__)


class PosSession(models.Model):
    _inherit = "pos.session"

    index_db = fields.Boolean(related="config_id.index_db", readonly=True)

    def _get_pos_ui_product_product(self, params):
        _logger.info(">>>>>>>>>> begin _get_pos_ui_product_product")
        products = []
        if self.config_id.index_db:
            # todo: for supported pos_loyalty, if pos_loyalty not install, no need
            self = self.with_context(**params['context'])
            rewards = self.config_id._get_program_ids().reward_ids
            loyalty_products = rewards.discount_line_product_id | rewards.reward_product_ids
            loyalty_products |= self.config_id._get_program_ids().filtered(
                lambda p: p.program_type == 'ewallet').trigger_product_ids
            # Only load products that are not already in the result
            loyalty_products = list(set(loyalty_products.ids))
            loyalty_products = self.env['product.product'].search_read([
                ('id', 'in', loyalty_products)],
                fields=params['search_params']['fields'])
            self._process_pos_ui_product_product(loyalty_products)

            _logger.info("products of pos loyalty parameters: %s" % loyalty_products)
            _logger.info(">>>>>>>>>>> big data active")
            products.extend(loyalty_products)
        else:
            products = super(PosSession, self)._get_pos_ui_product_product(params)
        if self.config_id.credit_feature and self.config_id.credit_product_id:
            credit_product = self.env["product.product"].search_read([
                ("id", "=", self.config_id.credit_product_id.id)
            ],
                fields=params["search_params"]["fields"])
            self._process_pos_ui_product_product(credit_product)
            products.extend(credit_product)
        return products

    def _get_pos_ui_res_partner(self, params):
        _logger.info("begin _get_pos_ui_res_partner")
        if self.config_id.index_db:
            _logger.info(">>>>>>>>>>> big data active")
            return []
        else:
            return super(PosSession, self)._get_pos_ui_res_partner(params)

    def get_pos_ui_product_product_by_params(self, custom_search_params):
        return super(PosSession, self).get_pos_ui_product_product_by_params(custom_search_params)

    def get_pos_ui_res_partner_by_params(self, custom_search_params):
        return super(PosSession, self).get_pos_ui_res_partner_by_params(custom_search_params)
