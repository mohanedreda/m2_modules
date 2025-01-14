from odoo import models, fields, api, SUPERUSER_ID
import logging
import random

_logger = logging.getLogger(__name__)


class branding(models.Model):
    _name = 'branding.category'
    _description = 'branding Category'
    _rec_name = 'branding'
    branding = fields.Char(string='Branding')
    code = fields.Integer(string='Code')



class product_types(models.Model):
    _name = 'product.types'
    _description = 'product type'
    _rec_name = 'type'
    type = fields.Char(string='product type')
    code = fields.Integer(string='Code')


class ProductCategory(models.Model):
    _inherit = 'product.category'

    code = fields.Integer(string='Code')
    selection_child = fields.Selection(
        string='Selection Child',
        selection=[
            ('parent', 'Parent'),
            ('child1', 'Child 1'),
            ('child2', 'Child 2'),
            ('child3', 'Child 3'),
            ('child4', 'Child 4'),
            ('child5', 'Child 5')
        ]
    )
    custom_category_id = fields.Many2one('custom.category', string='Custom Category')


class ProductTemplate(models.Model):
    _inherit = 'product.template'
    product_code = fields.Char(string='Product Code')
    custom_session_id = fields.Many2one(
        'sessions.sessions',
        string='Custom session',
        help="Select the custom category for this product"
    )
    product_specifications = fields.Many2one('products.specification', string='Product Specification')
    fashion_segments = fields.Many2one('product.segments', string="Fashion Segment")
    product_types = fields.Many2one('product.types', string='Product Type')
    checklist = fields.Boolean(string='Shoes')
    selection = fields.Selection(
        string='Select',
        selection=[('summer', 'Summer'), ('winter', 'Winter')]
    )
    branding_category = fields.Many2one('branding.category', string='Branding')

    @api.model
    def trigger_update_codes(self):
        """ Update default_code and generate random barcode for all products """
        update_existing_codes(self.env.cr, self.env.registry)

    def write(self, vals):
        """ Override write method to update default_code when categ_id is updated """
        res = super(ProductTemplate, self).write(vals)
        self._update_default_code()
        return res

    @api.model
    def create(self, vals):
        """ Override create method to generate default_code and random barcode on creation """
        record = super(ProductTemplate, self).create(vals)
        record._update_default_code()
        record._generate_random_barcode()
        return record

    def _update_default_code(self):
        """ تحديث الكود الافتراضي بناءً على التسلسل الهرمي للفئات """
        for record in self:
            # استخرج القيم المطلوبة
            fashion_segments = str(record.fashion_segments.code) if record.fashion_segments.code else ''
            product_code = str(record.product_code) if record.product_code else ''
            product_types = str(record.product_types.code) if record.product_types.code else ''
            product_specifications = str(
                record.product_specifications.code) if record.product_specifications.code else ''
            # current_code = str(record.categ_id.code) if record.categ_id and record.categ_id.code else ''
            # related_codes = record._get_all_related_category_codes(record.categ_id) if record.categ_id else []
            # parent_code = "".join(related_codes) if related_codes else ''
            brand = str(record.branding_category.code) if record.branding_category.code else ''
            year = str(record.custom_session_id.code) if record.custom_session_id.code else ''
            # code = str(record.code) if record.code else ''

            # بناء الكود الافتراضي مع التأكد من الفريدة
            parts = [fashion_segments, brand, product_types, product_specifications, year, product_code]
            new_default_code = "".join(filter(None, parts))  # اجمع الأجزاء غير الفارغة فقط

            # حدّث الكود الافتراضي فقط إذا كان مختلفًا
            if record.default_code != new_default_code:
                record.default_code = new_default_code
                _logger.info(f"تم تحديث الكود الافتراضي للمنتج {record.id}: {record.default_code}")

    def _generate_random_barcode(self):
        """ Generate a 10-digit random barcode """
        for record in self:
            random_barcode = ''.join([str(random.randint(0, 9)) for _ in range(10)])
            record.barcode = random_barcode
            _logger.info(f"Generated Random Barcode for Product ID {record.id}: {record.barcode}")

    def update_existing_codes(cr, registry):
        """ Update default_code and generate random barcodes for all existing products after module upgrade.
            Resolve duplicates and regenerate codes where necessary. """
        print("!!! post_init_hook called !!!")
        _logger.info("Running post_init_hook to update existing codes and resolve duplicates...")
        try:
            env = api.Environment(cr, SUPERUSER_ID, {})
            products = env['product.template'].search([])
            _logger.info(f"Found {len(products)} products to update.")

            # Track already used default_codes to avoid duplication
            used_codes = set()

            for product in products:
                # Regenerate default_code
                product._update_default_code()

                # Resolve duplicates
                if product.default_code in used_codes:
                    # Append unique identifier if duplicate
                    product.default_code += str(product.id)

                # Add to used_codes
                used_codes.add(product.default_code)

                # Regenerate barcode
                product._generate_random_barcode()

            _logger.info("Completed update for all existing products and resolved duplicates.")
        except Exception as e:
            _logger.error(f"Error in post_init_hook: {str(e)}")


# class Productproduct(models.Model):
#     _inherit = 'product.product'
#     product_code = fields.Char(string='Product Code')
#     product_specifications = fields.Many2one('products.specification', string='Product Specification')
#     fashion_segments = fields.Many2one('product.segments', string="Fashion Segment")
#     product_types = fields.Many2one('product.types', string='Product Type')
#     year = fields.Date(string='Year')
#     custom_session_id = fields.Many2one(
#         'sessions.sessions',
#         string='Custom session',
#     )
#     selection = fields.Selection(
#         string='Select',
#         selection=[('summer', 'Summer'), ('winter', 'Winter')]
#     )
#     branding_category = fields.Many2one('branding.category', string='branding Category')
#
#     @api.model
#     def trigger_update_code(self):
#         """ Update default_code and generate random barcode for all products """
#         update_existing_codes(self.env.cr, self.env.registry)
#
#     def write(self, vals):
#         """ Override write method to update default_code when categ_id is updated """
#         res = super(Productproduct, self).write(vals)
#         self._update_default_code()
#         return res
#
#     @api.model
#     def create(self, vals):
#         """ Override create method to generate default_code and random barcode on creation """
#         record = super(Productproduct, self).create(vals)
#         record._update_default_code()
#         record._generate_random_barcode()
#         return record
#
#     def _update_default_code(self):
#         """ تحديث الكود الافتراضي بناءً على التسلسل الهرمي للفئات """
#         for record in self:
#             # استخرج القيم المطلوبة
#             fashion_segments = str(record.fashion_segments.code) if record.fashion_segments.code else ''
#             product_code = str(record.product_code) if record.product_code else ''
#             product_types = str(record.product_types.code) if record.product_types.code else ''
#             product_specifications = str(record.product_specifications.code) if record.product_specifications.code else ''
#             # current_code = str(record.categ_id.code) if record.categ_id and record.categ_id.code else ''
#             # related_codes = record._get_all_related_category_codes(record.categ_id) if record.categ_id else []
#             # parent_code = "".join(related_codes) if related_codes else ''
#             brand = str(record.branding_category.code) if record.branding_category.code else ''
#             year = str(record.custom_session_id.code) if record.custom_session_id.code else ''
#             # code = str(record.code) if record.code else ''
#
#             # بناء الكود الافتراضي مع التأكد من الفريدة
#             parts = [fashion_segments, brand, product_types, product_specifications, year, product_code]
#             new_default_code = "".join(filter(None, parts))  # اجمع الأجزاء غير الفارغة فقط
#
#             # حدّث الكود الافتراضي فقط إذا كان مختلفًا
#             if record.default_code != new_default_code:
#                 record.default_code = new_default_code
#                 _logger.info(f"تم تحديث الكود الافتراضي للمنتج {record.id}: {record.default_code}")
#
#     def _generate_random_barcode(self):
#         """ Generate a 10-digit random barcode """
#         for record in self:
#             random_barcode = ''.join([str(random.randint(0, 9)) for _ in range(10)])
#             record.barcode = random_barcode
#             _logger.info(f"Generated Random Barcode for Product ID {record.id}: {record.barcode}")
#
#
# def update_existing_codes(cr, registry):
#     """ Update default_code and generate random barcodes for all existing products after module upgrade.
#         Resolve duplicates and regenerate codes where necessary. """
#     print("!!! post_init_hook called !!!")
#     _logger.info("Running post_init_hook to update existing codes and resolve duplicates...")
#     try:
#         env = api.Environment(cr, SUPERUSER_ID, {})
#         products = env['product.template'].search([])
#         _logger.info(f"Found {len(products)} products to update.")
#
#         # Track already used default_codes to avoid duplication
#         used_codes = set()
#
#         for product in products:
#             # Regenerate default_code
#             product._update_default_code()
#
#             # Resolve duplicates
#             if product.default_code in used_codes:
#                 # Append unique identifier if duplicate
#                 product.default_code += str(product.id)
#
#             # Add to used_codes
#             used_codes.add(product.default_code)
#
#             # Regenerate barcode
#             product._generate_random_barcode()
#
#         _logger.info("Completed update for all existing products and resolved duplicates.")
#     except Exception as e:
#         _logger.error(f"Error in post_init_hook: {str(e)}")
