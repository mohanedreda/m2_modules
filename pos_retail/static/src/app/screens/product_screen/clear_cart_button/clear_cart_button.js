/** @odoo-module **/

import {_t} from "@web/core/l10n/translation";
import {ProductScreen} from "@point_of_sale/app/screens/product_screen/product_screen";
import {useService} from "@web/core/utils/hooks";
import { ConfirmPopup } from "@point_of_sale/app/utils/confirm_popup/confirm_popup";
import {Component} from "@odoo/owl";
import {usePos} from "@point_of_sale/app/store/pos_hook";

export class ClearCartButton extends Component {
    static template = "pos_retail.ClearCartButton";

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
        const { confirmed } = await this.popup.add(ConfirmPopup, {
            startingValue: this.currentOrder.note || "",
            title: _t("Are you want clear all items in cart ?"),
        });

        if (confirmed) {
            const selectedOrder = this.currentOrder
            selectedOrder.orderlines.forEach(l => {
                selectedOrder.removeOrderline(l)
            })
            selectedOrder.orderlines.forEach(l => {
                selectedOrder.removeOrderline(l)
            })
            selectedOrder.orderlines.forEach(l => {
                selectedOrder.removeOrderline(l)
            })
        }
    }
}
// ------------------------------------------------
// todo: this component will call from product_screen.xml
// ------------------------------------------------
// ProductScreen.addControlButton({
//     component: ClearCartButton, condition: function () {
//         const {config} = this.pos;
//         return config.clear_cart;
//     },
// });
