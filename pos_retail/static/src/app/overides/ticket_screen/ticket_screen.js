/** @odoo-module **/

import {TicketScreen} from "@point_of_sale/app/screens/ticket_screen/ticket_screen";
import {patch} from "@web/core/utils/patch";
import {TextAreaPopup} from "@point_of_sale/app/utils/input_popups/textarea_popup";
import {ErrorPopup} from "@point_of_sale/app/errors/popups/error_popup";
import {_t} from "@web/core/l10n/translation";

patch(TicketScreen.prototype, {
    async onDeleteOrder(order) {
        if (this.pos.config.required_fill_reason_remove_order) {
            if (!order.backendId) {
                const order_id = this.pos.db.add_order(order.export_as_JSON());
                let order_store = this.pos.db.get_order(order_id)
                const order_ids = await this.pos._save_to_server([order_store], {draft: true});
                if (order_ids && order_ids.length) {
                    order['backendId'] = order_ids[0]["id"]
                }
            }
            if (order.backendId) {
                const {confirmed, payload: inputNote} = await this.popup.add(TextAreaPopup, {
                    startingValue: "", title: _t("Full the reason remove the order"),
                });
                if (confirmed) {
                    this.pos.set_synch("connecting", 1);
                    try {
                        const removeOrdersResponseData = await this.orm.silent.call("pos.order", "remove_from_ui", [[order.backendId]]);
                        await this.orm.silent.call("pos.order", "write", [[order.backendId], {'remove_reason': inputNote}]);
                        this.pos.set_synch("connected");
                        this.pos._postRemoveFromServer([order.backendId], removeOrdersResponseData);
                    } catch (reason) {
                        const error = reason.message;
                        if (error.code === 200) {
                            // Business Logic Error, not a connection problem
                            //if warning do not need to display traceback!!
                            if (error.data.exception_type == "warning") {
                                delete error.data.debug;
                            }
                        }
                        console.warn("Failed to remove orders:", [order.backendId]);
                        this.pos._postRemoveFromServer([order.backendId]);
                        throw error;
                    }
                    if (order && (await this._onBeforeDeleteOrder(order))) {
                        if (Object.keys(order.lastOrderPrepaChange).length > 0) {
                            await this.pos.sendOrderInPreparation(order, true);
                        }
                        if (order === this.pos.get_order()) {
                            this._selectNextOrder(order);
                        }
                        this.pos.removeOrder(order);
                        if (this._state.ui.selectedOrder === order) {
                            if (this.pos.get_order_list().length > 0) {
                                this._state.ui.selectedOrder = this.pos.get_order_list()[0];
                            } else {
                                this._state.ui.selectedOrder = null;
                            }
                        }
                    }
                    return true
                } else {
                    this.popup.add(ErrorPopup, {
                        title: _t("Error"),
                        body: _t("Required reason of remove order"),
                    });
                }

            }
        } else {
            return await super.onDeleteOrder(order)
        }
    }

});
