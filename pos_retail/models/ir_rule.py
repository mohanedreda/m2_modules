# -*- coding: utf-8 -*-

from odoo import api, models, fields, _
class IrRule(models.Model):
    _inherit = "ir.rule"

    @api.model
    def _eval_context(self):
        res = super()._eval_context()
        self.env.branch = None
        self.env.branch_ids = []
        if self.env.user.pos_branch_id:
            self.env.branch = self.env.user.pos_branch_id
            self.env.branches = self.env.user.pos_branch_ids
            if self.env.branches:
                self.env.branch_ids = self.env.branches.ids
        if self.env.branch and self.env.branch.id not in self.env.branch_ids:
            self.env.branch_ids.append(self.env.branch.id)
        res['branch'] = self.env.branch
        res['branch_ids'] = self.env.branch_ids
        return res
