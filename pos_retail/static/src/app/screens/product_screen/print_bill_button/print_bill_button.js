/** @odoo-module **/
import {ProductScreen} from "@point_of_sale/app/screens/product_screen/product_screen";
import {useService} from "@web/core/utils/hooks";
import {Component} from "@odoo/owl";
import {usePos} from "@point_of_sale/app/store/pos_hook";
import { OrderReceipt } from "@point_of_sale/app/screens/receipt_screen/receipt/order_receipt";

export class PrintBillButton extends Component {
    static template = "pos_retail.PrintBillButton";

    setup() {
        super.setup();
        this.pos = usePos();
        this.popup = useService("popup");
        this.orm = useService("orm");
        this.notification = useService("pos_notification");
        this.report = useService("report");
        this.printer = useService("printer");
    }

    get currentOrder() {
        return this.pos.get_order();
    }


    async click() {
        if (this.currentOrder.orderlines.length == 0) {
            return
        }
        this.pos.get_order()['draft_bill'] = true
        await this.printer.print(
            OrderReceipt,
            {
                data: this.pos.get_order().export_for_printing(),
                formatCurrency: this.env.utils.formatCurrency,
            },
            {webPrintFallback: true}
        );
        this.pos.get_order()['draft_bill'] = null
    }
}

ProductScreen.addControlButton({
    component: PrintBillButton, condition: function () {
        const {config} = this.pos;
        return config.print_bill_without_payment;
    },
});
