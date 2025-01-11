/** @odoo-module **/

import {_t} from "@web/core/l10n/translation";
import {ProductScreen} from "@point_of_sale/app/screens/product_screen/product_screen";
import {useService} from "@web/core/utils/hooks";
import {Component} from "@odoo/owl";
import {usePos} from "@point_of_sale/app/store/pos_hook";
import {NumberPopup} from "@point_of_sale/app/utils/input_popups/number_popup";
import {ConfirmPopup} from "@point_of_sale/app/utils/confirm_popup/confirm_popup";
import {ErrorPopup} from "@point_of_sale/app/errors/popups/error_popup";
import {SelectionPopup} from "@point_of_sale/app/utils/input_popups/selection_popup";

export class SaleCreditPointsButton extends Component {
    static template = "pos_retail.SaleCreditPointsButton";

    setup() {
        super.setup();
        this.pos = usePos();
        this.popup = useService("popup");
        this.orm = useService("orm");
        this.notification = useService("pos_notification");
        this.report = useService("report");
    }

    get currentOrder() {
        return this.pos.get_order();
    }


    async click() {
        const {confirmed, payload} = await this.popup.add(NumberPopup, {
            title: _t("How much credit need assign to customer"),
            nbrDecimal: this.pos.currency.decimal_places,
            isInputSelected: true,
            inputSuffix: this.pos.currency.symbol,
        });
        if (confirmed) {
            this.notification.add(_t("Required set Customer for Sale Credit to Customer"), 3000);

            const paymentMethods = this.pos.payment_methods.filter(
                (method) =>
                    this.pos.config.payment_method_ids.includes(method.id) && method.type != "pay_later" && !method.is_credit
            );
            const selectionList = paymentMethods.map((paymentMethod) => ({
                id: paymentMethod.id,
                label: paymentMethod.name,
                item: paymentMethod,
            }));
            const {confirmed, payload: credit_method} = await this.popup.add(SelectionPopup, {
                title: _t("Select the payment method to sale credit"),
                list: selectionList,
            });
            if (!confirmed) {
                return;
            } else {
                const {confirmed, payload: newPartner} = await this.pos.showTempScreen("PartnerListScreen",);
                if (confirmed) {
                    let newOrder;
                    const product_default_ids = this.pos.config.product_default_ids
                    this.pos.config.product_default_ids = []
                    const emptyOrder = this.pos.orders.find((order) => order.orderlines.length === 0 && order.paymentlines.length === 0);
                    if (emptyOrder) {
                        newOrder = emptyOrder;
                        this.pos.set_order(newOrder);
                    } else {
                        newOrder = this.pos.add_new_order();
                    }
                    let credit_product = this.pos.db.product_by_id[this.pos.config.credit_product_id[0]]
                    if (credit_product) {
                        newOrder.set_partner(newPartner);
                        newOrder.add_product(credit_product, {
                            "price": parseFloat(payload)
                        })
                        const payment = newOrder.add_paymentline(credit_method);
                        payment.set_amount(parseFloat(payload))
                        this.pos.showScreen("PaymentScreen");
                        this.popup.add(ConfirmPopup, {
                            title: _t("Please Validate Order, "),
                            body: _t("%s will add to Credit of Customer", this.env.utils.formatCurrency(parseFloat(payload)))
                        })
                        this.pos.config.product_default_ids = product_default_ids
                    } else {
                        return this.popup.add(ErrorPopup, {
                            title: _t("Error"),
                            body: _t("Credit product not found, please active available in pos back"),
                        });
                    }

                }
            }
        }
    }
}

ProductScreen.addControlButton({
    component: SaleCreditPointsButton, condition: function () {
        const {config} = this.pos;
        return config.credit_feature;
    },
});
