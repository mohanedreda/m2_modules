/** @odoo-module **/

import {PaymentScreen} from "@point_of_sale/app/screens/payment_screen/payment_screen";
import {patch} from "@web/core/utils/patch";
import {onMounted, onWillUnmount} from "@odoo/owl";
import {ErrorPopup} from "@point_of_sale/app/errors/popups/error_popup";
import {_t} from "@web/core/l10n/translation";
import {NumberPopup} from "@point_of_sale/app/utils/input_popups/number_popup";

patch(PaymentScreen.prototype, {

    setup() {
        super.setup(...arguments);
        onMounted(this._activeCreditMethod);
        onWillUnmount(this._activeCreditMethod);
        this._activeCreditMethod()
    },

    shouldDownloadInvoice() {
        const res = super.shouldDownloadInvoice()
        if (this.pos.config.order_auto_invoice_without_download) {
            return false
        }
        return res
    },

    _activeCreditMethod() {
        const selectedOrder = this.currentOrder
        if (!this.pos.config.credit_feature) {
            this.payment_methods_from_config = this.pos.payment_methods.filter((method) => this.pos.config.payment_method_ids.includes(method.id) && !method["is_credit"]);
        } else {
            if (!selectedOrder || (selectedOrder && !selectedOrder.get_partner()) || (selectedOrder && selectedOrder.get_partner() && selectedOrder.get_partner()["balance"] <= 0)) {
                this.payment_methods_from_config = this.pos.payment_methods.filter((method) => this.pos.config.payment_method_ids.includes(method.id) && !method["is_credit"]);
                this.payment_methods_from_config = this.payment_methods_from_config
            }
        }
    },

    // todo: default of odoo setup payment_methods_from_config fron setup method, we custom make it dynamic, some method invisible like credit if customer have not credit
    get listOfPaymentMethod() {
        const selectedOrder = this.currentOrder
        if (!this.pos.config.credit_feature) {
            this.payment_methods_from_config = this.pos.payment_methods.filter((method) => this.pos.config.payment_method_ids.includes(method.id) && !method["is_credit"]);
        } else {
            if (!selectedOrder || (selectedOrder && !selectedOrder.get_partner()) || (selectedOrder && selectedOrder.get_partner() && selectedOrder.get_partner()["balance"] <= 0)) {
                this.payment_methods_from_config = this.pos.payment_methods.filter((method) => this.pos.config.payment_method_ids.includes(method.id) && !method["is_credit"]);
            }
            if (selectedOrder && selectedOrder.get_partner() && selectedOrder.get_partner()["balance"] > 0) {
                this.payment_methods_from_config = this.pos.payment_methods.filter((method) => this.pos.config.payment_method_ids.includes(method.id));

            }
        }
        return this.payment_methods_from_config
    },

    get getCreditPoints() {
        const selectedOrder = this.currentOrder
        if (!this.pos.config.credit_feature) {
            return ""
        } else {
            if (!selectedOrder || (selectedOrder && !selectedOrder.get_partner()) || (selectedOrder && selectedOrder.get_partner() && selectedOrder.get_partner()["balance"] <= 0)) {
                return ""
            }
            if (selectedOrder && selectedOrder.get_partner() && selectedOrder.get_partner()["balance"] > 0) {
                return _t(" (credit: ") + this.env.utils.formatCurrency(selectedOrder.get_partner()["balance"], false) + _t(" )")

            }
        }
        return ""
    },

    get activeCovertChangeToCredit() {
        if (!this.pos.config.credit_feature) {
            return false
        } else {
            if (!this.currentOrder.get_partner()) {
                return false
            } else {
                if (this.currentOrder.get_change() <= 0) {
                    return false
                } else {
                    return true
                }
            }
        }
        return false
    },

    async covertChangeToCredit() {
        const credit_method = this.pos.payment_methods.find(m => m.is_credit)
        const change = this.currentOrder.get_change()
        if (credit_method && change > 0) {
            const payment = this.currentOrder.add_paymentline(credit_method);
            payment.set_amount(-change)
            payment.covert_change_to_credit = true
        }
        return true
    },


    async validateOrder(isForceValidate) {
        const credit_payments = this.currentOrder.paymentlines.filter(p => p.payment_method && p.payment_method["is_credit"] && p.covert_change_to_credit == false)
        if (!credit_payments || credit_payments.length == 0) {
            return await super.validateOrder(isForceValidate)
        } else {
            const partner = this.currentOrder.get_partner()
            if (!partner) {
                return this.popup.add(ErrorPopup, {
                    title: _t("Error"),
                    body: _t("You set credit method but missed customer, please add customer back."),
                });
            } else {
                if (partner["balance"] <= 0) {
                    return this.popup.add(ErrorPopup, {
                        title: _t("Error"),
                        body: _t("Customer have not credit points, please remove all payment line is credit"),
                    });
                } else {
                    let credit_amount_used = 0
                    credit_payments.forEach(p => credit_amount_used += p.amount)
                    if (this.pos.credit_program && (partner["balance"] / this.pos.credit_program.rate) < credit_amount_used) {
                        return this.popup.add(ErrorPopup, {
                            title: _t("Error, Customer's credit point is not enough"),
                            body: partner["name"] + _t(" not enough credit points, balance credit points can use is: ") + this.env.utils.formatCurrency(partner["balance"], false),
                        });
                    }
                }

            }
        }
        return await super.validateOrder(isForceValidate)
    },

    addNewPaymentLine(paymentMethod) {
        const res = super.addNewPaymentLine(paymentMethod)
        if (res) {
            this.selectedPaymentLine.currency_id = this.pos.currency.id
        }
        return res
    }
});
