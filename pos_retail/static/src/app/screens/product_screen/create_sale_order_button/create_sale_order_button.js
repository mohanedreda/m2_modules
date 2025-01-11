/** @odoo-module **/

import {_t} from "@web/core/l10n/translation";
import {ProductScreen} from "@point_of_sale/app/screens/product_screen/product_screen";
import {useService} from "@web/core/utils/hooks";
import {CreateSaleOrderPopup} from "@pos_retail/app/utils/create_sale_order_popup/create_sale_order_popup";
import { ErrorPopup } from "@point_of_sale/app/errors/popups/error_popup";
import {Component} from "@odoo/owl";
import {usePos} from "@point_of_sale/app/store/pos_hook";
import {deserializeDateTime} from "@web/core/l10n/dates";

export class CreateSaleOrderButton extends Component {
    static template = "pos_retail.CreateSaleOrderButton";

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
        const {confirmed, payload: values} = await this.popup.add(CreateSaleOrderPopup, {
            title: _t('Create Sale Order'),
            order: order,
            delivery_date: new Date().toISOString(),
            sale_order_auto_confirm: this.pos.config.sale_order_auto_confirm,
            sale_order_auto_invoice: this.pos.config.sale_order_auto_invoice,
            sale_order_auto_delivery: this.pos.config.sale_order_auto_delivery,
        });
        if (confirmed) {
            if (values.error) {
                return this.popup.add(ErrorPopup, {
                    title: _t('Warning'), body: values.error,
                })
            }
            const so_val = order.export_as_JSON();
            let value = {
                name: order.name,
                note: values.note,
                origin: this.pos.config.name,
                partner_id: order.get_partner().id,
                pricelist_id: values.pricelist_id,
                order_line: [],
                signature: values.signature,
                signed_by: this.pos.user.name,
                delivery_name: order.get_partner().name,
                delivery_address: values.delivery_address,
                delivery_phone: values.delivery_phone,
                delivery_date: deserializeDateTime(values.delivery_date.split('T')[0] + ' ' + values.delivery_date.split('T')[1]).toFormat("yyyy-MM-dd HH:mm"),
                payment_partial_amount: values.payment_partial_amount,
                payment_partial_method_id: values.payment_partial_method_id,
            }
            for (var i = 0; i < so_val.lines.length; i++) {
                var line = so_val.lines[i][2];
                var line_val = order._covert_pos_line_to_sale_line(line);
                value.order_line.push(line_val);
            }
            order.note = value['note'];
            order.delivery_name = value['delivery_name'];
            order.delivery_address = value['delivery_address'];
            order.delivery_phone = value['delivery_phone'];
            order.delivery_date = value['delivery_date'];
            let result = await this.orm.call("sale.order", "pos_create_sale_order", [value, values.sale_order_auto_confirm, values.sale_order_auto_invoice, values.sale_order_auto_delivery])
            this.pos.removeOrder(this.currentOrder);
            this.pos.selectNextOrder();
            return await this.report.doAction("sale.action_report_saleorder", [result.id]);
        }
    }
}

ProductScreen.addControlButton({
    component: CreateSaleOrderButton, condition: function () {
        const {config} = this.pos;
        return config.sale_order;
    },
});
