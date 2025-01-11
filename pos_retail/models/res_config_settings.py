# -*- coding: utf-8 -*-

from odoo import api, models, fields


class ResConfigSettings(models.TransientModel):
    _inherit = 'res.config.settings'

    sync_product = fields.Boolean(related='pos_config_id.sync_product', readonly=False)
    sync_customer = fields.Boolean(related='pos_config_id.sync_customer', readonly=False)
    sync_pricelist = fields.Boolean(related='pos_config_id.sync_pricelist', readonly=False)
    sale_order = fields.Boolean(related='pos_config_id.sale_order', readonly=False)
    sale_order_auto_confirm = fields.Boolean(related='pos_config_id.sale_order_auto_confirm', readonly=False)
    sale_order_auto_invoice = fields.Boolean(related='pos_config_id.sale_order_auto_invoice', readonly=False)
    sale_order_auto_delivery = fields.Boolean(related='pos_config_id.sale_order_auto_delivery', readonly=False)
    sale_order_required_signature = fields.Boolean(
        related='pos_config_id.sale_order_required_signature',
        readonly=False)
    update_sale_order = fields.Boolean(
        related='pos_config_id.update_sale_order',
        readonly=False)
    note_order = fields.Boolean(
        related='pos_config_id.note_order',
        readonly=False)
    display_onhand = fields.Boolean(
        related='pos_config_id.display_onhand',
        readonly=False)
    allow_order_out_of_stock = fields.Boolean(
        related='pos_config_id.allow_order_out_of_stock',
        readonly=False)
    multi_location = fields.Boolean(
        related='pos_config_id.multi_location',
        readonly=False)
    update_stock_onhand = fields.Boolean(
        related='pos_config_id.update_stock_onhand',
        readonly=False)
    multi_stock_operation_type = fields.Boolean(
        related='pos_config_id.multi_stock_operation_type',
        readonly=False)
    multi_stock_operation_type_ids = fields.Many2many(
        related='pos_config_id.multi_stock_operation_type_ids',
        readonly=False)
    stock_location_ids = fields.Many2many(
        related='pos_config_id.stock_location_ids',
        readonly=False)
    stock_location_id = fields.Many2one(
        related='pos_config_id.stock_location_id',
        readonly=True)
    stock_location_dest_id = fields.Many2one(
        related='pos_config_id.stock_location_dest_id',
        readonly=True)
    signature_order = fields.Boolean(
        related='pos_config_id.signature_order',
        readonly=False)
    suggest_products = fields.Boolean(
        related='pos_config_id.suggest_products',
        readonly=False)
    products_multi_unit = fields.Boolean(
        related='pos_config_id.products_multi_unit',
        readonly=False)
    purchase_order = fields.Boolean(
        related='pos_config_id.purchase_order',
        readonly=False)
    purchase_order_confirm = fields.Boolean(
        related='pos_config_id.purchase_order_confirm',
        readonly=False)
    disable_set_discount = fields.Boolean(
        related='pos_config_id.disable_set_discount',
        readonly=False)
    disable_set_price = fields.Boolean(
        related='pos_config_id.disable_set_price',
        readonly=False)
    disable_remove_line = fields.Boolean(
        related='pos_config_id.disable_remove_line',
        readonly=False)
    disable_plus_minus = fields.Boolean(
        related='pos_config_id.disable_plus_minus',
        readonly=False)
    disable_set_payment = fields.Boolean(
        related='pos_config_id.disable_set_payment',
        readonly=False)
    disable_set_customer = fields.Boolean(
        related='pos_config_id.disable_set_customer',
        readonly=False)
    disable_remove_order = fields.Boolean(
        related='pos_config_id.disable_remove_order',
        readonly=False)
    product_multi_barcode = fields.Boolean(
        related='pos_config_id.product_multi_barcode',
        readonly=False)
    limited_discount = fields.Boolean(
        related='pos_config_id.limited_discount',
        readonly=False)
    limited_discount_amount = fields.Float(
        related='pos_config_id.limited_discount_amount',
        readonly=False)
    clear_cart = fields.Boolean(
        related='pos_config_id.clear_cart',
        readonly=False)
    logo = fields.Binary(
        related='pos_config_id.logo',
        readonly=False)
    order_auto_invoice = fields.Boolean(
        related='pos_config_id.order_auto_invoice',
        readonly=False)
    order_auto_invoice_without_download = fields.Boolean(
        related='pos_config_id.order_auto_invoice_without_download',
        readonly=False)
    partner_default_id = fields.Many2one(
        related='pos_config_id.partner_default_id',
        readonly=False)
    product_default_ids = fields.Many2many(
        related='pos_config_id.product_default_ids',
        readonly=False)
    assign_orders_between_session = fields.Boolean(
        related='pos_config_id.assign_orders_between_session',
        readonly=False)
    invoice_screen = fields.Boolean(
        related='pos_config_id.invoice_screen',
        readonly=False)
    invoice_register_payment = fields.Boolean(
        related='pos_config_id.invoice_register_payment',
        readonly=False)
    invoice_reset_to_draft = fields.Boolean(
        related='pos_config_id.invoice_reset_to_draft',
        readonly=False)
    invoice_credit_note = fields.Boolean(
        related='pos_config_id.invoice_credit_note',
        readonly=False)
    invoice_confirm = fields.Boolean(
        related='pos_config_id.invoice_confirm',
        readonly=False)
    save_quotation = fields.Boolean(
        related='pos_config_id.save_quotation',
        readonly=False)
    products_display = fields.Selection(
        related='pos_config_id.products_display',
        readonly=False)
    order_cart_width = fields.Integer(
        related='pos_config_id.order_cart_width',
        readonly=False)
    products_display_only_categ = fields.Boolean(
        related='pos_config_id.products_display_only_categ',
        readonly=False)
    discount_customer_group = fields.Boolean(
        related='pos_config_id.discount_customer_group',
        readonly=False)
    credit_feature = fields.Boolean(
        related='pos_config_id.credit_feature',
        readonly=False)
    credit_product_id = fields.Many2one(
        domain=[("is_credit", "=", True)],
        related='pos_config_id.credit_product_id',
        readonly=False)
    credit_program_id = fields.Many2one(
        related='pos_config_id.credit_program_id',
        readonly=False)
    lock_session = fields.Boolean(
        related='pos_config_id.lock_session',
        readonly=False)
    create_new_customer = fields.Boolean(
        related='pos_config_id.create_new_customer',
        readonly=False
    )
    disable_edit_customer = fields.Boolean(
        related='pos_config_id.disable_edit_customer',
        readonly=False
    )
    create_new_customer_default_country_id = fields.Many2one(
        related='pos_config_id.create_new_customer_default_country_id',
        readonly=False
    )
    customer_required_mobile = fields.Boolean(
        related='pos_config_id.customer_required_mobile',
        readonly=False
    )
    customer_required_email = fields.Boolean(
        related='pos_config_id.customer_required_email',
        readonly=False
    )
    users_logged_management = fields.Boolean(
        related='pos_config_id.users_logged_management',
        readonly=False
    )
    lot_serial_allow_scan = fields.Boolean(
        related='pos_config_id.lot_serial_allow_scan',
        readonly=False
    )
    lot_serial_allow_select = fields.Boolean(
        related='pos_config_id.lot_serial_allow_select',
        readonly=False
    )
    display_pads = fields.Boolean(
        related='pos_config_id.display_pads',
        readonly=False
    )
    pos_branch_id = fields.Many2one(
        related='pos_config_id.pos_branch_id',
        readonly=False
    )
    numpad_position = fields.Selection(
        related='pos_config_id.numpad_position',
        readonly=False
    )
    required_fill_reason_remove_order = fields.Boolean(
        related='pos_config_id.required_fill_reason_remove_order',
        readonly=False
    )
    enable_bom = fields.Boolean(
        related='pos_config_id.enable_bom',
        readonly=False
    )
    enable_cross_sell = fields.Boolean(
        related='pos_config_id.enable_cross_sell',
        readonly=False
    )
    enable_cross_sell_items = fields.Boolean(
        related='pos_config_id.enable_cross_sell_items',
        readonly=False
    )
    enable_pack_group = fields.Boolean(
        related='pos_config_id.enable_pack_group',
        readonly=False
    )
    auto_clear_searchbox = fields.Boolean(
        related='pos_config_id.auto_clear_searchbox',
        readonly=False
    )
    enable_minimize_menu = fields.Boolean(
        related='pos_config_id.enable_minimize_menu',
        readonly=False
    )
    enable_multi_currency = fields.Boolean(
        related='pos_config_id.enable_multi_currency',
        readonly=False
    )
    enable_set_payment_reference = fields.Boolean(
        related='pos_config_id.enable_set_payment_reference',
        readonly=False
    )
    offline_create_customer = fields.Boolean(
        related='pos_config_id.offline_create_customer',
        readonly=False
    )
    enable_order_type = fields.Boolean(
        related='pos_config_id.enable_order_type',
        readonly=False
    )
    enable_type_id = fields.Many2one(
        related='pos_config_id.enable_type_id',
        readonly=False
    )
    print_bill_without_payment = fields.Boolean(
        related='pos_config_id.print_bill_without_payment',
        readonly=False
    )

    @api.onchange("credit_feature")
    def _oc_credit_feature(self):
        if self.credit_feature:
            self.credit_product_id = self.env["product.product"].search([
                ("is_credit", "=", True)
            ], limit=1)
            self.credit_program_id = self.env["res.partner.credit.program"].search([], limit=1)
        else:
            self.credit_program_id = self.credit_product_id = None

    @api.onchange('invoice_screen')
    def _oc_invoice_screen(self):
        if not self.invoice_screen:
            self.invoice_register_payment = self.invoice_reset_to_draft = self.invoice_credit_note = False

    @api.onchange('sale_order')
    def _oc_sale_order(self):
        if not self.sale_order:
            self.sale_order = self.sale_order_auto_confirm = self.sale_order_auto_invoice = self.sale_order_auto_delivery = self.sale_order_required_signature = False
