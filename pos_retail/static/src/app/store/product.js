/** @odoo-module */

import {Product} from "@point_of_sale/app/store/models";
import {patch} from "@web/core/utils/patch";
import {ProductsSuggestPopup} from "@pos_retail/app/utils/products_suggest_popup/products_suggest_popup";
import {_t} from "@web/core/l10n/translation";
import {CrossSellPopup} from "@pos_retail/app/utils/cross_sell_popup/cross_sell_popup";
import {ProductPackPopup} from "@pos_retail/app/utils/product_pack_popup/product_pack_popup";


patch(Product.prototype, {
    setup(defaultObj) {
        const res = super.setup(...arguments);
        return res
    },

    isTracked() {
        // todo: when scan barcode , we found lot and add newPackLotLines to product, so we no need popup input barcode, we make automatic add to cart along product
        const res = super.isTracked()
        const stock_lots = this.pos.stock_lots
        let lots_of_product = null
        if (stock_lots) {
            lots_of_product = stock_lots.find(l => l.product_id[0] == this.id)
        }
        if (res == true && ((this.newPackLotLines && this.newPackLotLines.length == 1)) || lots_of_product) {
            return false
        }
        return res
    },

    get_price(pricelist, quantity, price_extra = 0, recurring = false) {
        const core_price = super.get_price(pricelist, quantity, price_extra, recurring)
        return core_price
    },

    async getAddProductOptions(code) {
        const datas = await super.getAddProductOptions(code)
        if (!datas) {
            return datas
        }
        datas['cross_sell'] = []
        if (this.pos.config.suggest_products && this.suggest_product_ids && this.suggest_product_ids.length > 0) {
            const {confirmed, payload: products_suggested} = await this.env.services.popup.add(ProductsSuggestPopup, {
                title: _t("Suggestion Products"), product: this,
            });
            if (products_suggested.length) {
                datas["products_suggested"] = products_suggested
            }
        }
        if (this.pos.config.discount_customer_group && this.pos.res_partner_category_by_id && this.pos.selectedOrder && this.pos.selectedOrder.get_partner()) {
            const partner = this.pos.selectedOrder.get_partner()
            if (partner["discount_group"] && partner["discount_group_id"] && this.pos.res_partner_category_by_id[partner["discount_group_id"][0]] && this.pos_categ_ids && this.pos_categ_ids.length > 0) {
                let discount_group = this.pos.res_partner_category_by_id[partner["discount_group_id"][0]]
                const matching_rule = this.pos_categ_ids.filter(c_id => discount_group["pos_discount_categ_ids"].indexOf(c_id))
                if (matching_rule) {
                    datas["discount_group"] = discount_group
                }
            }
        }
        if (this.pos.config.enable_cross_sell && this.cross_sell_item_ids && this.cross_sell_item_ids.length > 0) {
            const { confirmed, payload } = await this.env.services.popup.add(
                CrossSellPopup,
                { product: this }
            );
            if (!confirmed) {
                return;
            }
            datas['cross_sell_items'] = payload
        }
        if (this.pos.config.enable_pack_group && this.pack_group_ids && this.pack_group_ids.length > 0) {
            const { confirmed, payload } = await this.env.services.popup.add(
                ProductPackPopup,
                { product: this }
            );
            if (!confirmed) {
                return;
            }
            datas['pack_items'] = payload
        }
        return datas
    }
})