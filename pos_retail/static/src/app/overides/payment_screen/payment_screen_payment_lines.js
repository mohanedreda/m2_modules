/** @odoo-module **/

import {PaymentScreenPaymentLines} from "@point_of_sale/app/screens/payment_screen/payment_lines/payment_lines";
import {patch} from "@web/core/utils/patch";
import {useService} from "@web/core/utils/hooks";
import {_t} from "@web/core/l10n/translation";
import {useState} from "@odoo/owl";

patch(PaymentScreenPaymentLines.prototype, {

    setup() {
        super.setup(...arguments);
        this.notification = useService("pos_notification");
        if (this.selectedPaymentLine) {
            this.selectedPaymentLine.currency_id = this.pos.currency.id
        }
        this.changes = useState({
            'currency_id': this.pos.currency.id,
            'currency_amount': 0,
            'payment_reference': '',
            'currency_rate': ''
        })
    },

    get currentOrder() {
        return this.pos.get_order();
    },

    get selectedPaymentLine() {
        return this.currentOrder.selected_paymentline;
    },

    _changePaymentReference(ev) {
        const payment_reference = ev.target.value
        this.changes.payment_reference = payment_reference
        if (this.selectedPaymentLine) {
            this.selectedPaymentLine.payment_reference = this.changes.payment_reference
        }
    },
    // get amountCurrency(line) {
    //     if (line.currency_id != this.pos.currency.id) {
    //         return this.env.utils.formatCurrency(this.selectedPaymentLine.currency_amount)
    //     }
    //     return null
    // },

    _changeCurrency() {
        const currency = this.pos.currency_by_id[parseInt(this.changes.currency_id)]
        let difference_rate = (this.pos.currency.rate * currency.rate).toFixed(4)
        this.changes.currency_rate = _t('%s will covert to %s %s', this.env.utils.formatCurrency(1), difference_rate, currency.name)
    },

    // todo: continue code here
    _applyDifferenceCurrency() {
        if (this.selectedPaymentLine && this.changes.currency_amount > 0 && this.changes.currency_id) {
            const currency = this.pos.currency_by_id[parseInt(this.changes.currency_id)]
            let difference_rate = this.pos.currency.rate / currency.rate
            let coverted_amount = parseFloat(this.changes.currency_amount) * difference_rate;
            this.selectedPaymentLine.currency_id = parseInt(this.changes.currency_id)
            this.selectedPaymentLine.currency_amount = parseFloat(this.changes.currency_amount)
            this.selectedPaymentLine.currency = currency
            this.selectedPaymentLine.set_amount(coverted_amount)
            this.notification.add(_t('Applied Currency with amount "%s".', this.changes.currency_amount), 3000);
        }
    },

    _changeCurrencyAmount(event, line) {
    }

});
