# -*- coding: utf-8 -*-
from odoo import api, models, fields, registry
import logging

_logger = logging.getLogger(__name__)


class PosSessionManagement(models.Model):
    _name = "pos.session.management"
    _description = ("Management all sessions opened/resume of shop, \n"
                    "Manager can request close session, \n"
                    "Pos screen auto logout when management request")

    session_id = fields.Many2one(
        "pos.session",
        "Session Opened",
        required=True,
        readonly=True,
    )
    config_id = fields.Many2one(
        "pos.config",
        related="session_id.config_id",
        string="Point of Sale",
        readonly=True,
        store=True)
    opened_time = fields.Datetime("Opened/Resume Time", readonly=True)
    user_id = fields.Many2one("res.users", "Opened/Resume User", readonly=True)
    state = fields.Selection([
        ("opened", "Opened"),
        ("closed", "Closed")
    ], default="opened", string="State", readonly=True)
    login_number = fields.Char("Login Number", required=True, readonly=True)
    closed_time = fields.Datetime("Closed Time", readonly=True)
    closed_user_id = fields.Many2one("res.users", "Closed By", readonly=True)

    def close_session(self):
        for session_opened in self:
            self.env["bus.bus"]._sendone(self.env.user.partner_id, "pos_retail.pos.session.management", {
                "login_number": session_opened.login_number,
                "session_id": session_opened.session_id.id,
            })
        return self.write({
            "state": "closed",
            "closed_time": fields.Datetime.now(),
            "closed_user_id": self.env.user.id
        })
