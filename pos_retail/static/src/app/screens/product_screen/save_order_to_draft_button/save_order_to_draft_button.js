/** @odoo-module **/

import {_t} from "@web/core/l10n/translation";
import {ProductScreen} from "@point_of_sale/app/screens/product_screen/product_screen";
import {useService} from "@web/core/utils/hooks";
import {Component} from "@odoo/owl";
import {usePos} from "@point_of_sale/app/store/pos_hook";
import {SelectionPopup} from "@point_of_sale/app/utils/input_popups/selection_popup";
import {ErrorPopup} from "@point_of_sale/app/errors/popups/error_popup";
import {ConfirmPopup} from "@point_of_sale/app/utils/confirm_popup/confirm_popup";
import {Order} from "@point_of_sale/app/store/models";

export class SaveOrderToDraftButton extends Component {
    static template = "pos_retail.SaveOrderToDraftButton";

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
        if (!this.currentOrder) {
            return
        }
        const {confirmed, payload: selected_option} = await this.popup.add(SelectionPopup, {
            title: _t("Select Feature"), list: [{
                id: 1, label: _t("Pre-Order and Save current order to draft"), item: 1
            }, {
                id: 2, label: _t("Import Pre-Order (draft/quotation) orders to current session"), item: 2
            }],
        });
        if (confirmed) {
            if (selected_option == 1) {
                if (this.currentOrder && !this.currentOrder.get_partner()) {
                    const {confirmed, payload: newPartner} = await this.pos.showTempScreen("PartnerListScreen",);
                    if (confirmed) {
                        this.currentOrder.set_partner(newPartner)
                    } else {
                        return
                    }
                }
                const order_id = this.pos.db.add_order(this.currentOrder.export_as_JSON());
                let order = this.pos.db.get_order(order_id)
                if (order["data"]["lines"].length > 0) {
                    this.env.services.ui.block();
                    const order_ids = await this.pos._save_to_server([order], {draft: true});
                    this.env.services.ui.unblock();
                    if (order_ids) {
                        this.pos.removeOrder(this.currentOrder);
                        this.popup.add(ConfirmPopup, {
                            title: _t("Successfully !"),
                            body: _t("Order saved to backend now, if you want, you can restore back via function [ Import draft/quotation order ]")
                        })
                        this.pos.showScreen("ReceiptScreen");
                    }
                } else {
                    return this.popup.add(ErrorPopup, {
                        title: _t("Error, Your cart is empty"), body: _t("Required have items in your cart")
                    })
                }
            }
            if (selected_option == 2) {
                const args = {
                    domain: [["state", "=", "draft"], ["config_id", "=", this.pos.config.id]], context: {
                        limit: 1
                    }
                }
                const order_ids = await this.orm.call("pos.order", "search", [], args)
                const fetchedOrders = await this.orm.call("pos.order", "export_for_ui", [order_ids]);
                let orders = this.pos.orders;
                fetchedOrders.forEach((order) => {
                    let order_imported = orders.find(o => o.uid == order.uid)
                    if (!order_imported) {
                        let o = new Order({env: this.env}, {pos: this.pos, json: order});
                        o.backendId = order.id
                        this.pos.orders.add(o);
                    }
                });
                this.pos.showScreen("TicketScreen", {});
            }
        }
    }
}

ProductScreen.addControlButton({
    component: SaveOrderToDraftButton, condition: function () {
        const {config} = this.pos;
        return config.save_quotation;
    },
});
