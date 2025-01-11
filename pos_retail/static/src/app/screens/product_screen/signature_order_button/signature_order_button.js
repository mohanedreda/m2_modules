/** @odoo-module **/

import {_t} from "@web/core/l10n/translation";
import {ProductScreen} from "@point_of_sale/app/screens/product_screen/product_screen";
import {useService} from "@web/core/utils/hooks";
import { SignaturePopup } from "@pos_retail/app/utils/signature_popup/signature_popup";
import {Component} from "@odoo/owl";
import {usePos} from "@point_of_sale/app/store/pos_hook";

export class SignatureOrderButton extends Component {
    static template = "pos_retail.SignatureOrderButton";

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
        const { confirmed, payload: signDatas } = await this.popup.add(SignaturePopup, {
            startingValue: this.currentOrder.note || "",
            title: _t("Sign to Order"),
        });

        if (confirmed) {
            this.currentOrder.signature = signDatas.signature[1]
        }
    }
}

ProductScreen.addControlButton({
    component: SignatureOrderButton, condition: function () {
        const {config} = this.pos;
        return config.signature_order;
    },
});
