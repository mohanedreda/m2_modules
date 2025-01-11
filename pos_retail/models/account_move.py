# -*- coding: utf-8 -*-
from odoo import api, models, fields


class AccountMove(models.Model):
    _inherit = "account.move"

    pos_branch_id = fields.Many2one(
        'pos.branch',
        string='Branch',
        readonly=True)
    def pos_post_account_move(self, payment_id):
        for invoice in self.filtered(lambda move: move.is_invoice()):
            payment = self.env["account.payment"].browse(payment_id)
            move_lines = payment.line_ids.filtered(
                lambda line: line.account_type in ('asset_receivable', 'liability_payable') and not line.reconciled)
            for line in move_lines:
                invoice.js_assign_outstanding_line(line.id)
        return True
