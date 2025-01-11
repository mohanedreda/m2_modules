# -*- coding: utf-8 -*-
from odoo import api, models, fields


class PosOrder(models.Model):
    _inherit = "pos.order"

    sale_id = fields.Many2one("sale.order", string="Sale order")
    signature = fields.Binary('Signature', readonly=True)
    remove_reason = fields.Text("Remove Reason", readonly=True)
    remove_user_id = fields.Many2one("res.users", "User Removed")
    pos_branch_id = fields.Many2one(
        'pos.branch',
        related='session_id.pos_branch_id',
        store=True,
        string='Branch',
        readonly=True)
    type_id = fields.Many2one('pos.order.type', string='Order Type')
    delivery_address = fields.Char('Delivery Address')

    @api.model
    def create_from_ui(self, orders, draft=False):
        for order in orders:
            if order.get('data').get('offline_partner_value', None):
                partner_value = order.get('data').get('offline_partner_value', None)
                if partner_value.get('__action_type__', None) == 'create':
                    del partner_value['__action_type__']
                    partner = self.env['res.partner'].create(partner_value)
                    del order['data']['offline_partner_value']
                    order['data']['partner_id'] = partner.id
                if partner_value.get('__action_type__', None) == 'write':
                    del partner_value['__action_type__']
                    self.env['res.partner'].browse(partner_value['id']).write(partner_value)
                    del order['data']['offline_partner_value']
        return super().create_from_ui(orders=orders, draft=draft)
    @api.model
    def _order_fields(self, ui_order):
        data = super()._order_fields(ui_order)
        if ui_order.get('type_id', None):
            data['type_id'] = ui_order.get('type_id')
        if ui_order.get('delivery_address', None):
            data['delivery_address'] = ui_order.get('delivery_address')
        return data

    def action_pos_order_paid(self):
        # todo 1: continue code here
        # todo 2: how about refund order, refund order not use credit ?
        res = super().action_pos_order_paid()
        have_credit_lines = any(line.product_id.is_credit for line in self.lines)
        credit_obj = self.env["res.partner.credit"]
        if self.config_id.credit_feature and have_credit_lines and self.partner_id:
            credit_lines = self.lines.filtered(lambda l: l.product_id.is_credit)
            amount = sum(l.price_subtotal_incl for l in credit_lines)
            credit_value = {
                "amount": amount * self.config_id.credit_program_id.rate,
                "partner_id": self.partner_id.id,
                "pos_order_id": self.id,
                "name": self.name,
            }
            if amount > 0:
                credit_value.update({
                    "type": "plus"
                })
            else:
                credit_value.update({
                    "type": "redeem"
                })
            credit_obj.create(credit_value)
            self.env["pos.config"].sync("res.partner", self.partner_id.id)
        order_use_credit = any(p.payment_method_id.is_credit for p in self.payment_ids)
        if order_use_credit and self.partner_id:
            credit_payments = self.payment_ids.filtered(lambda p: p.payment_method_id.is_credit)
            amount = sum(p.amount for p in credit_payments)
            credit_value = {
                "amount": amount * self.config_id.credit_program_id.rate,
                "partner_id": self.partner_id.id,
                "pos_order_id": self.id,
                "payment_id": credit_payments[0].id if len(credit_payments) == 1 else None,
                "name": self.name,
                "type": "redeem"
            }
            if credit_value.get("amount") < 0:
                credit_value["amount"] = -credit_value.get("amount")
                credit_value["type"] = "plus"
            credit_obj.create(credit_value)
            self.env["pos.config"].sync("res.partner", self.partner_id.id)
        return res

    @api.model
    def _payment_fields(self, order, ui_paymentline):
        payment_values = super()._payment_fields(order, ui_paymentline)
        payment_values.update({
            'covert_change_to_credit': ui_paymentline.get('covert_change_to_credit', False),
            'used_credit_payment': ui_paymentline.get('used_credit_payment', False),
            'currency_id': ui_paymentline.get('currency_id', None),
            'currency_amount': ui_paymentline.get('currency_amount', 0),
            'payment_reference': ui_paymentline.get('payment_reference', '')
        })
        return payment_values

    def write(self, values):
        if values.get('remove_reason', None):
            values.update({"remove_user_id": self.env.user.id})
        return super().write(values)

    def _process_saved_order(self, draft):
        res = super()._process_saved_order(draft)
        if not draft and self.config_id.enable_bom:
            positive_lines = {}
            negative_lines = {}
            for line in self.lines:
                if line.qty == 0 or line.pack_lot_ids:
                    continue
                bom_of_line = self.env['pos.product.bom'].search([
                    ('product_id', '=', line.product_id.id)
                ], limit=1)
                if bom_of_line:
                    if line.qty > 0:
                        if not positive_lines.get(bom_of_line.id, None):
                            positive_lines[bom_of_line.id] = line.qty
                        else:
                            positive_lines[bom_of_line.id] += line.qty
                    else:
                        if not negative_lines.get(bom_of_line.id, None):
                            negative_lines[bom_of_line.id] = line.qty
                        else:
                            negative_lines[bom_of_line.id] += line.qty
            if positive_lines or negative_lines:
                picking_type = self.config_id.picking_type_id
                if self.partner_id.property_stock_customer:
                    destination_id = self.partner_id.property_stock_customer.id
                elif not picking_type or not picking_type.default_location_dest_id:
                    destination_id = self.env['stock.warehouse']._get_partner_locations()[0].id
                else:
                    destination_id = picking_type.default_location_dest_id.id
                self.env['stock.picking']._create_picking_for_bom_component(self, destination_id, positive_lines,
                                                                            negative_lines, picking_type,
                                                                            self.partner_id)
        return res
