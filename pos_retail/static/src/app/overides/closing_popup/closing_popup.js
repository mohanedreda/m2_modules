/** @odoo-module */

import { ClosePosPopup } from "@point_of_sale/app/navbar/closing_popup/closing_popup";
import { patch } from "@web/core/utils/patch";
import {usePos} from "@point_of_sale/app/store/pos_hook";

patch(ClosePosPopup.prototype, {
    async closeSession() {
        const closing_process = await super.closeSession()
        if (this.pos.user.pos_logout_direct) {
            return window.location = '/web/session/logout'
        }
    }
})