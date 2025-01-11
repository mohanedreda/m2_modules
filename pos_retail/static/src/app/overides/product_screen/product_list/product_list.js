/** @odoo-module */

import {ProductsWidget} from "@point_of_sale/app/screens/product_screen/product_list/product_list";
import {usePos} from "@point_of_sale/app/store/pos_hook";
import {patch} from "@web/core/utils/patch";
import { EventBus, reactive } from "@odoo/owl";


patch(ProductsWidget.prototype, {
    async changeProductsDisplayView() {
        if (this.pos.config.products_display == 'card') {
            this.pos.config.products_display = 'list'
        } else {
            this.pos.config.products_display = 'card'
        }
        // EventBus.trigger("update")
    }
});
