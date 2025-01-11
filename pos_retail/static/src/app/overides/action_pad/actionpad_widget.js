/** @odoo-module */
import {patch} from "@web/core/utils/patch";
import {ActionpadWidget} from "@point_of_sale/app/screens/product_screen/action_pad/action_pad";
import {ProductScreen} from "@point_of_sale/app/screens/product_screen/product_screen";
import {useService} from "@web/core/utils/hooks";
import {Component} from "@odoo/owl";
import {usePos} from "@point_of_sale/app/store/pos_hook";
import {OrderReceipt} from "@point_of_sale/app/screens/receipt_screen/receipt/order_receipt";
import {renderToElement} from "@web/core/utils/render";
/**
 * @props partner
 */

patch(ActionpadWidget.prototype, {
    setup() {
        super.setup()
        this.pos = usePos();
        this.popup = useService("popup");
        this.orm = useService("orm");
        this.notification = useService("pos_notification");
        this.report = useService("report");
        this.printer = useService("printer");
    },

    async submitOrder() {
        const printer_web_browse = this.pos.unwatched.printers.find(p => p.config && p.config.printer_type == 'web_browse')
        if (!this.currentOrder || this.currentOrder.orderlines.length == 0) {
            return
        }
        if (!printer_web_browse) {
            return await super.submitOrder()
        }
        const orderChange = this.currentOrder.changesToOrder();
        let isPrintSuccessful = true;
        const d = new Date();
        let hours = "" + d.getHours();
        hours = hours.length < 2 ? "0" + hours : hours;
        let minutes = "" + d.getMinutes();
        minutes = minutes.length < 2 ? "0" + minutes : minutes;
        const changes = this.currentOrder._getPrintingCategoriesChanges(printer_web_browse.config.product_categories_ids, orderChange);
        if (changes["new"].length > 0 || changes["cancelled"].length > 0) {
            const printingChanges = {
                new: changes["new"],
                cancelled: changes["cancelled"],
                table_name: this.pos.config.module_pos_restaurant ? this.currentOrder.getTable().name : false,
                floor_name: this.pos.config.module_pos_restaurant ? this.currentOrder.getTable().floor.name : false,
                name: this.currentOrder.name || "unknown order",
                time: {
                    hours, minutes,
                },
            };
            const receipt = renderToElement("point_of_sale.OrderChangeReceipt", {
                changes: printingChanges,
            });
            await this.printer.printHtml(receipt, {webPrintFallback: true});
            this.currentOrder.updateLastOrderChange()
        }
    }
});
