# -*- coding: utf-8 -*-
from odoo import api, fields, models, _
from odoo.exceptions import UserError
import logging

_logger = logging.getLogger(__name__)


class res_partner(models.Model):
    _inherit = "res.partner"

    discount_group = fields.Boolean("Active Discount Group")
    discount_group_id = fields.Many2one(
        "res.partner.category",
        string="Discount Group",
        domain=[("pos_discount", ">", 0), ("pos_discount_categ_ids", "!=", None)]
    )
    credit = fields.Float(
        digits=(16, 4),
        compute="_compute_debit_credit_balance",
        string="Credit",
        store=True,
        help="Credit amount of this customer can use")
    debit = fields.Float(
        digits=(16, 4),
        compute="_compute_debit_credit_balance",
        string="Debit",
        store=True,
        help="Debit amount of this customer")
    balance = fields.Float(
        digits=(16, 4),
        compute="_compute_debit_credit_balance",
        string="Balance",
        store=True,
        help="Balance amount customer can use paid on pos")
    limit_debit = fields.Float(
        "Limit Debit",
        help="Limit credit amount can add to this customer")
    credit_history_ids = fields.One2many(
        "res.partner.credit",
        "partner_id",
        "Credit Points")

    @api.depends("credit_history_ids.partner_id", "credit_history_ids.amount", "credit_history_ids.type", "limit_debit")
    def _compute_debit_credit_balance(self):
        for partner in self:
            partner.credit = 0
            partner.debit = 0
            partner.balance = 0
            for credit in partner.credit_history_ids:
                if credit.type == "plus":
                    partner.credit += credit.amount
                if credit.type == "redeem":
                    partner.debit += credit.amount
            partner.balance = partner.credit + partner.limit_debit - partner.debit
        return True

    def _oc_discount_group(self):
        if not self.discount_group:
            self.discount_group_id = None

    @api.model_create_multi
    def create(self, vals_list):
        partners = super(res_partner, self).create(vals_list)
        for partner in partners:
            self.env["pos.config"].sync("res.partner", partner.id)
        return partners

    def write(self, vals):
        res = super(res_partner, self).write(vals)
        for partner in self:
            self.env["pos.config"].sync("res.partner", partner.id)
        if "active" in vals.keys() and vals.get("active") == False:
            for partner in self:
                self.env["pos.config"].unlink_record("res.partner", partner.id)
        return res

    def unlink(self):
        res = super().unlink()
        for partner in self:
            if partner.pos_order_count > 0:
                raise UserError(_("Error, customer have pos order, it not possible remove it"))
            else:
                self.env["pos.config"].unlink_record("res.partner", partner.id)
        return res
