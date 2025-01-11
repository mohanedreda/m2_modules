/** @odoo-module */

import {OrderWidget} from "@point_of_sale/app/generic_components/order_widget/order_widget";
import {usePos} from "@point_of_sale/app/store/pos_hook";
import {patch} from "@web/core/utils/patch";

patch(OrderWidget.prototype, {

    setup() {
        this.pos = usePos();
    },

    get currentOrder() {
        return this.pos.get_order();
    }
});
