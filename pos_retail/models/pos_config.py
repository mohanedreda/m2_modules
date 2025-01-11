# -*- coding: utf-8 -*-
from odoo import api, models, fields, _
from odoo.exceptions import UserError, ValidationError
import logging

_logger = logging.getLogger(__name__)
class PosConfig(models.Model):
    _inherit = "pos.config"

    sync_product = fields.Boolean("Syncing product", default=True)
    sync_customer = fields.Boolean("Sync customer", default=True)
    sync_pricelist = fields.Boolean("Sync pricelist", default=True)
    sale_order = fields.Boolean("Create Sale Order", default=False)
    sale_order_auto_confirm = fields.Boolean("Auto Confirm", default=False)
    sale_order_auto_invoice = fields.Boolean("Auto Paid", default=False)
    sale_order_auto_delivery = fields.Boolean("Auto Delivery", default=False)
    sale_order_required_signature = fields.Boolean(
        "SO Required Signature",
        help="Allow print receipt when create quotation/order")
    update_sale_order = fields.Boolean(
        "Update sale order",
        help="Allow you settle sale order ,\n"
             "update quantity of line \n"
             "or add new line to sale order in POS Screen")
    note_order = fields.Boolean("Note Order", default=True)
    display_onhand = fields.Boolean(
        "Show Stock on Hand each Product", default=True,
        help="Display quantity on hand all products on pos screen")
    allow_order_out_of_stock = fields.Boolean(
        "Allow Order when Product Out Of Stock",
        help="If uncheck, any product out of stock will blocked sale",
        default=True)
    update_stock_onhand = fields.Boolean("Allow Update Stock On Hand", default=False)
    multi_stock_operation_type = fields.Boolean("Multi Stock Operation Type")
    multi_stock_operation_type_ids = fields.Many2many(
        "stock.picking.type",
        string="Multi Operation Type",
        domain="[('warehouse_id.company_id', '=', company_id)]"
    )
    multi_location = fields.Boolean("Update Stock each Location", default=False)
    stock_location_ids = fields.Many2many(
        "stock.location", string="Stock Locations",
        help="Stock Locations for cashier select checking stock on hand \n"
             "and made picking source location from location selected",
        domain=[("usage", "=", "internal")])
    stock_location_id = fields.Many2one(
        "stock.location",
        string="POS Default Source Location",
        related="picking_type_id.default_location_src_id",
        readonly=True)
    stock_location_dest_id = fields.Many2one(
        "stock.location",
        string="POS Default Dest Location",
        related="picking_type_id.default_location_dest_id",
        readonly=True)
    pos_branch_id = fields.Many2one("pos.branch", string="Branch")
    signature_order = fields.Boolean("Signature to Order")
    purchase_order = fields.Boolean("Create Purchase Order")
    purchase_order_confirm = fields.Boolean("Auto Confirm Purchase Order")
    disable_set_discount = fields.Boolean("Disable Set Discount Button")
    disable_set_price = fields.Boolean("Disable Set Price Button")
    disable_remove_line = fields.Boolean("Disable Remove Line Button")
    disable_plus_minus = fields.Boolean("Disable +/- button")
    disable_set_payment = fields.Boolean("Disable Payment Button")
    disable_set_customer = fields.Boolean("Disable Set Customer Button")
    disable_remove_order = fields.Boolean("Disable Remove Order Button")
    product_multi_barcode = fields.Boolean("Product Multi Barcode")
    limited_discount = fields.Boolean("Limited Discount")
    limited_discount_amount = fields.Float("Maximum Disc Can Apply (%)")
    suggest_products = fields.Boolean("Suggestion Products")
    products_multi_unit = fields.Boolean("Products Multi Unit Of Measure")
    clear_cart = fields.Boolean("Clear Cart")
    logo = fields.Binary("Receipt Logo")
    order_auto_invoice = fields.Boolean("Order Auto Invoice")
    order_auto_invoice_without_download = fields.Boolean("Invoice WithOut Download PDF")
    partner_default_id = fields.Many2one("res.partner", string="Customer Default")
    product_default_ids = fields.Many2many(
        "product.product",
        "pos_config_product_product_rel",
        "config_id",
        "product_id",
        domain=[("available_in_pos", "=", True)],
        string="Products default add to cart")
    assign_orders_between_session = fields.Boolean(
        "Assign Orders between Session",
        help="Allow seller assign orders between session have opened"
    )
    invoice_screen = fields.Boolean("Invoice Screen")
    invoice_register_payment = fields.Boolean("Invoice - Register Payment")
    invoice_reset_to_draft = fields.Boolean("Invoice - Reset to Draft")
    invoice_credit_note = fields.Boolean("Invoice - Make Credit Note")
    invoice_confirm = fields.Boolean("Invoice - Confirm and Post Invoice")
    save_quotation = fields.Boolean("Save Order to Draft/Quotation")
    products_display = fields.Selection([
        ("card", "Card"),
        ("list", "List")
    ], string="Products Display View", default="list")
    order_cart_width = fields.Integer(
        "Order Cart Width",
        default=500,
        help="Width of Order Cart (left pos screen is order cart, right pos screen is products screen)")
    numpad_position = fields.Selection([
        ('inside_cart', 'Inside Cart'),
        ('left', 'Left Screen'),
        ('right', 'Right Screen'),
        ('center', 'Center Screen'),
    ], string='Numpad and Buttons Position', default='inside_cart')
    products_display_only_categ = fields.Boolean("Only Display Product have Category")
    discount_customer_group = fields.Boolean(
        "Discount Customer Group",
        help="Each customer group you can set discount, \n"
             "If customer is member of group, \n"
             "Discount will apply when add customer to pos order")
    credit_feature = fields.Boolean("Customer's Credit Points Management")
    credit_product_id = fields.Many2one(
        "product.product",
        "Credit Product",
        domain=[("is_credit", "=", True)],
        help="Only can choice Product active Is Credit, this product use for sale credit points to Customer"
    )
    credit_program_id = fields.Many2one(
        "res.partner.credit.program",
        "Credit Program"
    )
    lock_session = fields.Boolean("Lock Session")
    create_new_customer = fields.Boolean(
        "Allow create new customer",
        default=True,
    )
    disable_edit_customer = fields.Boolean(
        "Disable edit customer",
        default=0,
    )
    create_new_customer_default_country_id = fields.Many2one(
        "res.country",
        string="Default Country when create new customer from POS Screen",
        default=lambda self: self._get_default_country()
    )
    customer_required_mobile = fields.Boolean(
        "Required Mobile",
        default=0
    )
    customer_required_email = fields.Boolean(
        "Required Email",
        default=0
    )
    users_logged_management = fields.Boolean(
        "Users Logged",
        default=True,
        help="Management all users logged of POS Session \n"
             "Allow POS Manager can see how many logged of users peer POS Session and POS Config \n"
             "Allow POS Manager can close logged session of users logged"
    )
    lot_serial_allow_scan = fields.Boolean(
        "Allow Scan Internal Reference of Lot/Serial",
        help="Scan Internal Reference of Lot, auto add product to cart"
    )
    lot_serial_allow_select = fields.Boolean(
        "Allow Select one Lot/Serial of Product have Multi Lot/Serial",
        help="If product have many lot/serial,\n"
             "When add product to cart, \n"
             "Pos will popup all lot/serial for user can choice one"
    )
    display_pads = fields.Boolean(
        "Display Pads",
        help="Default show/hide all feature buttons and numpad",
        default=True)
    pos_branch_id = fields.Many2one(
        'pos.branch',
        string='Branch')
    required_fill_reason_remove_order = fields.Boolean(
        "Required fill remove reason when remove order",
        default=True)
    enable_bom = fields.Boolean('Enable Bom')
    enable_cross_sell = fields.Boolean('Enable Cross Sell')
    enable_cross_sell_items = fields.Boolean('Enable Cross Sell Items')
    enable_pack_group = fields.Boolean('Enable Combo/Pack Items')
    auto_clear_searchbox = fields.Boolean('Auto Clear Search Box (product)', default=True)
    enable_minimize_menu = fields.Boolean('Active Minimize Menu')
    enable_multi_currency = fields.Boolean('Active Multi Currency')
    enable_set_payment_reference = fields.Boolean('Active Set Payment Reference', default=True)
    offline_create_customer = fields.Boolean('Create Customer Offline Mode')
    enable_order_type = fields.Boolean('Enable Order Type')
    enable_type_id = fields.Many2one('pos.order.type', string='Default Type', default=lambda self: self._get_default_order_type())
    print_bill_without_payment = fields.Boolean('Print Bill with/out Payment')
    def _get_default_country(self):
        country = self.env["res.country"].search([
            ("code", "=", "GH"),
        ], limit=1)
        if country:
            return country.id
        else:
            return None

    def _get_default_order_type(self):
        order_type = self.env["pos.order.type"].search([], limit=1)
        if order_type:
            return order_type.id
        else:
            return None

    @api.onchange("invoice_screen")
    def _oc_invoice_screen(self):
        if not self.invoice_screen:
            self.invoice_register_payment = self.invoice_reset_to_draft = self.invoice_create = self.invoice_credit_note = self.invoice_covert_to_order = False

    def sync(self, model, id):
        self.env["bus.bus"]._sendone(self.env.user.partner_id, "pos_retail.event", {
            "model": model,
            "id": id
        })
        return True

    def unlink_record(self, model, id):
        self.env["bus.bus"]._sendone(self.env.user.partner_id, "pos_retail.big_data", {
            "model": model,
            "id": id
        })
        return True

    def open_ui(self):
        self.ensure_one()
        if self.credit_feature:
            self._init_pos_payment_method("Credit", 113, "JC", "AJC", "credit")
        return super(PosConfig, self).open_ui()

    def _init_pos_payment_method(self, journal_name, journal_sequence, journal_code, account_code, pos_method_type):
        credit_journal = self.env["account.journal"].search([
            *self.env["account.journal"]._check_company_domain(self.env.user.company_id),
            ("type", "=", "bank"),
        ], limit=1)
        payment_methods = self.env["pos.payment.method"]
        payment_method_ids = [m.id for m in self.payment_method_ids]
        credit_method = payment_methods.search([
            ("is_credit", "=", True)
        ], limit=1)
        if credit_journal:
            if not credit_method:
                method = payment_methods.create({
                    "name": _("Credit"),
                    "journal_id": credit_journal.id,
                    "company_id": self.env.user.company_id.id,
                    "is_credit": True
                })
                payment_method_ids.append(method.id)
            else:
                payment_method_ids.append(credit_method.id)
        opened_session = self.mapped('session_ids').filtered(lambda s: s.state != 'closed')
        if not opened_session:
            self.write({"payment_method_ids": [(6, 0, payment_method_ids)]})
        return True
