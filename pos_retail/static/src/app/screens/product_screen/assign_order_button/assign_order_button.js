/** @odoo-module **/

import {_t} from "@web/core/l10n/translation";
import {ProductScreen} from "@point_of_sale/app/screens/product_screen/product_screen";
import {useService} from "@web/core/utils/hooks";
import {SelectionPopup} from "@point_of_sale/app/utils/input_popups/selection_popup";
import {Component} from "@odoo/owl";
import {usePos} from "@point_of_sale/app/store/pos_hook";
import {ErrorPopup} from "@point_of_sale/app/errors/popups/error_popup";

export class AssignOrderButton extends Component {
    static template = "pos_retail.AssignOrderButton";

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
        const args = {
            domain: [["state", "=", "opened"], ["id", "!=", this.pos.pos_session.id]],
            fields: ["id", "config_id"],
            context: {
                limit: 1
            }
        }
        let sessionsOpened = await this.orm.call("pos.session", "search_read", [], args);
        let selectionList = []
        sessionsOpened.forEach(s => {
            selectionList.push({
                id: s.id, label: s.config_id[1], isSelected: false, item: s
            })
        })
        if (selectionList.length) {
            const {confirmed, payload: selected_session} = await this.popup.add(SelectionPopup, {
                title: _t("Assign Order to Point Of Sale"), list: selectionList,
            });
            if (confirmed) {
                const order_id = this.pos.db.add_order(this.currentOrder.export_as_JSON());
                let order = this.pos.db.get_order(order_id)
                const order_ids = await this.pos._save_to_server([order], {draft: true});
                if (order_ids) {
                    await this.orm.call("pos.order", "write", [[order_ids[0]["id"]], {"session_id": selected_session.id}]);
                    this.pos.removeOrder(this.currentOrder);
                    this.pos.selectNextOrder();
                }
            }
        } else {
            return this.popup.add(ErrorPopup, {
                title: _t('Error'), body: _t('Have not any pos session opened for assign the order'),
            })
        }
    }
}

ProductScreen.addControlButton({
    component: AssignOrderButton, condition: function () {
        const {config} = this.pos;
        return config.assign_orders_between_session;
    },
});
