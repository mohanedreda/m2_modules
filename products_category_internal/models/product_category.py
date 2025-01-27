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
# class ProductProduct(models.Model):
#     _inherit = 'product.product'
#     def write(self, vals):
#         """ Override write method to update default_code when categ_id is updated """
#         res = super(ProductProduct, self).write(vals)
#         self._update_default_code()
#         return res
#
#     @api.model
#     def create(self, vals):
#         """ Override create method to generate default_code and random barcode on creation """
#         record = super(ProductProduct, self).create(vals)
#         record.update_barcode_and_internal_ref()
#         record._generate_random_barcode()
#         return record
#     @api.model
#     def trigger_update_code_variant(self):
#         """ Update default_code and generate random barcode for all products """
#         update_barcode_and_internal_ref(self)
#
#     def _generate_random_barcode(self):
#         """Generate a 10-digit random barcode."""
#         for record in self:
#             random_barcode = ''.join([str(random.randint(0, 9)) for _ in range(10)])
#             record.barcode = random_barcode
#             _logger.info(f"Generated Random Barcode for Product ID {record.id}: {record.barcode}")
#
# def update_barcode_and_internal_ref(self):
#     """Server action to update the barcode and fetch internal_ref from product.template."""
#     for product in self:
#         # Generate a new random barcode
#         product._generate_random_barcode()
#
#         # Update internal_ref from the related product.template
#         if product.product_tmpl_id:
#             product.default_code = product.product_tmpl_id.default_code
#             _logger.info(f"Updated internal_ref for Product ID {product.id}: {product.default_code}")

# class ProductProduct(models.Model):
#     _inherit = 'product.product'
#
#     def update_internal_ref(self):
#         """
#         Update default_code (internal reference) and barcode for product.product
#         based on the related product.template.
#         """
#         for product in self:
#             if product.product_tmpl_id:
#                 # Fetch values from the related product.template
#                 product.default_code = product.product_tmpl_id.default_code
#                 product.barcode = product.product_tmpl_id.barcode
#                 _logger.info(
#                     f"Updated Product ID {product.id}: default_code={product.default_code}, barcode={product.barcode}"
#                 )
#
#     def _generate_random_barcode(self):
#         """ Generate a 10-digit random barcode """
#         for record in self:
#             random_barcode = ''.join([str(random.randint(0, 9)) for _ in range(10)])
#             record.barcode = random_barcode
#             _logger.info(f"Generated Random Barcode for Product ID {record.id}: {record.barcode}")
#
#     @api.model
#     def server_action_update_internal_ref(self):
#         """
#         Server Action: Update default_code and barcode for selected product.product records.
#         """
#         self._generate_random_barcode()
#         for product in self.browse(self.env.context.get('active_ids', [])):
#             if product.product_tmpl_id:
#                 # Fetch values from the related product.template
#                 product.default_code = product.product_tmpl_id.default_code
#                 product.barcode = product.product_tmpl_id.barcode
#                 _logger.info(
#                     f"Server Action: Updated Product ID {product.id}: default_code={product.default_code}, barcode={product.barcode}"
#                 )
class ProductProduct(models.Model):
    _inherit = 'product.product'

    def write(self, vals):
        """Override write to ensure related updates."""
        res = super(ProductProduct, self).write(vals)
        self.get_default_code_for_variant()
        return res

    def trigger_update_code(self):
        """ Update default_code and generate random barcode for selected products """
        for product in self:
            # Get the related product template
            template = product.product_tmpl_id

            # Update the default_code for the template
            template._update_default_code()

            # Regenerate the barcode for the product variant
            product._generate_random_barcode()

            _logger.info(f"Updated default_code and barcode for Product Variant ID {product.id}")

    @api.model
    def create(self, vals):
        """Override create to ensure default_code and barcode are set."""
        record = super(ProductProduct, self).create(vals)
        record.get_default_code_for_variant()
        record._generate_random_barcode()
        return record

    def get_default_code_for_variant(self):
        """Fetch and apply the default_code from the related template."""
        for record in self:
            template = record.product_tmpl_id
            if template:
                default_code = template.default_code
                _logger.info(f"Product Variant ID {record.id} has default_code: {default_code}")
                return default_code

    def _generate_random_barcode(self):
        """Generate a unique 10-digit random barcode."""
        for record in self:
            random_barcode = ''.join([str(random.randint(0, 9)) for _ in range(10)])
            record.barcode = random_barcode
            _logger.info(f"Generated Random Barcode for Product ID {record.id}: {record.barcode}")


def update_existing_codes(cr, registry):
    """Update default_code and barcodes for all existing products."""
    _logger.info("Running post_init_hook to update codes and barcodes...")
    try:
        env = api.Environment(cr, SUPERUSER_ID, {})
        templates = env['product.template'].search([])  # Fetch all product templates
        _logger.info(f"Found {len(templates)} templates to update.")

        # Update default_code for all templates
        templates._update_default_code()

        # Update barcodes for product variants
        products = env['product.product'].search([])
        _logger.info(f"Found {len(products)} product variants to update barcodes.")
        for product in products:
            product._generate_random_barcode()

        _logger.info("Successfully updated default codes and barcodes for all products.")
    except Exception as e:
        _logger.error(f"Error in post_init_hook: {str(e)}")