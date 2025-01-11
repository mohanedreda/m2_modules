# -*- coding: utf-8 -*-
from odoo import api, models, fields, _


class PosSession(models.Model):
    _inherit = "pos.session"

    is_locked = fields.Boolean("Is Locked")
    pos_branch_id = fields.Many2one(
        'pos.branch',
        related='config_id.pos_branch_id',
        store=True,
        string='Branch',
        readonly=True)

    # TODO: edited and implement core method
    def login(self):
        login_number = super().login()
        if self.config_id.users_logged_management:
            self.env["pos.session.management"].create({
                "session_id": self.id,
                "opened_time": fields.Datetime.now(),
                "user_id": self.env.user.id,
                "login_number": login_number,
            })
        return login_number

    def write(self, vals):
        res = super().write(vals)
        if vals.get("state", None) == "closed":
            for session in self:
                sessions_opened = self.env["pos.session.management"].search([
                    ("session_id", "=", session.id)
                ])
                if sessions_opened:
                    sessions_opened.close_session()
                    sessions_opened.unlink()
        return res

    def _pos_ui_models_to_load(self):
        result = super()._pos_ui_models_to_load()
        if self.config_id.display_onhand:
            result.append("stock.location")
        if self.config_id.product_multi_barcode:
            result.append("product.barcode")
        if self.config_id.products_multi_unit:
            result.append("product.uom.price")
        if self.config_id.invoice_screen:
            result.extend(["account.journal", "account.payment.method.line"])
        if self.config_id.discount_customer_group:
            result.extend(["res.partner.category"])
        if self.config_id.credit_feature:
            result.extend(["res.partner.credit.program"])
        if self.config_id.lot_serial_allow_scan or self.config_id.lot_serial_allow_select:
            result.extend(["stock.lot"])
        if self.config_id.enable_cross_sell:
            result.extend(["product.cross.sell.group"])
        if self.config_id.enable_cross_sell:
            result.extend(["product.pack.group", "product.pack"])
        if self.config_id.enable_multi_currency:
            result.extend(["multi.res.currency"])
        if self.config_id.enable_order_type:
            result.extend(["pos.order.type"])
        return result

    def _loader_params_pos_session(self):
        params = super()._loader_params_pos_session()
        params["search_params"]["fields"].extend([
            "is_locked",
        ])
        return params

    def _loader_params_res_partner(self):
        params = super()._loader_params_res_partner()
        params["search_params"]["fields"].extend([
            "discount_group",
            "discount_group_id",
            "credit",
            "debit",
            "balance",
            "limit_debit",
        ])
        return params

    def _loader_params_res_users(self):
        params = super()._loader_params_res_users()
        params["search_params"]["fields"].extend(["pos_login_direct", "pos_logout_direct", "pos_pin"])
        return params

    def _product_pricelist_item_fields(self):
        fields_loading = super()._product_pricelist_item_fields()
        fields_loading.extend(["pos_category_ids", "applied_on"])
        return fields_loading

    def _loader_params_product_product(self):
        res = super()._loader_params_product_product()
        res["search_params"]["fields"].extend([
            "type",
            "suggest_product_ids",
            "detailed_type",
            "cross_sell_item_ids",
            "cross_sell_group_ids",
            "pack_include",
            "pack_group_ids",
        ])
        return res

    def _loader_params_stock_picking_type(self):
        res = super()._loader_params_stock_picking_type()
        res["search_params"]["fields"] = res["search_params"]["fields"] + ["name", "code", "default_location_dest_id",
                                                                           "default_location_src_id", "display_name",
                                                                           "return_picking_type_id"]
        return res

    def _cannot_close_session(self, bank_payment_method_diffs=None):
        orders_draft = self.order_ids.filtered(lambda o: o.state == 'draft')
        if len(orders_draft) > 0:
            rescue_session = self.search([
                ("rescue", "=", True),
                ("config_id", "=", self.config_id.id),
                ("state", "not in", ["closed", "closing_control"])
            ], limit=1)
            if not rescue_session:
                rescue_session = self.create({
                    'config_id': self.config_id.id,
                    'name': _('(RESCUE Orders Draft of Session: %(session)s)') % {'session': self.name},
                    'rescue': True,
                })
            orders_draft.write({"session_id": rescue_session.id})
        return super()._cannot_close_session(bank_payment_method_diffs=bank_payment_method_diffs)

    def _loader_params_hr_employee(self):
        res = super()._loader_params_hr_employee()
        new_fields_need_load = [
            "point_of_sale_security",
            "disable_set_discount",
            "disable_set_price",
            "disable_remove_line",
            "disable_plus_minus",
            "disable_set_payment",
            "disable_set_customer",
            "disable_remove_order",
            "disable_return_order",
        ]
        res["search_params"]["fields"].extend(new_fields_need_load)
        return res


    # --------------------------------------
    # TODO: added new methods of module
    # --------------------------------------
    def _loader_params_pos_order_type(self):
        return {
            "search_params": {
                "domain": [],
                'fields': ['name', 'home_delivery'],
            },
        }

    def _get_pos_ui_pos_order_type(self, params):
        return self.env["pos.order.type"].search_read(**params["search_params"])
    def _loader_params_multi_res_currency(self):
        return {
            "search_params": {
                "domain": [],
                'fields': ['name', 'symbol', 'position', 'rounding', 'inverse_rate', 'rate', 'decimal_places'],
            },
        }

    def _get_pos_ui_multi_res_currency(self, params):
        return self.env["res.currency"].search_read(**params["search_params"])
    def _loader_params_product_pack_group(self):
        return {
            "search_params": {
                "domain": [
                ],
                "fields": ["name", "max_qty_selected"],
            },
        }

    def _get_pos_ui_product_pack_group(self, params):
        return self.env["product.pack.group"].search_read(**params["search_params"])

    def _loader_params_product_pack(self):
        return {
            "search_params": {
                "domain": [
                ],
                "fields": ["product_id", "sale_price", "group_id", "default_selected", "default_required"],
            },
        }

    def _get_pos_ui_product_pack(self, params):
        return self.env["product.pack"].search_read(**params["search_params"])

    def _loader_params_stock_lot(self):
        return {
            "search_params": {
                "domain": [
                    ("product_id.available_in_pos", "=", True),
                    ("product_qty", ">", 0),
                    ("company_id", "=", self.env.user.company_id.id)
                ],
                "fields": ["name", "product_qty", "ref", "product_id"],
            },
        }

    def _get_pos_ui_stock_lot(self, params):
        return self.env["stock.lot"].search_read(**params["search_params"])

    def _loader_params_product_cross_sell_group(self):
        return {
            "search_params": {
                "domain": [
                ],
                "fields": ["name", "product_ids"],
            },
        }

    def _get_pos_ui_product_cross_sell_group(self, params):
        return self.env["product.cross.sell.group"].search_read(**params["search_params"])

    def _loader_params_res_partner_category(self):
        return {
            "search_params": {
                "domain": [("pos_discount", ">", 0), ("pos_discount_categ_ids", "!=", None)],
                "fields": ["name", "pos_discount", "pos_discount_categ_ids"],
            },
        }

    def _get_pos_ui_res_partner_category(self, params):
        return self.env["res.partner.category"].search_read(**params["search_params"])

    def _loader_params_stock_location(self):
        if self.config_id.multi_location:
            return {
                "search_params": {
                    "domain": [
                        ("usage", "=", "internal"), "|",
                        ("id", "in", [l.id for l in self.config_id.stock_location_ids]),
                        ("id", "=", self.config_id.picking_type_id.default_location_src_id.id)
                    ],
                    "fields": ["name", "location_id", "company_id", "usage", "barcode", "display_name"],
                },
            }
        else:
            return {
                "search_params": {
                    "domain": [
                        ("id", "=", self.config_id.picking_type_id.default_location_src_id.id)
                    ],
                    "fields": ["name", "location_id", "company_id", "usage", "barcode", "display_name"],
                },
            }

    def _get_pos_ui_stock_location(self, params):
        return self.env["stock.location"].search_read(**params["search_params"])

    def _loader_params_product_barcode(self):
        return {
            "search_params": {
                "domain": [],
                "fields": ["name", "product_id"],
            },
        }

    def _get_pos_ui_product_barcode(self, params):
        return self.env["product.barcode"].search_read(**params["search_params"])

    def _loader_params_product_uom_price(self):
        return {
            "search_params": {
                "domain": [],
                "fields": ["uom_id", "price", "product_id"],
            },
        }

    def _get_pos_ui_product_uom_price(self, params):
        return self.env["product.uom.price"].search_read(**params["search_params"])

    def _loader_params_account_journal(self):
        return {
            "search_params": {
                "domain": [("inbound_payment_method_line_ids", '!=', None),
                           ("outbound_payment_method_line_ids", '!=', None)],
                "fields": ["name", "inbound_payment_method_line_ids", "outbound_payment_method_line_ids"],
            },
        }

    def _get_pos_ui_account_journal(self, params):
        return self.env["account.journal"].search_read(**params["search_params"])

    def _loader_params_account_payment_method_line(self):
        return {
            "search_params": {
                "domain": [],
                "fields": ["name"],
            },
        }

    def _get_pos_ui_account_payment_method_line(self, params):
        return self.env["account.payment.method.line"].search_read(**params["search_params"])

    def _loader_params_pos_payment_method(self):
        res = super()._loader_params_pos_payment_method()
        res["search_params"]["fields"].extend(["is_credit"])
        return res

    def _loader_params_res_partner_credit_program(self):
        return {
            "search_params": {
                "domain": [
                    ("id", "=", self.config_id.credit_program_id.id if self.config_id.credit_program_id else None)],
                "fields": ["name", "rate"],
            },
        }

    def _get_pos_ui_res_partner_credit_program(self, params):
        credit_programs = self.env["res.partner.credit.program"].search_read(**params["search_params"])
        if credit_programs:
            return credit_programs[0]
        else:
            return None
