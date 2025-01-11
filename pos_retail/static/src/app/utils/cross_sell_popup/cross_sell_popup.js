/** @odoo-module */
import {AbstractAwaitablePopup} from "@point_of_sale/app/popup/abstract_awaitable_popup";
import {useState} from "@odoo/owl";
import {usePos} from "@point_of_sale/app/store/pos_hook";
import {ProductBox} from "@pos_retail/app/generic_component/product_box/product_box";
import {floatIsZero} from "@web/core/utils/numbers";

export class CrossSellPopup extends AbstractAwaitablePopup {
    static template = "pos_retail.CrossSellPopup";
    static components = {ProductBox};

    setup() {
        super.setup();
        this.pos = usePos();
        this.state = useState({
            cross_sell: Object.fromEntries(this.props.product.cross_sell_item_ids.map((elem) => [elem, false])),
        });
    }

    areAllCombosSelected() {
        return Object.values(this.state.cross_sell).some((x) => Boolean(x));
    }

    formattedPrice(product) {
        return this.env.utils.formatCurrency(product.get_display_price({ price: product.lst_price }));
    }

    allowDisplayItem(group, product_id) {
        if (group.product_ids.indexOf(product_id) != -1) {
            return true
        } else {
            return false
        }
    }

    getItemsDisplay(group, product) {
        let product_ids = []
        for (let i=0; i < product.cross_sell_item_ids.length; i++) {
            let product_id = product.cross_sell_item_ids[i]
            if (group.product_ids.indexOf(product_id) != -1) {
                product_ids.push(product_id)
            }
        }
        return product_ids
    }
    onChangeCheckbox(ev, product_id) {

    }

    getPayload() {
        const self = this
        let values = this.state.cross_sell
        const getFirstTruthyItem = (obj) => Object.keys(obj).filter((i) => obj[i] === true).map((product_id) => this.pos.db.product_by_id[product_id]);
        let results = getFirstTruthyItem(values)
        return results
    }
}
