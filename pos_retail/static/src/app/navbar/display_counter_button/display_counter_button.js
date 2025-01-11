/** @odoo-module */

import {Component, useState} from "@odoo/owl";
import {usePos} from "@point_of_sale/app/store/pos_hook";
import {useService} from "@web/core/utils/hooks";

// Previously UsernameWidget
export class DisplayCounterButton extends Component {
    static template = "pos_retail.DisplayCounterButton";

    setup() {
        this.pos = usePos();
        this.ui = useState(useService("ui"));
    }

    get username() {
        const {name} = this.pos.get_cashier();
        return name ? name : "";
    }

    get avatar() {
        const user_id = this.pos.get_cashier_user_id();
        const id = user_id ? user_id : -1;
        return `/web/image/res.users/${id}/avatar_128`;
    }

    get cssClass() {
        return {"not-clickable": true};
    }

    get currentOrder() {
        return this.pos.get_order();
    }

    get itemsCount() {
        if (this.currentOrder) {
            return this.currentOrder.orderlines.length
        } else {
            return 0
        }

    }

    get quantityCount() {
        let total_qty = 0
        if (this.currentOrder) {
            this.currentOrder.orderlines.forEach(l => total_qty += l.quantity)
        }
        return total_qty
    }

    get totalAmount() {
        if (this.currentOrder) {
            return this.env.utils.formatCurrency(this.currentOrder.get_total_with_tax())
        }
        return this.env.utils.formatCurrency(0)
    }

    get totalTax() {
        if (this.currentOrder) {
            return this.env.utils.formatCurrency(this.currentOrder.get_total_tax())
        }
        return this.env.utils.formatCurrency(0)
    }

    get totalDiscount() {
        if (this.currentOrder) {
            return this.env.utils.formatCurrency(this.currentOrder.get_total_discount())
        }
        return this.env.utils.formatCurrency(0)
    }


    async click() {
        this.pos.showScreen("InvoiceManagementScreen");
    }

    async showHideNumpad() {

    }
}
