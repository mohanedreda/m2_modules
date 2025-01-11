/** @odoo-module **/

import {_t} from "@web/core/l10n/translation";
import {ProductScreen} from "@point_of_sale/app/screens/product_screen/product_screen";
import {useService} from "@web/core/utils/hooks";
import { TextAreaPopup } from "@point_of_sale/app/utils/input_popups/textarea_popup";
import {Component} from "@odoo/owl";
import {usePos} from "@point_of_sale/app/store/pos_hook";

export class NoteOrderButton extends Component {
    static template = "pos_retail.NoteOrderButton";

    setup() {
        super.setup();
        this.pos = usePos();
        this.popup = useService("popup");
        this.orm = useService("orm");
        this.notification = useService("pos_notification");
        this.report = useService("report");
    }

    get currentOrder() {
        return this.pos.get_order();
    }


    async click() {
        const { confirmed, payload: inputNote } = await this.popup.add(TextAreaPopup, {
            startingValue: this.currentOrder.note || "",
            title: _t("Add Order Note"),
        });

        if (confirmed) {
            this.currentOrder.note = inputNote
        }
    }
}

ProductScreen.addControlButton({
    component: NoteOrderButton, condition: function () {
        const {config} = this.pos;
        return config.note_order;
    },
});
