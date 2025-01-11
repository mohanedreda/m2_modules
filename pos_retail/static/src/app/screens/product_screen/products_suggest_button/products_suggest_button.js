/** @odoo-module **/

import {_t} from "@web/core/l10n/translation";
import {ProductScreen} from "@point_of_sale/app/screens/product_screen/product_screen";
import {useService} from "@web/core/utils/hooks";
import {Component} from "@odoo/owl";
import {usePos} from "@point_of_sale/app/store/pos_hook";
import {ProductsSuggestPopup} from "@pos_retail/app/utils/products_suggest_popup/products_suggest_popup";
import {ErrorPopup} from "@point_of_sale/app/errors/popups/error_popup";

export class ProductsSuggestButton extends Component {
    static template = "pos_retail.ProductsSuggestButton";

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
        if (this.currentOrder && this.currentOrder && this.selectedOrderline && this.selectedOrderline.product.suggest_product_ids && this.selectedOrderline.product.suggest_product_ids.length > 0) {
            const {confirmed, payload: products_suggested} = await this.popup.add(ProductsSuggestPopup, {
                title: _t("Suggestion Products"), product: this.selectedOrderline.product,
            });
            if (products_suggested.length) {
                for (let i=0; i < products_suggested.length; i++) {
                    let product = this.pos.db.product_by_id[products_suggested[i]]
                    this.currentOrder.add_product(product)
                }
            }
        } else {
            return this.popup.add(ErrorPopup, {
                title: _t("Warning"), body: _t("Product not yet setup Products Suggestion"),
            })
        }
    }
}

ProductScreen.addControlButton({
    component: ProductsSuggestButton, condition: function () {
        const {config} = this.pos;
        return config.suggest_products;
    },
});
