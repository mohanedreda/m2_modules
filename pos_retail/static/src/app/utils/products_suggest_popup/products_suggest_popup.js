/** @odoo-module */
import { AbstractAwaitablePopup } from "@point_of_sale/app/popup/abstract_awaitable_popup";
import { useState } from "@odoo/owl";
import {usePos} from "@point_of_sale/app/store/pos_hook";
import { ProductCard } from "@point_of_sale/app/generic_components/product_card/product_card";
import { floatIsZero } from "@web/core/utils/numbers";

export class ProductsSuggestPopup extends AbstractAwaitablePopup {
    static template = "pos_retail.ProductsSuggestPopup";
    static components = { ProductCard };

    setup() {
        super.setup();
        this.pos = usePos();
        this.state = useState({
            products_selected: []
        });
    }

    _selectProduct(product_id) {
        if (this.state.products_selected.indexOf(product_id) != -1) {
            this.state.products_selected = this.state.products_selected.filter(id => id != product_id)
        } else {
            this.state.products_selected.push(product_id)
        }
    }

    _isSelected(product_id) {
        if (this.state.products_selected.indexOf(product_id) != -1) {
            return true
        } else {
            return false
        }
    }
    getTotalPrice() {
        const selectedProducts = this.getPayload();
        const extraPrice = selectedProducts.reduce((sum, product_id) => {
            const product = this.pos.db.product_by_id[product_id];
            return sum + product.get_display_price();
        }, 0);
        return this.props.product.lst_price + extraPrice;
    }

    areAllCombosSelected() {
        return Object.values(this.state.products_selected).every((x) => Boolean(x));
    }

    formattedComboPrice(product) {
        return this.env.utils.formatCurrency(product.get_display_price({ price: product.list_price }));
    }

    /**
     * @returns {Object}
     */
    getPayload() {
        return Object.values(this.state.products_selected)
            .filter((x) => x) // we only keep the non-zero values
    }
}
