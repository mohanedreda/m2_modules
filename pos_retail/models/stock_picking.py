# -*- coding: utf-8 -*-
from odoo import fields, api, models
from odoo.tools import float_is_zero, float_compare
from odoo.exceptions import UserError, ValidationError

from itertools import groupby
import logging

_logger = logging.getLogger(__name__)


class StockPicking(models.Model):
    _inherit = "stock.picking"

    def _prepare_stock_move_vals(self, first_line, order_lines):
        val = super()._prepare_stock_move_vals(first_line, order_lines)
        val[
            "product_uom"] = first_line.product_uom_id.id if first_line.product_uom_id else first_line.product_id.uom_id.id
        return val

    def _create_move_for_bom_component(self, lines):
        pos_config = lines[0].order_id.config_id
        if not pos_config.products_multi_unit:
            return super()._create_move_for_bom_component(lines)
        else:
            # TODO: we group by lines with 2 key (product_id and product_uom_id)
            lines_by_product = groupby(sorted(lines, key=lambda l: str(l.product_id.id) + "_" + str(
                l.product_uom_id.id) if l.product_uom_id else "0"), key=lambda l: str(l.product_id.id) + "_" + str(
                l.product_uom_id.id) if l.product_uom_id else "0")
            move_vals = []
            for dummy, olines in lines_by_product:
                order_lines = self.env['pos.order.line'].concat(*olines)
                move_vals.append(self._prepare_stock_move_vals(order_lines[0], order_lines))
            moves = self.env['stock.move'].create(move_vals)
            confirmed_moves = moves._action_confirm()
            confirmed_moves._add_mls_related_to_order(lines, are_qties_done=True)
            self._link_owner_on_return_picking(lines)

    def _create_picking_for_bom_component(self, pos_order, location_dest_id, positive_lines, negative_lines,
                                          picking_type, partner=False):
        pickings = self.env['stock.picking']
        if positive_lines:
            location_id = picking_type.default_location_src_id.id
            positive_picking = self.env['stock.picking'].create(
                self._prepare_picking_vals(partner, picking_type, location_id, location_dest_id)
            )
            positive_picking.pos_order_id = pos_order.id
            positive_picking.pos_session_id = pos_order.session_id.id
            positive_picking._create_move_for_bom_component(positive_lines)
            self.env.flush_all()
            try:
                with self.env.cr.savepoint():
                    positive_picking._action_done()
            except (UserError, ValidationError):
                pass

            pickings |= positive_picking
        if negative_lines:
            if picking_type.return_picking_type_id:
                return_picking_type = picking_type.return_picking_type_id
                return_location_id = return_picking_type.default_location_dest_id.id
            else:
                return_picking_type = picking_type
                return_location_id = picking_type.default_location_src_id.id

            negative_picking = self.env['stock.picking'].create(
                self._prepare_picking_vals(partner, return_picking_type, location_dest_id, return_location_id)
            )
            negative_picking.pos_order_id = pos_order.id
            negative_picking.pos_session_id = pos_order.session_id.id
            negative_picking._create_move_for_bom_component(negative_lines)
            self.env.flush_all()
            try:
                with self.env.cr.savepoint():
                    negative_picking._action_done()
            except (UserError, ValidationError):
                pass
            pickings |= negative_picking
        return pickings

    def _prepare_stock_move_vals_for_bom_component(self, component, product_qty_sold_out):
        if product_qty_sold_out < 0:
            product_qty_sold_out = -product_qty_sold_out
        return {
            'name': component.product_id.name,
            'product_uom': component.product_id.uom_id.id,
            'picking_id': self.id,
            'picking_type_id': self.picking_type_id.id,
            'product_id': component.product_id.id,
            'product_uom_qty': component.quantity * product_qty_sold_out,
            'location_id': self.location_id.id,
            'location_dest_id': self.location_dest_id.id,
            'company_id': self.company_id.id,
        }

    def _create_move_for_bom_component(self, lines):
        self.ensure_one()
        move_vals = []
        for bom_id, qty in lines.items():
            bom = self.env['pos.product.bom'].browse(bom_id)
            for component in bom.component_ids:
                move_vals.append(self._prepare_stock_move_vals_for_bom_component(component, qty))
        moves = self.env['stock.move'].create(move_vals)
        confirmed_moves = moves._action_confirm()
        confirmed_moves.picked = True
