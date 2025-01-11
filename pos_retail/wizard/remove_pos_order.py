# -*- coding: utf-8 -*-
from odoo import fields, models, api, _
from odoo.exceptions import UserError
import logging

_logger = logging.getLogger(__name__)


class remove_pos_order(models.TransientModel):
    _name = "remove.pos.order"
    _description = "Remove pos order"

    pos_security_pin = fields.Char("Pos security pin")

    def remove_pos_orders(self):
        _logger.info('BEGIN remove_pos_orders')
        user = self.env.user
        order_obj = self.env['pos.order']
        orders = self.env['pos.order'].browse(self.env.context.get('active_ids', []))
        if not user.pos_delete_order:
            raise UserError(_('Warning!\n'
                              'You are not allowed to perform this operation ! \n'
                              'If you need to do it, please contact your admin, go to Setting/User active it'))
        if user.pos_pin != int(self.pos_security_pin):
            raise UserError(_('Warning!\n'
                              'Please Enter correct PIN!'))
        if not orders:
            raise UserError(_('Warning!\n'
                              'Please select order!'))
        order_ids = [order.id for order in orders]
        if len(order_ids) == 1:
            order_ids.append(0)
        self.env.cr.execute("delete from pos_payment where pos_order_id in %s", (tuple(order_ids),) )
        self.env.cr.commit()
        orders = order_obj.browse(order_ids)
        picking_ids = []
        for order in orders:
            for p in order.picking_ids:
                picking_ids.append(p.id)
        del_rec_line = ''' delete from pos_order
                                WHERE id in %s''' % (" (%s) " % ','.join(map(str, order_ids)))
        self.env.cr.execute(del_rec_line)
        if picking_ids:
            del_pack_line = ''' delete from stock_move_line
                                    WHERE picking_id in %s''' % (" (%s) " % ','.join(map(str, picking_ids)))
            self.env.cr.execute(del_pack_line)
            del_move_line = ''' delete from stock_move
                                    WHERE picking_id in %s''' % (" (%s) " % ','.join(map(str, picking_ids)))
            self.env.cr.execute(del_move_line)
            del_picking_line = ''' delete from stock_picking
                                    WHERE id in %s''' % (" (%s) " % ','.join(map(str, picking_ids)))
            self.env.cr.execute(del_picking_line)
        return True
