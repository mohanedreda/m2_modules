# -*- coding: utf-8 -*-
from odoo import api, fields, models, tools, _
from odoo.exceptions import UserError


class ResPartnerCreditProgram(models.Model):
    _name = "res.partner.credit.program"
    _description = "Customer's Credit Points Program"

    name = fields.Char('Name', required=True)
    rate = fields.Float(
        "Rate covert from Money to Credit Points",
        required=True,
        default=1,
        help="Example : set rate is 0.1 .\n"
             "1000 USD will become 100 points .\n"
             "1 point can payment for 10 USD .\n"
             "Default is 1"
    )

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if vals.get("rate", 0) <= 0:
                raise UserError(_("Error, rate required bigger than 0"))
        return super(ResPartnerCreditProgram, self).create(vals_list)

    def write(self, vals):
        if vals.get("rate", 0) <= 0:
            raise UserError(_("Error, rate required bigger than 0"))
        return super().write(vals)
