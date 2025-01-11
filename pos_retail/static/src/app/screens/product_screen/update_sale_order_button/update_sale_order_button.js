/** @odoo-module **/

import {_t} from "@web/core/l10n/translation";
import {ProductScreen} from "@point_of_sale/app/screens/product_screen/product_screen";
import {useService} from "@web/core/utils/hooks";
import {CreateSaleOrderPopup} from "@pos_retail/app/utils/create_sale_order_popup/create_sale_order_popup";
import { ErrorPopup } from "@point_of_sale/app/errors/popups/error_popup";
import {Component} from "@odoo/owl";
import {usePos} from "@point_of_sale/app/store/pos_hook";
import {ConfirmPopup} from "@point_of_sale/app/utils/confirm_popup/confirm_popup";
import {deserializeDateTime} from "@web/core/l10n/dates";

export class UpdateSaleOrderButton extends Component {
    static template = "pos_retail.UpdateSaleOrderButton";

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

    async _getSaleOrder(id) {
        const [sale_order] = await this.orm.read("sale.order", [id], ["state", "partner_id", // "pricelist_id",
            // "fiscal_position_id",
            // "amount_total",
            // "amount_untaxed",
            // "amount_unpaid",
            // "picking_ids",
            // "partner_shipping_id",
            // "partner_invoice_id",
        ]);
        //
        // const sale_lines = await this._getSOLines(sale_order.order_line);
        // sale_order.order_line = sale_lines;
        //
        // if (sale_order.picking_ids[0]) {
        //     const [picking] = await this.orm.read("stock.picking", [sale_order.picking_ids[0]], ["scheduled_date"]);
        //     sale_order.shipping_date = picking.scheduled_date;
        // }
        //
        return sale_order;
    }

    async _getSOLines(ids) {
        const so_lines = await this.orm.call("sale.order.line", "read_converted", [ids]);
        return so_lines;
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
        if (!order.sale_id) {
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
                const order_json = order.export_as_JSON();
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
                    delivery_date: deserializeDateTime(values.delivery_date).toFormat("yyyy-MM-dd HH:mm a"),
                    payment_partial_amount: values.payment_partial_amount,
                    payment_partial_method_id: values.payment_partial_method_id,
                }
                for (var i = 0; i < order_json.lines.length; i++) {
                    var line = order_json.lines[i][2];
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
        } else {
            const sale_selected = await this._getSaleOrder(order.sale_id)
            if (['draft', 'sent'].indexOf(sale_selected.state) == -1) {
                return this.popup.add(ErrorPopup, {
                    title: _t("Warning"), body: _t("Sale Order state is not Quotation or Quotation sent"),
                })
            } else {
                let value = {
                    partner_id: order.get_partner().id, note: order.note, order_line: []
                }
                const order_json = order.export_as_JSON();
                for (var i = 0; i < order_json.lines.length; i++) {
                    var line = order_json.lines[i][2];
                    var line_val = order._covert_pos_line_to_sale_line(line);
                    value.order_line.push(line_val);
                }
                const response = await this.orm.call("sale.order", "write", [[sale_selected.id], value]);
                if (response) {
                    const {confirmed} = await this.popup.add(ConfirmPopup, {
                        title: _t("Sale order saved"),
                        body: _t("Sale order save done, are you want create new order ?"),
                    });
                    if (confirmed) {
                        this.pos.removeOrder(this.currentOrder);
                        this.pos.selectNextOrder();
                        return await this.report.doAction("sale.action_report_saleorder", [sale_selected.id]);
                    }
                } else {
                    return this.popup.add(ErrorPopup, {
                        title: _t("Warning"), body: _t("Have error when saving sale order to backend"),
                    })
                }
            }
        }
    }
}

ProductScreen.addControlButton({
    component: UpdateSaleOrderButton, condition: function () {
        const {config} = this.pos;
        return config.update_sale_order;
    },
});
