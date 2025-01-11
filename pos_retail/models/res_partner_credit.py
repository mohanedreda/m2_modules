# -*- coding: utf-8 -*-
from odoo import api, fields, models, tools, _

class ResPartnerCredit(models.Model):
    _name = "res.partner.credit"
    _description = "Customer's Credit Points"

    name = fields.Char('Name', required=True)
    amount = fields.Float('Amount', required=True)
    type = fields.Selection([
        ('plus', 'Plus (Credit)'),
        ('redeem', 'Redeem (Debit)')
    ], required=True, default="plus")
    partner_id = fields.Many2one('res.partner', 'Customer', required=True)
    pos_order_id = fields.Many2one('pos.order', 'POS order', readonly=True)
    create_date = fields.Datetime('Created date', readonly=True)
    payment_id = fields.Many2one('pos.payment', 'Payment Used', readonly=True)
    active = fields.Boolean('Active', default=True)
    move_id = fields.Many2one('account.move', 'Credit Note', readonly=True)
