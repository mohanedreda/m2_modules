# -*- coding: utf-8 -*-
from odoo import api, models, fields, registry
from odoo.tools import DEFAULT_SERVER_DATETIME_FORMAT
from odoo.tools import date_utils

from datetime import datetime, timedelta
import logging
import json
import ast
import base64

_logger = logging.getLogger(__name__)


class PosCacheDatabase(models.Model):
    _name = "pos.cache.database"
    _description = "Management POS database"
    _rec_name = "res_id"
    _order = 'res_model'

    res_id = fields.Char('Id')
    res_model = fields.Char('Model')
    deleted = fields.Boolean('Deleted', default=0)

    def get_new_update_by_write_date(self, model_name, write_date):
        datas = []
        if model_name == 'product.product':
            product_params = self.env['pos.session']._loader_params_product_product()
            products = self.env['product.product'].with_context(display_default_code=False).search_read([
                ('write_date', '>=', write_date),
                ('sale_ok', '=', True),
                ('available_in_pos', '=', True)
            ], product_params['search_params']['fields'])
            categories = self.env['pos.session']._get_pos_ui_product_category(
            self.env['pos.session']._loader_params_product_category())
            product_category_by_id = {category['id']: category for category in categories}
            for product in products:
                product['categ'] = product_category_by_id[product['categ_id'][0]]
                product['image_128'] = bool(product['image_128'])
            datas = products
        if model_name == 'res.partner':
            partner_params = self.env['pos.session']._loader_params_res_partner()
            partners = self.env['res.partner'].with_context(display_default_code=False).search_read([
                ('write_date', '>=', write_date),
            ], partner_params['search_params']['fields'])
            datas = partners
        _logger.info('return of get_new_update_by_write_date()')
        _logger.info(datas)
        return datas

    def request_pos_sessions_online_reload_by_channel(self, channel):
        sessions = self.env['pos.session'].sudo().search([
            ('state', '=', 'opened')
        ])
        for session in sessions:
            self.env['bus.bus']._sendone(
                session.user_id.partner_id, channel, {})
        return True

    def get_fields_by_model(self, model_name):
        if model_name == 'product.product':
            params = self.env['pos.session'].sudo()._loader_params_product_product()['search_params']['fields']
        if model_name == 'res.partner':
            params = self.env['pos.session'].sudo()._loader_params_res_partner()['search_params']['fields']
        params.append("write_date")
        return params

    def get_domain_by_model(self, model_name):
        params = []
        if model_name == 'product.product':
            params = self.env['pos.session'].sudo()._loader_params_product_product()['search_params']['domain']
        if model_name == 'res.partner':
            params = self.env['pos.session'].sudo()._loader_params_res_partner()['search_params']['domain']
        params.append("write_date")
        return params

    def install_data(self, model_name=None, min_id=0, max_id=1999):
        old_log = self.env['pos.query.log'].sudo().search([
            ('min_id', '=', min_id),
            ('max_id', '=', max_id),
            ('call_model', '=', model_name)
        ], limit=1)
        datas = []
        if not old_log or (old_log and not old_log.call_results):
            datas = self.installing_datas(model_name, min_id, max_id)
        else:
            return json.loads(base64.decodebytes(old_log.call_results).decode('utf-8'))
        return datas

    def installing_datas(self, model_name, min_id, max_id):
        _logger.info(">>> Begin installing_datas with model: %s and min_id %s and max_id %s" % (model_name, min_id, max_id))
        cache_obj = self.sudo()
        log_obj = self.env['pos.query.log'].sudo()
        domain = [('id', '>=', min_id), ('id', '<=', max_id)]
        categories = None
        product_category_by_id = None
        if model_name == 'product.product':
            domain.append(('available_in_pos', '=', True))
            domain.append(('sale_ok', '=', True))
            categories = self.env['pos.session']._get_pos_ui_product_category(self.env['pos.session']._loader_params_product_category())
            product_category_by_id = {category['id']: category for category in categories}
        field_list = cache_obj.get_fields_by_model(model_name)
        datas = self.env[model_name].sudo().with_context(display_default_code=False).search_read(domain, field_list)
        datas = log_obj.covert_datetime(model_name, datas)
        if model_name == 'product.product' and product_category_by_id:
            for product in datas:
                product['categ'] = product_category_by_id[product['categ_id'][0]]
                product['image_128'] = bool(product['image_128'])
        vals = {
            'active': True,
            'min_id': min_id,
            'max_id': max_id,
            'call_results': base64.encodebytes(json.dumps(datas, default=date_utils.json_default).encode('utf-8')),
            'call_model': model_name,
        }
        logs = log_obj.search([
            ('min_id', '=', min_id),
            ('max_id', '=', max_id),
            ('call_model', '=', model_name),
        ])
        if logs:
            logs.write(vals)
        else:
            log_obj.create(vals)
        _logger.info(">>>> End installing_datas with model: %s and min_id %s and max_id %s" % (model_name, min_id, max_id))
        return datas

    def insert_data(self, model, record_id):
        if type(model) == list:
            return False
        last_caches = self.search([('res_id', '=', str(record_id)), ('res_model', '=', model)], limit=1)
        if last_caches:
            last_caches.write({
                'res_model': model,
                'deleted': False
            })
        else:
            self.create({
                'res_id': str(record_id),
                'res_model': model,
                'deleted': False
            })
        return True

    def get_data(self, model, record_id):
        data = {
            'model': model
        }
        fields_read_load = self.sudo().get_fields_by_model(model)
        if model in ['res.partner', 'product.product']:
            fields_read_load.append('active')
        if model == 'product.product':
            fields_read_load.append('sale_ok')
        vals = self.env[model].sudo().search_read([('id', '=', record_id)], fields_read_load)
        if vals:
            data.update(vals[0])
            return data
        else:
            return None

    def remove_record(self, model, record_id):
        records = self.sudo().search([('res_id', '=', str(record_id)), ('res_model', '=', model)])
        if records:
            records.write({
                'deleted': True,
            })
        else:
            vals = {
                'res_id': str(record_id),
                'res_model': model,
                'deleted': True,
            }
            self.create(vals)
        return True

    def save_parameter_models_load(self, model_datas):
        for model_name, value in model_datas.items():
            self.env['ir.config_parameter'].sudo().set_param(model_name, value)
        return True
