/** @odoo-module */

import { Orderline } from "@point_of_sale/app/generic_components/orderline/orderline";
import { patch } from "@web/core/utils/patch";
import {usePos} from "@point_of_sale/app/store/pos_hook";

patch(Orderline.prototype, {
    setup(options) {
        super.setup(...arguments);
        this.pos = usePos()
    },

    get currentOrder() {
        return this.pos.get_order();
    },

    get selectedOrderline() {
        return this.currentOrder.get_selected_orderline()
    },
})