# -*- coding: utf-8 -*-
from odoo import api, models, fields


class ReportPosOrder(models.Model):
    _inherit = "report.pos.order"

    session_id = fields.Many2one('pos.session', string='Session', readonly=True)
    pos_branch_id = fields.Many2one(
        'pos.branch',
        string='Branch/Store',
        readonly=True
    )

    def _select(self):
        sql = super()._select()
        sql += ", l.pos_branch_id as pos_branch_id"
        return sql

    def _from(self):
        sql = super()._from()
        sql += "LEFT JOIN pos_branch pb ON (l.pos_branch_id=pb.id)"
        return sql

    def _group_by(self):
        sql = super()._group_by()
        sql += ", l.pos_branch_id"
        return sql