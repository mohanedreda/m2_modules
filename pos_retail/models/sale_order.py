# -*- coding: utf-8 -*-
from odoo import models, fields, _, api
from datetime import datetime, timedelta

import logging

_logger = logging.getLogger(__name__)


class sale_order(models.Model):
    _inherit = "sale.order"

    delivery_name = fields.Char('POS Delivery Name')
    delivery_date = fields.Datetime('POS Delivery Date')
    delivered_date = fields.Datetime('POS Delivered Date')
    delivery_address = fields.Char('POS Delivery Address')
    delivery_phone = fields.Char('POS Delivery Phone')
    payment_partial_amount = fields.Float(
        'POS Partial Payment Amount',
    )
    payment_partial_method_id = fields.Many2one(
        'pos.payment.method',
        string='POS Payment Method'
    )

    @api.model
    def pos_create_sale_order(self, vals, sale_order_auto_confirm, sale_order_auto_invoice, sale_order_auto_delivery):
        vals['delivery_date']
        sale = self.create(vals)
        sale.order_line._compute_tax_id()
        if sale_order_auto_confirm:
            sale.action_confirm()
        if sale_order_auto_delivery and sale.picking_ids:
            for picking in sale.picking_ids:
                for move_line in picking.move_line_ids:
                    move_line.write({'qty_done': move_line.reserved_uom_qty})
                picking.action_assign()
                picking.button_validate()
        if sale_order_auto_confirm and sale_order_auto_invoice and sale.payment_partial_amount > 0:
            so_context = {
                'active_model': 'sale.order',
                'active_ids': [sale.id],
                'active_id': sale.id,
            }
            payment = self.env['sale.advance.payment.inv'].with_context(so_context).create({
                'advance_payment_method': 'fixed',
                'amount': sale.payment_partial_amount,
            })
            payment.create_invoices()
        return {'name': sale.name, 'id': sale.id}

    @api.model_create_multi
    def create(self, vals_list):
        sales = super(sale_order, self).create(vals_list)
        for sale in sales:
            if not sale.delivery_address:
                if sale.partner_shipping_id:
                    sale.delivery_address = sale.partner_shipping_id.contact_address
                else:
                    sale.delivery_address = sale.partner_id.contact_address
        return sales

    def write(self, vals):
        res = super(sale_order, self).write(vals)
        for sale in self:
            if not sale.delivery_address:
                if sale.partner_shipping_id:
                    sale.delivery_address = sale.partner_shipping_id.contact_address
                else:
                    sale.delivery_address = sale.partner_id.contact_address
        return res