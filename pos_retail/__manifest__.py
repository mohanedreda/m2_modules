# -*- coding: utf-8 -*
{
    "price": "250",
    "name": "POS ALL IN ONE, Retail Shop, All In One Retail,Restaurant,All-In-One(PRO),pos",
    "version": "1.0.4",
    "category": "Point of Sale",
    "author": "TL Technology",
    "summary":
        """
        Point of Sale Retail Shop | All In One POS Retail | POS Restaurant | All-In-One(PRO) \n
        Restaurant & Shop Retail All-In-One\n
        Supported Enterprise and Community All-In-One\n
        Included 100+ features All-In-One \n
        POS\n
        Retail\n
        Point Of Sale\n
        POS ALL IN ONE
        """,
    "description":
        """
        1ST POS Application Extend of Point Of Sale Odoo\n
        Supported Enterprise and Community \n
        Included 100+ features of POS \n
        Retail Stores & Restaurant Stores Supported \n\
        Point of Sale Retail Shop | All In One POS Retail | POS Restaurant | All-In-One(PRO) \n
        POS\n
        Retail\n
        Point Of Sale\n
        POS ALL IN ONE
        """,
    "live_test_url": "https://demo.posodoo.com",
    "website": "https://demo.posodoo.com",
    "sequence": 0,
    "depends": [
        "point_of_sale",
        "sale_stock",
        "pos_restaurant",
        "pos_sale",
        "pos_hr",
        "pos_loyalty",
        "purchase",
        "account",
    ],
    "demo": [],
    "data": [
        "security/ir.model.access.csv",
        "security/group.xml",
        "security/point_of_sale_assign_user.xml",
        "security/ir_rule_pos_branch.xml",
        "master_datas/ir_cron.xml",
        "master_datas/res_partner_credit_program.xml",
        "master_datas/product.xml",
        "master_datas/pos_order_type.xml",
        "wizard/remove_pos_order.xml",
        "views/pos_asset_index.xml",
        "views/pos_query_log.xml",
        "views/pos_session.xml",
        "views/pos_session_management.xml",
        "views/product_cross_sell_group.xml",
        "views/product_pack_group.xml",
        "views/product_pricelist_item.xml",
        "views/res_config_settings_views.xml",
        "views/sale_order.xml",
        "views/pos_order.xml",
        "views/pos_payment.xml",
        "views/pos_product_bom.xml",
        "views/pos_config.xml",
        "views/product_template.xml",
        "views/product_product.xml",
        "views/res_users.xml",
        "views/hr_employee_views.xml",
        "views/res_partner.xml",
        "views/res_partner_category.xml",
        "views/res_partner_credit_program.xml",
        "views/pos_branch.xml",
        "views/pos_order_report.xml",
        "views/pos_order_type.xml",
    ],
    "qweb": [],
    "currency": "EUR",
    "installable": True,
    "auto_install": True,
    "application": True,
    "external_dependencies": {"python": []},
    "images": ["static/description/icon.png"],
    "support": "thanhchatvn@gmail.com",
    "license": "OPL-1",
    "assets": {
        "point_of_sale._assets_pos": [
            "pos_retail/static/src/app/**/*",
            "pos_retail/static/src/css/**/*",
        ],
    },
}
