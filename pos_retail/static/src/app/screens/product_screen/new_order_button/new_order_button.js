/** @odoo-module **/

import {_t} from "@web/core/l10n/translation";
import {ProductScreen} from "@point_of_sale/app/screens/product_screen/product_screen";
import {useService} from "@web/core/utils/hooks";
import {ConfirmPopup} from "@point_of_sale/app/utils/confirm_popup/confirm_popup";
import {Component, useState} from "@odoo/owl";
import {usePos} from "@point_of_sale/app/store/pos_hook";

export class NewOrderButton extends Component {
    static template = "pos_retail.NewOrderButton";

    setup() {
        super.setup();
        this.pos = usePos();
        this.popup = useService("popup");
        this.orm = useService("orm");
        this.notification = useService("pos_notification");
        this.report = useService("report");
        this.ui = useState(useService("ui"));
    }

    get currentOrder() {
        return this.pos.get_order();
    }

    get currentCustomer() {
        if (this.currentOrder) {
            return this.currentOrder.get_partner()
        }
    }


    onCreateNewOrder() {
        this.pos.add_new_order();
        this.pos.showScreen("ProductScreen");
    }
}

// ------------------------------------------------
// todo: this component will call from product_screen.xml
// ------------------------------------------------
// ProductScreen.addControlButton({
//     component: NewOrderButton, condition: function () {
//         const {config} = this.pos;
//         return config.clear_cart;
//     },
// });
