# -*- coding: utf-8 -*-
from odoo import fields, api, models

import logging
import odoo
import time

_logger = logging.getLogger(__name__)


class StockLocation(models.Model):
    _inherit = "stock.location"

    pos_branch_id = fields.Many2one('pos.branch', string='Branch')
    location_address_id = fields.Many2one(
        'res.partner',
        string='Location Address'
    )

    @api.model_create_multi
    def create(self, vals_list):
        return super(StockLocation, self).create(vals_list)

    def pos_update_stock_on_hand_by_location_id(self, vals={}):
        _logger.info(vals)
        quant = self.env['stock.quant'].with_context(inventory_mode=True).create({
            'product_id': vals['product_id'],
            'location_id': vals['location_id'],
            'inventory_quantity': vals['quantity'],
        })
        quant.action_apply_inventory()
        location = self.env['stock.location'].browse(vals['location_id'])
        product = self.env['product.product'].with_context({'location': location.id}).browse(vals.get('product_id'))
        return {
            'location': location.name,
            'product': product.display_name,
            'quantity': product.qty_available
        }

    def _get_child_locations(self, location_id, location_ids=[]):
        location = self.browse(location_id)
        if location.child_ids:
            location_ids = list(set(location_ids + [child.id for child in location.child_ids]))
            for child in location.child_ids:
                if child.usage == 'internal':
                    child_location_ids = self._get_child_locations(child.id, location_ids)
                    location_ids = list(set(location_ids + child_location_ids))
        return location_ids


    def get_stocks_by_locations(self, product_ids=[], location_ids=[]):
        _logger.info("begin get_stocks_by_locations")
        productHasRemovedIds = []
        stock_datas = {}
        for location_id in location_ids:
            stock_datas[location_id] = {}
            location_ids = self._get_child_locations(location_id, [])
            location_ids.append(location_id)
            if len(location_ids) == 1:
                location_ids.append(0)
            if len(product_ids) == 1:
                product_ids.append(0)
            if len(location_ids) == 0:
                continue
            if not product_ids:
                sql = "SELECT pp.id FROM product_product as pp, product_template as pt where pp.product_tmpl_id=pt.id and pt.type = 'product'"
                self.env.cr.execute(sql)
                products = self.env.cr.dictfetchall()
                product_ids = [p.get('id') for p in products]
            for product_id in product_ids:
                sql = "SELECT sum(quantity - reserved_quantity) FROM stock_quant where location_id in %s AND product_id = %s"
                self.env.cr.execute(sql, (tuple(location_ids), product_id,))
                datas = self.env.cr.dictfetchall()
                stock_datas[location_id][product_id] = 0
                if datas and datas[0]:
                    if not datas[0].get('sum', None):
                        stock_datas[location_id][product_id] = 0
                    else:
                        stock_datas[location_id][product_id] = datas[0].get('sum')
                    self.env.cr.execute("select id from product_product where id=%s" % product_id)
                    datas = self.env.cr.dictfetchall()
                    if len(datas) != 1 and product_id != 0:
                        productHasRemovedIds.append(product_id)
                        continue
                    # TODO: supported product KIT (https://www.odoo.com/documentation/user/14.0/manufacturing/management/kit_shipping.html)
                    # product = self.env['product.product'].sudo().browse(product_id)
                    # hasBoms = self.env['mrp.bom'].sudo().search([
                    #     '|',
                    #     ('product_id', '=', product_id),
                    #     ('product_tmpl_id', '=', product.product_tmpl_id.id),
                    # ])
                    # if hasBoms:
                    #     product.with_context(location=location_id)
                    #     qty_available = product.qty_available
                    #     stock_datas[location_id][product_id] = qty_available
        _logger.info(">>> end get_stocks_by_locations")
        return stock_datas
