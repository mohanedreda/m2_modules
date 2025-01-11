from odoo import models, fields, api, _

class fashion_segments(models.Model):
    _name = 'product.segments'
    _description = 'product Segment'
    _rec_name = 'segment'
    segment = fields.Char(string='fashion segment')
    code = fields.Integer(string='Code')