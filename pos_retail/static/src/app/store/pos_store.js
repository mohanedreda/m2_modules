/** @odoo-module */

import {patch} from "@web/core/utils/patch";
import {PosStore} from "@point_of_sale/app/store/pos_store";

const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
if (!indexedDB) {
    window.alert("Your browser doesn't support a stable version of IndexedDB.")
}

patch(PosStore.prototype, {


    async load_server_data() {
        const res = await super.load_server_data()
        if (this.config.display_onhand) {
            const product_onhand_peer_location = await this.get_stock_datas_by_locationIds([], this.stock_location_ids)
            if (product_onhand_peer_location) {
                this.save_product_onhand_by_location(product_onhand_peer_location)
            }
        }
        return res
    },

    async closePos() {
        const closing_process = await super.closePos()
        if (this.user.pos_logout_direct) {
            return window.location = '/web/session/logout'
        }
    },

    async _processData(loadedData) {
        const config = loadedData["pos.config"]
        const res = await super._processData(...arguments);
        if (config.display_onhand) {
            this.stock_location_ids = [loadedData["stock.picking.type"]['default_location_src_id'][0]]
            this.default_location_src_id = loadedData["stock.picking.type"]['default_location_src_id'][0]
            this._save_stock_location(loadedData["stock.location"])
        }
        this.product_by_barcode = {}
        if (config.product_multi_barcode) {
            const productsBarcode = loadedData["product.barcode"]
            this._save_product_barcode(productsBarcode)
        }
        if (config.products_multi_unit) {
            const units_price = loadedData["product.uom.price"]
            this._save_units_price(units_price)
        }
        if (config.invoice_screen) {
            const journals = loadedData["account.journal"]
            this.journals = journals.filter((j) => j.inbound_payment_method_line_ids.length > 0 && j.outbound_payment_method_line_ids.length > 0)
            const payment_method_lines = loadedData["account.payment.method.line"]
            this.payment_method_lines = payment_method_lines
        }
        if (config.discount_customer_group && loadedData["res.partner.category"]) {
            this.res_partner_category_by_id = {}
            loadedData["res.partner.category"].forEach(rpc => this.res_partner_category_by_id[rpc.id] = rpc)
        }
        if (config.credit_feature) {
            this.credit_program = loadedData["res.partner.credit.program"]
        }
        if (config.lot_serial_allow_scan || config.lot_serial_allow_select) {
            this.stock_lots = loadedData["stock.lot"]
        }
        if (config.enable_cross_sell) {
            this.product_cross_sell_groups = loadedData["product.cross.sell.group"]
            this.product_cross_sell_group_by_id = {}
            for (let i = 0; i < this.product_cross_sell_groups.length; i++) {
                let group = this.product_cross_sell_groups[i]
                this.product_cross_sell_group_by_id[group.id] = group
            }
        }
        if (config.enable_pack_group) {
            this.product_packs = loadedData["product.pack"]
            this.product_pack_groups = loadedData["product.pack.group"]
            this.product_pack_group_by_id = {}
            this.pack_items_by_group_id = {}
            this.pack_item_by_id = {}
            for (let i = 0; i < this.product_pack_groups.length; i++) {
                this.product_pack_group_by_id[this.product_pack_groups[i].id] = this.product_pack_groups[i]
            }
            for (let i = 0; i < this.product_packs.length; i++) {
                let item = this.product_packs[i]
                this.pack_item_by_id[item.id] = item
                let group_id = item['group_id'][0]
                if (!this.pack_items_by_group_id[group_id]) {
                    this.pack_items_by_group_id[group_id] = [item]
                } else {
                    this.pack_items_by_group_id[group_id].push(item)
                }
            }
        }
        if (config.enable_multi_currency) {
            this.currencies = loadedData["multi.res.currency"]
            this.currency_by_id = {}
            for (let i = 0; i < this.currencies.length; i++) {
                this.currency_by_id[this.currencies[i]['id']] = this.currencies[i]
            }
        }
        if (config.enable_order_type) {
            this.pos_order_types = loadedData["pos.order.type"]
        }
        return res
    },

    _save_units_price(units_price) {
        for (let i = 0; i < units_price.length; i++) {
            let unit_price = units_price[i]
            let product_id = unit_price.product_id[0]
            let product = this.db.product_by_id[product_id]
            if (product) {
                if (!product["units_price"]) {
                    product["units_price"] = [unit_price]
                } else {
                    product["units_price"].push(unit_price)
                }
            }
        }
    },

    _save_product_barcode(productsBarcode) {
        for (let i = 0; i < productsBarcode.length; i++) {
            let barcode = productsBarcode[i]
            let product_id = barcode.product_id[0]
            let product = this.db.product_by_id[product_id]
            if (product) {
                this.product_by_barcode[barcode.name] = product
            }
        }
    },

    _save_stock_location(stock_locations) {
        this.stock_location_by_id = {}
        this.stock_locations = stock_locations;
        this.self_stock_location = this.stock_locations.find(s => s.id == this.default_location_src_id)
        this.stock_locations.forEach(l => this.stock_location_by_id[l.id] = l)
    },


    async after_load_server_data() {
        const res = await super.after_load_server_data()
        return res
    },

    async get_stock_datas_by_locationIds(product_ids = [], location_ids = []) {
        let productsOnHandByLocation = {}
        try {
            productsOnHandByLocation = await this.orm.call("stock.location", "get_stocks_by_locations", [this.stock_location_ids, product_ids, location_ids])
            return productsOnHandByLocation
        } catch (ex) {
            const message = ex.message;
            console.warn(message)
            return productsOnHandByLocation
        }
    },


    save_product_onhand_by_location(productsOnHandByLocation) {
        for (let location_id in productsOnHandByLocation) {
            location_id = parseInt(location_id)
            for (let product_id in productsOnHandByLocation[location_id]) {
                if (parseInt(product_id) != 0) {
                    let product = this.db.product_by_id[parseInt(product_id)]
                    if (product) {
                        product["stocks_by_location"] = {}
                        product["stocks_by_location"][location_id] = productsOnHandByLocation[location_id][product_id]
                    }
                }
            }
        }
    },

    _assignApplicableItems(pricelist, correspondingProduct, pricelistItem) {
        if (!(pricelist.id in correspondingProduct.applicablePricelistItems)) {
            correspondingProduct.applicablePricelistItems[pricelist.id] = [];
        }
        if (pricelistItem && pricelistItem['applied_on'] == 'pos_category') {
            if (correspondingProduct && correspondingProduct.pos_categ_ids) {
                for (let i = 0; i < correspondingProduct.pos_categ_ids.length; i++) {
                    let pos_categ_id = correspondingProduct.pos_categ_ids[i]
                    if (pricelistItem.pos_category_ids && pricelistItem.pos_category_ids.indexOf(pos_categ_id) != -1) {
                        correspondingProduct.applicablePricelistItems[pricelist.id].push(pricelistItem);
                        break
                    }
                }
            }
            return true
        }
        if (pricelistItem && pricelistItem['applied_on'] == '2_product_category') {
            if (correspondingProduct && correspondingProduct.categ_id) {
                if (pricelistItem.categ_id && pricelistItem.categ_id[0] == correspondingProduct.categ_id[0]) {
                    correspondingProduct.applicablePricelistItems[pricelist.id].push(pricelistItem);
                }
            }
            return true

        }
        return super._assignApplicableItems(pricelist, correspondingProduct, pricelistItem)
    },

    set_cashier(employee) {
        const res = super.set_cashier(employee)
        if (employee.point_of_sale_security) {
            // todo: all security point of point of sale setting will replace by point of sale security of employee selected
            this.config.disable_set_discount = employee.disable_set_discount
            this.config.disable_set_price = employee.disable_set_price
            this.config.disable_remove_line = employee.disable_remove_line
            this.config.disable_plus_minus = employee.disable_plus_minus
            this.config.disable_set_payment = employee.disable_set_payment
            this.config.disable_set_customer = employee.disable_set_customer
            this.config.disable_remove_order = employee.disable_remove_order
            this.config.disable_return_order = employee.disable_return_order
        } else {
            this.config.disable_set_discount = false
            this.config.disable_set_price = false
            this.config.disable_remove_line = false
            this.config.disable_plus_minus = false
            this.config.disable_set_payment = false
            this.config.disable_set_customer = false
            this.config.disable_remove_order = false
            this.config.disable_return_order = false
        }
        return res
    },

    getReceiptHeaderData() {
        const receiptHeaderData = super.getReceiptHeaderData()
        if (this.config.logo) {
            receiptHeaderData["logo"] = "data:image/png;base64," + this.config.logo
        }
        return receiptHeaderData
    },

    async getLotsByProductId(product) {
        try {
            return await this.env.services.rpc({
                model: "stock.lot", method: "get_lots_by_product_id", kwargs: {
                    product_id: product.id, company_id: this.env.session.company_id,
                },
            }, {shadow: true});
        } catch (error) {
            console.error(error);
            return [];
        }
    },
})