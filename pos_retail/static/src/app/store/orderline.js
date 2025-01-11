/** @odoo-module */

import { Orderline } from "@point_of_sale/app/store/models";
import { patch } from "@web/core/utils/patch";

patch(Orderline.prototype, {
    setup(options) {
        super.setup(...arguments);
        if (arguments && arguments.length && arguments[1]['cross_sell']) {
            this.cross_sell = true
        }
    },

    export_as_JSON() {
        const json = super.export_as_JSON(...arguments);
        if (this.product_uom_id) {
            json.product_uom_id = this.product_uom_id
        }
        json.extra_discount = this.extra_discount
        if (this.cross_sell) {
            json.cross_sell = true
        }
        return json;
    },

    init_from_JSON(json) {
        super.init_from_JSON(...arguments);
        if (json.product_uom_id) {
            this.product_uom_id = json.product_uom_id
        }
        if (json.extra_discount) {
            this.extra_discount = json.extra_discount
        }
        if (json.discount && json.extra_discount) {
            this.set_discount(json.discount - json.extra_discount);
        }
        if (json.cross_sell) {
            this.cross_sell = true
        }

    },

    export_for_printing() {
        const receipt_json = super.export_for_printing(...arguments);
        if (this.product_uom_id) {
            receipt_json.product_uom = this.pos.units.find(u => u.id == this.product_uom_id)
        }
        return receipt_json;
    },

    get_unit() {
        if (!this.product_uom_id) {
            return super.get_unit()
        } else {
            return this.pos.units.find(u => u.id == this.product_uom_id)
        }
    },

    get_discount() {
        let core_discount = super.get_discount()
        if (this.extra_discount) {
            core_discount += this.extra_discount
        }
        return core_discount
    },

    getDisplayData() {
        let line_display = super.getDisplayData()
        line_display['extra_discount'] = this.extra_discount
        line_display['cross_sell'] = this.cross_sell
        return line_display
    },

})