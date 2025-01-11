/** @odoo-module */

import {Component, useState} from "@odoo/owl";
import {usePos} from "@point_of_sale/app/store/pos_hook";
import {useService} from "@web/core/utils/hooks";
import {ConfirmPopup} from "@point_of_sale/app/utils/confirm_popup/confirm_popup";
import {_t} from "@web/core/l10n/translation";
import {NumberPopup} from "@point_of_sale/app/utils/input_popups/number_popup";

export class LockScreenButton extends Component {
    static template = "pos_retail.LockScreenButton";

    setup() {
        this.pos = usePos();
        this.popup = useService("popup");
        this.orm = useService("orm");
    }
    async click() {
        const {confirmed, payload} = await this.popup.add(NumberPopup, {
            title: _t("Please input password for lock/unlock screen ?"),
            startingValue: "",
            isInputSelected: true,
            isPassword: true
        });
        if (confirmed) {
            const pos_pin = parseInt(payload)
            if (pos_pin == this.pos.user.pos_pin) {
                this.pos.pos_session.is_locked = !this.pos.pos_session.is_locked
                this.orm.call("pos.session", "write", [[this.pos.pos_session.id], {
                    "is_locked": this.pos.pos_session.is_locked
                }]);
            } else {
                this.popup.add(ConfirmPopup, {
                    title: _t("You pass pin incorrect, please check with admin system ?"),
                });
            }
        }
    }
}
