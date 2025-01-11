/** @odoo-module */

import {ProductCard} from "@point_of_sale/app/generic_components/product_card/product_card";
import {ProductOnHand} from "@pos_retail/app/screens/product_screen/product_onhand/product_onhand";
import {usePos} from "@point_of_sale/app/store/pos_hook";
import {patch} from "@web/core/utils/patch";

ProductCard.components = {ProductOnHand}

patch(ProductCard.prototype, {

    setup() {
        this.pos = usePos();
    },

    get _allowDisplayOnhand() {
        if (this.pos.default_location_src_id && this.pos.db.product_by_id[this.props.productId]['stocks_by_location'] && this.pos.db.product_by_id[this.props.productId]['detailed_type'] == 'product') {
            return true
        } else {
            return false
        }
    }

});
