# -*- coding: utf-8 -*-

import hashlib

from odoo import api, models, _, fields
from odoo.exceptions import UserError


class HrEmployee(models.Model):
    _inherit = 'hr.employee'

    point_of_sale_security = fields.Boolean("Point Of Sale Security")
    disable_set_discount = fields.Boolean("Disable Set Discount Button")
    disable_set_price = fields.Boolean("Disable Set Price Button")
    disable_remove_line = fields.Boolean("Disable Remove Line Button")
    disable_plus_minus = fields.Boolean("Disable +/- button")
    disable_set_payment = fields.Boolean("Disable Payment Button")
    disable_set_customer = fields.Boolean("Disable Set Customer Button")
    disable_remove_order = fields.Boolean("Disable Remove Order Button")
    disable_return_order = fields.Boolean("Disable Return Order")

    @api.onchange("point_of_sale_security")
    def _oc_point_of_sale_security(self):
        if not self.point_of_sale_security:
            self.disable_set_discount = self.disable_set_price = self.disable_remove_line = self.disable_plus_minus = self.disable_set_payment = self.disable_set_customer = self.disable_remove_order = self.disable_return_order = False
