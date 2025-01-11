/** @odoo-module **/

import {_t} from "@web/core/l10n/translation";
import {ProductScreen} from "@point_of_sale/app/screens/product_screen/product_screen";
import {useService} from "@web/core/utils/hooks";
import {Component} from "@odoo/owl";
import {usePos} from "@point_of_sale/app/store/pos_hook";
import {SelectionPopup} from "@point_of_sale/app/utils/input_popups/selection_popup";

export class ProductUnitButton extends Component {
    static template = "pos_retail.ProductUnitButton";

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

    get selectedOrderline() {
        return this.currentOrder.get_selected_orderline()
    }

    async click() {
        if (this.selectedOrderline && this.selectedOrderline.product.units_price) {
            const product = this.selectedOrderline.product
            let selectionList = [{
                id: null, label: product.uom_id[1], isSelected: true, item: product.uom_id,
            }]
            for (let i = 0; i < product.units_price.length; i++) {
                let unit_price = product.units_price[i]
                selectionList.push({
                    id: unit_price["uom_id"][0], label: unit_price["uom_id"][1], isSelected: false, item: unit_price,
                })
            }
            const {confirmed, payload: selectedUnit} = await this.popup.add(SelectionPopup, {
                title: _t("Select the unit"), list: selectionList,
            });
            if (confirmed) {
                if (selectedUnit["id"] == null) {
                    this.selectedOrderline["product_uom_id"] = product.uom_id[0]
                    this.selectedOrderline.set_unit_price(this.selectedOrderline.product.get_price())
                } else {
                    let price = selectedUnit["price"]
                    this.selectedOrderline["product_uom_id"] = selectedUnit["uom_id"][0]
                    this.selectedOrderline.set_unit_price(price)
                }
            }

        }
    }
}

ProductScreen.addControlButton({
    component: ProductUnitButton, condition: function () {
        const {config} = this.pos;
        return config.products_multi_unit;
    },
});
