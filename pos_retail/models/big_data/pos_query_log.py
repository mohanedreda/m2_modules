# -*- coding: utf-8 -*-
from odoo import api, fields, models, _
from odoo.tools import date_utils
from odoo.tools import DEFAULT_SERVER_DATETIME_FORMAT

import logging
import json
import base64

_logger = logging.getLogger(__name__)


class PosQueryLog(models.Model):
    _name = "pos.query.log"
    _description = "Save all query log from POS Interface"

    active = fields.Boolean("Active")
    call_results = fields.Binary("Results", attachment=False, readonly=True)
    call_model = fields.Char("Model", required=True, index=True, readonly=True)
    write_date = fields.Datetime("Write date", readonly=True)
    min_id = fields.Integer()
    max_id = fields.Integer()

    def get_all_datas(self):
        datas = self.search([("active", "=", True)])
        values = []
        for d in datas:
            result = json.loads(base64.decodebytes(d.call_results).decode("utf-8"))
            values.append({
                "result": result,
                "model": d.call_model,
            })
        return values

    def get_fields_by_model(self, model_name):
        if model_name == "product.product":
            params = self.env["pos.session"].sudo()._loader_params_product_product()["search_params"]["fields"]
        if model_name == "res.partner":
            params = self.env["pos.session"].sudo()._loader_params_res_partner()["search_params"]["fields"]
        params.append("write_date")
        return params

    def install_data(self, model_name=None, min_id=0, max_id=1999):
        old_log = self.env["pos.query.log"].sudo().search([
            ("min_id", "=", min_id),
            ("max_id", "=", max_id),
            ("call_model", "=", model_name)
        ], limit=1)
        datas = []
        if not old_log or (old_log and not old_log.call_results):
            datas = self.installing_datas(model_name, min_id, max_id)
        else:
            return json.loads(base64.decodebytes(old_log.call_results).decode("utf-8"))
        return datas

    def installing_datas(self, model_name, min_id, max_id):
        _logger.info(
            ">>> Begin installing_datas with model: %s and min_id %s and max_id %s" % (model_name, min_id, max_id))
        domain = [("id", ">=", min_id), ("id", "<=", max_id)]
        categories = None
        if model_name == "product.product":
            domain.append(("available_in_pos", "=", True))
            domain.append(("sale_ok", "=", True))
            categories = self.env["pos.session"]._get_pos_ui_product_category(
                self.env["pos.session"]._loader_params_product_category())
            product_category_by_id = {category["id"]: category for category in categories}
        field_list = self.get_fields_by_model(model_name)
        datas = self.env[model_name].sudo().with_context(display_default_code=False).search_read(domain, field_list)
        datas = self.covert_datetime(model_name, datas)
        if model_name == "product.product":
            for product in datas:
                product["categ"] = product_category_by_id[product["categ_id"][0]]
                product["image_128"] = bool(product["image_128"])
        vals = {
            "active": True,
            "min_id": min_id,
            "max_id": max_id,
            "call_results": base64.encodebytes(json.dumps(datas, default=date_utils.json_default).encode("utf-8")),
            "call_model": model_name,
        }
        logs = self.search([
            ("min_id", "=", min_id),
            ("max_id", "=", max_id),
            ("call_model", "=", model_name),
        ])
        if logs:
            logs.write(vals)
        else:
            self.create(vals)
        _logger.info(
            ">>>> End installing_datas with model: %s and min_id %s and max_id %s" % (model_name, min_id, max_id))
        return datas

    def get_new_update_by_write_date(self, model_name, write_date):
        datas = []
        if model_name == "product.product":
            product_params = self.env["pos.session"]._loader_params_product_product()
            products = self.env["product.product"].with_context(display_default_code=False).search_read([
                ("write_date", ">=", write_date),
                ("sale_ok", "=", True),
                ("available_in_pos", "=", True)
            ], product_params["search_params"]["fields"])
            categories = self.env["pos.session"]._get_pos_ui_product_category(
                self.env["pos.session"]._loader_params_product_category())
            product_category_by_id = {category["id"]: category for category in categories}
            for product in products:
                product["categ"] = product_category_by_id[product["categ_id"][0]]
                product["image_128"] = bool(product["image_128"])
            datas = products
        if model_name == "res.partner":
            partner_params = self.env["pos.session"]._loader_params_res_partner()
            partners = self.env["res.partner"].with_context(display_default_code=False).search_read([
                ("write_date", ">=", write_date),
            ], partner_params["search_params"]["fields"])
            datas = partners
        return datas

    def renew_logs(self):
        self.search([]).unlink()
        return True

    def covert_datetime(self, model, datas):  # TODO: function for only 12 and 13
        all_fields = self.env[model].fields_get()
        if all_fields:
            for data in datas:
                for field, value in data.items():
                    if field == "model":
                        continue
                    if all_fields[field] and all_fields[field]["type"] in ["date", "datetime"] and value:
                        data[field] = value.strftime(DEFAULT_SERVER_DATETIME_FORMAT)
        return datas

    def refresh_logs(self):
        _logger.info("begin refresh_logs")
        for query in self:
            _logger.info("begin refresh_log id %s of model %s" % (query.id, query.call_model))
            if query.call_model == "product.product":
                product_params = self.env["pos.session"]._loader_params_product_product()
                products = self.env["product.product"].with_context(display_default_code=False).search_read([
                    ("id", ">=", query.min_id),
                    ("id", "<=", query.max_id),
                    ("sale_ok", "=", True),
                    ("available_in_pos", "=", True)
                ], product_params["search_params"]["fields"])
                categories = self.env["pos.session"]._get_pos_ui_product_category(
                    self.env["pos.session"]._loader_params_product_category())
                product_category_by_id = {category["id"]: category for category in categories}
                for product in products:
                    product["categ"] = product_category_by_id[product["categ_id"][0]]
                    product["image_128"] = bool(product["image_128"])
                query.write({
                    "call_results": base64.encodebytes(
                        json.dumps(products, default=date_utils.json_default).encode("utf-8")),
                })
                _logger.info("update product.product")
            if query.call_model == "res.partner":
                partner_params = self.env["pos.session"]._loader_params_res_partner()
                partners = self.env["res.partner"].with_context(display_default_code=False).search_read([
                    ("id", ">=", query.min_id),
                    ("id", "<=", query.max_id),
                ], partner_params["search_params"]["fields"])
                query.write({
                    "call_results": base64.encodebytes(
                        json.dumps(partners, default=date_utils.json_default).encode("utf-8")),
                })
                _logger.info("update res.partner")
        _logger.info("end refresh_logs")
        return

    def cron_refresh_logs(self):
        _logger.info("begin cron_refresh_logs")
        queries = self.search([])
        queries.refresh_logs()
        _logger.info("end cron_refresh_logs")
        return

    def get_pos_ui_product_product_by_params(self, custom_search_params):
        params = self.env["pos.session"]._loader_params_product_product()
        params["search_params"] = {**params["search_params"], **custom_search_params}
        products = self.env["product.product"].with_context(active_test=False).search_read(
            **params["search_params"])
        if len(products) > 0:
            self.env["pos.session"]._process_pos_ui_product_product(products)
        return products

    def get_pos_ui_res_partner_by_params(self, custom_search_params):
        params = self.env["pos.session"]._loader_params_res_partner()
        params["search_params"] = {**params["search_params"], **custom_search_params}
        partners = self.env["res.partner"].search_read(**params["search_params"])
        return partners
