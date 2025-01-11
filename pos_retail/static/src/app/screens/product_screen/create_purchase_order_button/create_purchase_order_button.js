/** @odoo-module **/

import {_t} from "@web/core/l10n/translation";
import {ProductScreen} from "@point_of_sale/app/screens/product_screen/product_screen";
import {useService} from "@web/core/utils/hooks";
import {CreateSaleOrderPopup} from "@pos_retail/app/utils/create_sale_order_popup/create_sale_order_popup";
import { ErrorPopup } from "@point_of_sale/app/errors/popups/error_popup";
import {Component} from "@odoo/owl";
import {usePos} from "@point_of_sale/app/store/pos_hook";

export class CreatePurchaseOrderButton extends Component {
    static template = "pos_retail.CreatePurchaseOrderButton";

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
        var self = this;
        let order = this.currentOrder
        if (order.get_total_with_tax() <= 0 || order.orderlines.length == 0) {
            return this.popup.add(ErrorPopup, {
                title: _t('Error'), body: _t('Your shopping cart is empty !'),
            })
        }
        if (!order.get_partner()) {
            this.notification.add(_t("Required set customer for create sale order"), 3000);
            const {
                confirmed: confirmedTempScreen, payload: newPartner
            } = await this.pos.showTempScreen("PartnerListScreen");
            if (!confirmedTempScreen) {
                return;
            } else {
                order.set_partner(newPartner);
            }
        }
        let order_json = order.export_as_JSON()
        let results = await this.orm.call("purchase.order", "pos_create_purchase", [[order_json]])
        if (this.pos.config.purchase_order_confirm && results.length) {
            await this.orm.call("purchase.order", "button_confirm", [[results[0]]])
        }
        this.pos.removeOrder(this.currentOrder);
        this.pos.selectNextOrder();
        return await this.report.doAction("purchase.action_report_purchase_order", [results[0]]);
    }
}

ProductScreen.addControlButton({
    component: CreatePurchaseOrderButton, condition: function () {
        const {config} = this.pos;
        return config.purchase_order;
    },
});
