/** @odoo-module */
import {AbstractAwaitablePopup} from "@point_of_sale/app/popup/abstract_awaitable_popup";
import {useState} from "@odoo/owl";
import {usePos} from "@point_of_sale/app/store/pos_hook";
import {ProductBox} from "@pos_retail/app/generic_component/product_box/product_box";
import {floatIsZero} from "@web/core/utils/numbers";

export class ProductPackPopup extends AbstractAwaitablePopup {
    static template = "pos_retail.ProductPackPopup";
    static components = {ProductBox};

    setup() {
        super.setup();
        this.pos = usePos();
        const pack_items = []
        const group_ids = this.props.product.pack_group_ids
        this.pack_items_required = []
        for (let i=0; i < group_ids.length; i++) {
            let group_id = group_ids[i]
            let items = this.pos.pack_items_by_group_id[group_id]
            for (let j=0; j < items.length; j++) {
                let item = items[j]
                pack_items.push(items[j].id)
                if (item.default_required) {
                    this.pack_items_required.push(item)
                }
            }
        }

        this.state = useState({
            pack_items: Object.fromEntries(pack_items.map((elem) => [elem, false])),
        });
        for (let pack_item_id in this.state.pack_items) {
            let item = this.pos.pack_item_by_id[pack_item_id]
            if (item.default_selected || item.default_required) {
                this.state.pack_items[pack_item_id] = true
            }
        }
    }

    areAllCombosSelected() {
        return Object.values(this.state.pack_items).some((x) => Boolean(x));
    }

    formattedPrice(price) {
        return this.env.utils.formatCurrency(price);
    }

    onChangeCheckbox(ev, pack_it) {

    }

    getPayload() {
        const self = this
        let values = this.state.pack_items
        const getFirstTruthyItem = (obj) => Object.keys(obj).filter((i) => obj[i] === true).map((pack_item_id) => this.pos.pack_item_by_id[pack_item_id]);
        let results = getFirstTruthyItem(values)
        let items_added = []
        results.forEach((i) => items_added.push(i.id))
        this.pack_items_required.forEach((i) => {
            if (items_added.indexOf(i.id) == -1) {
                results.push(i)
            }
        })
        return results
    }
}
