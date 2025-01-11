# -*- coding: utf-8 -*-
from odoo import api, models, fields


class AccountBankStatementLine(models.Model):
    _inherit = 'account.bank.statement.line'

    pos_payment_id = fields.Many2one('pos.payment', string='POS Payment')
    pos_order_id = fields.Many2one('pos.order', string="POS Order", ondelete='cascade', copy=False)

    # @api.model_create_multi
    # def create(self, vals_list):
    #     for val in vals_list:
    #         if val.get('pos_session_id', None) and val.get('payment_ref', None):
    #             session_id = val.get('pos_session_id', None)
    #             amount = val.get('amount', None)
    #             payment = self.env['pos.payment'].search(
    #                 [('session_id', '=', session_id), ('amount', '=', amount)], limit=1)
    #             if payment:
    #                 val.update({
    #                     'pos_payment_id': payment.id,
    #                     'pos_order_id': payment.pos_order_id.id
    #                 })
    #     lines = super().create(vals_list)
    #     return lines
