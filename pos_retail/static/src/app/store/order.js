/** @odoo-module */

import {Order} from "@point_of_sale/app/store/models";
import {patch} from "@web/core/utils/patch";
import {PosCollection} from "@point_of_sale/app/store/models";
import {SelectionPopup} from "@point_of_sale/app/utils/input_popups/selection_popup";
import {_t} from "@web/core/l10n/translation";
import {Orderline} from "@point_of_sale/app/store/models";
import { renderToElement } from "@web/core/utils/render";

patch(Order.prototype, {

    setup(_defaultObj, options) {
        super.setup(...arguments);
        if (!this.delivery_name && !options.json) {
            this.delivery_name = ""
        }
        if (!this.delivery_address && !options.json) {
            this.delivery_address = ""
        }
        if (!this.delivery_phone && !options.json) {
            this.delivery_phone = ""
        }
        if (!this.delivery_date && !options.json) {
            this.delivery_date = ""
        }
        if (!this.payment_partial_amount && !options.json) {
            this.payment_partial_amount = 0
        }
        if (!this.payment_partial_method_id && !options.json) {
            this.payment_partial_method_id = null
        }
        if (!this.note && !options.json) {
            this.note = ""
        }
        if (!this.sale_id && !options.json) {
            this.sale_id = null
        }
        if (!this.signature && !options.json) {
            this.signature = null
        }
        if (!options.json && this.pos.config.order_auto_invoice) {
            this.set_to_invoice(true)
        }
        if (!options.json && this.pos.config.partner_default_id) {
            let partner = this.pos.db.get_partner_by_id(this.pos.config.partner_default_id[0]);
            if (partner) {
                this.set_partner(partner)
            }
        }
        if (!options.json && this.pos.config.product_default_ids) {
            for (let i = 0; i < this.pos.config.product_default_ids.length; i++) {
                let product = this.pos.db.product_by_id[this.pos.config.product_default_ids[i]]
                if (product) {
                    this.add_product(product)
                }
            }

        }
        if (!options.json && this.pos.config.enable_order_type) {
            this.type_id = this.pos.config.enable_type_id[0]
        }
    },

    export_as_JSON() {
        const json = super.export_as_JSON(...arguments);
        if (this.delivery_name) {
            json.delivery_name = this.delivery_name
            json.delivery_address = this.delivery_address
            json.delivery_phone = this.delivery_phone
            json.delivery_date = this.delivery_date
        }
        if (this.payment_partial_amount) {
            json.payment_partial_amount = this.payment_partial_amount
        }
        if (this.payment_partial_method_id) {
            json.payment_partial_method_id = this.payment_partial_method_id
        }
        if (this.note) {
            json.note = this.note
        }
        if (this.sale_id) {
            json.sale_id = this.sale_id
        }
        if (this.signature) {
            json.signature = this.signature
        }
        if (this.get_partner() && this.pos.config.offline_create_customer) {
            json.offline_partner_value = this.get_partner()
        }
        if (this.type_id) {
            json.type_id = this.type_id
        }
        return json;
    },

    init_from_JSON(json) {
        super.init_from_JSON(...arguments);
        if (json.delivery_name) {
            this.delivery_name = json.delivery_name
            this.delivery_address = json.delivery_address
            this.delivery_phone = json.delivery_phone
            this.delivery_date = json.delivery_date
            this.payment_partial_amount = json.payment_partial_amount
            this.payment_partial_method_id = json.payment_partial_method_id
            this.note = json.note
            this.sale_id = json.sale_id
        }
        if (json.payment_partial_amount) {
            this.payment_partial_amount = json.payment_partial_amount
        }
        if (json.payment_partial_method_id) {
            this.payment_partial_method_id = json.payment_partial_method_id
        }
        if (json.note) {
            this.note = json.note
        }
        if (json.sale_id) {
            this.sale_id = json.sale_id
        }
        if (json.signature) {
            this.signature = json.signature
        }
        if (json.type_id) {
            this.type_id = json.type_id
            const order_type = this.pos.pos_order_types.find(type => type.id == this.type_id)
            if (this.get_partner() && order_type['home_delivery']) {
                this.delivery_address = this.get_partner().name + ", " + this.get_partner()['address']
            }
        }
    },

    export_for_printing() {
        const data = super.export_for_printing(...arguments);
        if (this.delivery_name) {
            data.delivery_name = this.delivery_name
            data.delivery_address = this.delivery_address
            data.delivery_phone = this.delivery_phone
            data.delivery_date = this.delivery_date
            data.payment_partial_amount = this.payment_partial_amount
            data.payment_partial_method_id = this.payment_partial_method_id
            data.note = this.note
            data.sale_id = this.sale_id
        }
        if (this.payment_partial_amount) {
            data.payment_partial_amount = this.payment_partial_amount
        }
        if (this.payment_partial_method_id) {
            data.payment_partial_method_id = this.payment_partial_method_id
        }
        if (this.note) {
            data.note = this.note
        }
        if (this.sale_id) {
            data.sale_id = this.sale_id
        }
        if (this.signature) {
            data.signature = this.signature
        }
        if (this.type_id) {
            data.order_type = this.pos.pos_order_types.find(type => type.id == this.type_id)
        }
        if (this.delivery_address) {
            data["delivery_address"] = this.delivery_address
        }
        if (this.draft_bill) {
            data['headerData']['draft_bill'] = true
        } else {
            data['headerData']['draft_bill'] = null
        }
        // todo: fixed for pos_loyalty , export_for_printing missed variable partner
        if (this.get_partner()) {
            data["partner"] = this.get_partner()
        }
        return data;
    },

    // async pay() {
    //     return await super.pay()
    //
    // },

    _covert_pos_line_to_sale_line: function (line) {
        let product = this.pos.db.get_product_by_id(line.product_id);
        let line_val = {
            product_id: line.product_id,
            price_unit: line.price_unit,
            product_uom_qty: line.qty,
            discount: line.discount,
            product_uom: product.uom_id[0],
        };
        if (line.uom_id) {
            line_val['product_uom'] = line.uom_id
        }
        if (line.variants) {
            line_val['variant_ids'] = [[6, false, []]];
            for (let j = 0; j < line.variants.length; j++) {
                let variant = line.variants[j];
                line_val['variant_ids'][0][2].push(variant.id)
            }
        }
        if (line.tax_ids) {
            line_val['tax_id'] = line.tax_ids;
        }
        if (line.note) {
            line_val['note'] = line.note;
        }
        return [0, 0, line_val];
    },

    add_orderline(line) {
        const res = super.add_orderline(...arguments);
        if (line.sale_order_origin_id) {
            line.order['sale_id'] = line.sale_order_origin_id.id
        }
        return res
    },

    get_signature: function () {
        if (this.signature) {
            return 'data:image/png;base64, ' + this.signature
        } else {
            return null
        }
    },


    async add_product(product, options) {
        const res = super.add_product(product, options)
        if (options && options["products_suggested"]) {
            const products_suggested = options["products_suggested"]
            for (let i = 0; i < products_suggested.length; i++) {
                let product = this.pos.db.product_by_id[products_suggested[i]]
                this.add_product(product)
            }
        }
        if (options && options["discount_group"]) {
            let selected_orderline = this.selected_orderline
            if (selected_orderline) {
                selected_orderline.extra_discount = options["discount_group"]["pos_discount"]

            }
        }
        // todo: user scan barcode and if found code of lot, newPackLotLines will set to product
        if (product.newPackLotLines && product.newPackLotLines.length == 1) {
            let draftPackLotLines = {
                modifiedPackLotLines: product.modifiedPackLotLines || {}, newPackLotLines: product.newPackLotLines,
            }
            // todo: if product tracking is none but have lot/serial in backend, default odoo not define pack_lot_lines, we need set it before call method set_product_lot
            if (product.tracking == "none") {
                this.selected_orderline.pack_lot_lines = new PosCollection();
            }
            this.selected_orderline.setPackLotLines(draftPackLotLines);
            product["modifiedPackLotLines"] = null
            product["newPackLotLines"] = null
        }
        // todo: if user set lot manual, not need display popup selection code
        if ((!this.selected_orderline.pack_lot_lines || this.selected_orderline.pack_lot_lines.length == 0) && ["serial", "lot"].includes(this.selected_orderline.product.tracking) && (this.pos.picking_type.use_create_lots || this.pos.picking_type.use_existing_lots)) {
            const stock_lots = this.pos.stock_lots
            let lots_of_product = null
            if (stock_lots) {
                lots_of_product = stock_lots.filter(l => l.product_id[0] == this.selected_orderline.product.id)
                let selectionList = []
                lots_of_product.forEach(l => {
                    selectionList.push({
                        id: l.id, label: l.name, isSelected: false, item: l
                    })
                })
                const {confirmed, payload: selected_session} = await this.pos.popup.add(SelectionPopup, {
                    title: _t("Select Lot/Serial of ") + this.selected_orderline.product.display_name,
                    list: selectionList,
                });
                if (confirmed) {
                    let draftPackLotLines = {
                        modifiedPackLotLines: {}, newPackLotLines: [{lot_name: selected_session["name"]}],
                    }
                    this.selected_orderline.setPackLotLines(draftPackLotLines);
                }
            }
        }
        // todo: cross sell
        if (options && options.cross_sell_items) {
            await this.addCrossSellItems(options.cross_sell_items);
        }
        // todo: product pack
        if (options && options.pack_items) {
            await this.addPackItems(options.pack_items);
        }
        if (this.pos.config.auto_clear_searchbox) {
            this.pos.searchProductWord = ""
        }
        return res
    },

    addCrossSellItems(cross_sell_items) {
        for (let i = 0; i < cross_sell_items.length; i++) {
            let product = cross_sell_items[i]
            const line = new Orderline({env: this.env}, {
                pos: this.pos, order: this, product: product, quantity: 1, cross_sell: true
            });
            line.cross_sell = true
            this.add_orderline(line);
        }
    },

    addPackItems(pack_items) {
        for (let i = 0; i < pack_items.length; i++) {
            let pack_item = pack_items[i]
            let product = this.pos.db.product_by_id[pack_item['product_id'][0]]
            const line = new Orderline({env: this.env}, {
                pos: this.pos,
                order: this,
                product: product,
                quantity: 1,
                cross_sell: true,
                price: pack_item['sale_price'],
            });
            line.cross_sell = true
            this.add_orderline(line);
        }
    },

    set_partner(partner) {
        const last_partner = this.get_partner()
        const res = super.set_partner(partner)
        for (const line of this.get_orderlines()) {
            if (line.extra_discount) {
                line.discount = line.discount - line.extra_discount
                if (line.discount < 0) {
                    line.discount = 0
                }
                line.extra_discount = 0
            }
        }
        if (this.pos.config.discount_customer_group && this.pos.res_partner_category_by_id && this.get_partner()) {
            const partner = this.get_partner()
            for (const line of this.get_orderlines()) {
                if (partner["discount_group"] && partner["discount_group_id"] && this.pos.res_partner_category_by_id[partner["discount_group_id"][0]] && line.product.pos_categ_ids && line.product.pos_categ_ids.length > 0) {
                    let discount_group = this.pos.res_partner_category_by_id[partner["discount_group_id"][0]]
                    const matching_rule = line.product.pos_categ_ids.filter(c_id => discount_group["pos_discount_categ_ids"].indexOf(c_id))
                    if (matching_rule) {
                        line.extra_discount = discount_group["pos_discount"]
                    }
                }
            }
        }
        return res
    },

    updatePricelistAndFiscalPosition(newPartner) {
        if (newPartner['id'] != '++offline-id-save-later++') {
            return super.updatePricelistAndFiscalPosition(newPartner)
        }
        return true
    },
})