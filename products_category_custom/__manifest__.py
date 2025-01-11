# -*- coding: utf-8 -*-
{
    'name': "categories of products",
    'version': '1.0',
    'sequence': -100,

    # any module necessary for this one to work correctly
    'depends': ['account', 'base', 'stock', 'product'],

    # always loaded
    'data': [
        'security/ir.model.access.csv',
        'views/product_setting.xml',
        'views/product_category.xml',
        'views/product_template.xml',
        'views/barcode_script.xml',
        'views/product_session.xml',
        'views/product_product.xml',
        'views/product_type.xml',
        'views/product_specification.xml',
        'views/product_segment.xml',
    ],
    # 'post_init_hook': 'update_existing_codes',
    'installable': True,
    'application': True,
}
