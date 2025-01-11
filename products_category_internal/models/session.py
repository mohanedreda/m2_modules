from odoo import models, fields
class session_for_internal(models.Model):
    _name = 'sessions.sessions'
    _description = 'Custom session'
    _rec_name = 'session'
    session = fields.Char(string='Session')
    code = fields.Integer(string='Code')
