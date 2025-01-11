from odoo import models, fields, api, _
class products_specification(models.Model):
    _name = 'products.specification'
    _description = 'product specification'
    _rec_name = 'specification'
    specification = fields.Char(string='product specification')
    code = fields.Integer(string='Code')