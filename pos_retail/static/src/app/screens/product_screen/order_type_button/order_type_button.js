/** @odoo-module **/

import {_t} from "@web/core/l10n/translation";
import {ProductScreen} from "@point_of_sale/app/screens/product_screen/product_screen";
import {useService} from "@web/core/utils/hooks";
import {SelectionPopup} from "@point_of_sale/app/utils/input_popups/selection_popup";
import {Component} from "@odoo/owl";
import {usePos} from "@point_of_sale/app/store/pos_hook";
import {ErrorPopup} from "@point_of_sale/app/errors/popups/error_popup";

export class OrderTypeButton extends Component {
    static template = "pos_retail.OrderTypeButton";

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

    get _getOrderType() {
        if (this.currentOrder && this.currentOrder.type_id) {
            const type = this.pos.pos_order_types.find(t => t.id == this.currentOrder.type_id)
            return type.name
        } else {
            return _t("Set Order Type")
        }
    }

    async click() {
        if (this.pos.config.enable_order_type && this.pos.pos_order_types && this.pos.pos_order_types.length > 1) {
            let selectionList = []
            this.pos.pos_order_types.forEach(l => {
                selectionList.push({
                    id: l.id, label: l.name, isSelected: false, item: l
                })
            })
            selectionList.forEach(i => {
                if (i.id == this.type_id) {
                    i.isSelected = true
                }
            })
            const {confirmed, payload: selected_type} = await this.pos.popup.add(SelectionPopup, {
                title: _t("Select Order Type"), list: selectionList,
            });
            if (confirmed) {
                this.currentOrder.type_id = selected_type.id
            }
        }
    }
}

ProductScreen.addControlButton({
    component: OrderTypeButton, condition: function () {
        const {config} = this.pos;
        return config.enable_order_type;
    },
});
