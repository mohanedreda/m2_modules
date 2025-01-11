from odoo import models, fields, _, api
from datetime import datetime, timedelta

import logging

_logger = logging.getLogger(__name__)


class sale_order_line(models.Model):
    _inherit = "sale.order.line"

    note = fields.Text("Note")