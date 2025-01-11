/** @odoo-module */

import { Payment } from "@point_of_sale/app/store/models";
import { patch } from "@web/core/utils/patch";

patch(Payment.prototype, {
    setup(options) {
        super.setup(...arguments);
        this.covert_change_to_credit = false
        this.used_credit_payment = false
        this.currency_id = false
        this.currency_amount = 0
        this.payment_reference = ''
        if (!this.currency_id) {
            this.currency_id = this.pos.currency.id
            this.currency = this.pos.currency
        }
    },
    export_as_JSON() {
        const json = super.export_as_JSON(...arguments);
        json.covert_change_to_credit = this.covert_change_to_credit
        json.used_credit_payment = this.used_credit_payment
        json.currency_id = this.currency_id
        json.currency_amount = this.currency_amount
        json.payment_reference = this.payment_reference
        return json;
    },
    init_from_JSON(json) {
        super.init_from_JSON(...arguments);
        this.covert_change_to_credit = json.covert_change_to_credit
        this.used_credit_payment = json.used_credit_payment
        this.currency_id = json.currency_id
        this.currency_amount = json.currency_amount
        this.payment_reference = json.payment_reference
        if (this.currency_id && this.currency_id != this.pos.currency.id && this.pos.currency_by_id) {
            this.currency_name = this.pos.currency_by_id[this.currency_id]['name']
        }
    },
    export_for_printing() {
        const json = super.export_for_printing(...arguments);
        json.currency_id = this.currency_id
        json.currency_amount = this.currency_amount
        json.payment_reference = this.payment_reference
        if (json.currency_id && this.pos.currency_by_id) {
            json.currency_name = this.pos.currency_by_id[json.currency_id]
        }
        return json;
    },
})