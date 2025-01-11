/** @odoo-module **/

import {_t} from "@web/core/l10n/translation";
import {ProductScreen} from "@point_of_sale/app/screens/product_screen/product_screen";
import {useService} from "@web/core/utils/hooks";
import {Component} from "@odoo/owl";
import {usePos} from "@point_of_sale/app/store/pos_hook";

export class ShowTicketScreenButton extends Component {
    static template = "pos_retail.ShowTicketScreenButton";

    setup() {
        super.setup();
        this.pos = usePos();
        this.popup = useService("popup");
        this.orm = useService("orm");
        this.notification = useService("pos_notification");
        this.report = useService("report");
    }


    async click() {
        const searchDetails = {
            fieldName: "RECEIPT_NUMBER",
            searchTerm: "",
        };
        this.pos.showScreen("TicketScreen", {
            ui: {filter: "SYNCED", searchDetails},
        });
    }
}

ProductScreen.addControlButton({
    component: ShowTicketScreenButton, condition: function () {
        const {config} = this.pos;
        return config.update_sale_order || config.sale_order;
    },
});
