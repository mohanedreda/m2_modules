/** @odoo-module */

import {AbstractAwaitablePopup} from "@point_of_sale/app/popup/abstract_awaitable_popup";
import {_t} from "@web/core/l10n/translation";
import {onMounted, useRef, useState} from "@odoo/owl";
import {usePos} from "@point_of_sale/app/store/pos_hook";
import {ErrorPopup} from "@point_of_sale/app/errors/popups/error_popup";
import {useAutofocus, useService} from "@web/core/utils/hooks";

export class CreateSaleOrderPopup extends AbstractAwaitablePopup {
    static template = "pos_retail.CreateSaleOrderPopup"
    static defaultProps = {
        confirmText: _t("Save on backend"),
        cancelText: _t("Close"),
        title: _t("Create Sale Order"),
        body: "",
        cancelKey: false,
    };

    setup() {
        super.setup();
        this.notification = useService("pos_notification");
        this.pos = usePos();
        this.popup = useService("popup");
        this.orm = useService("orm");
        this.hardwareProxy = useService("hardware_proxy");
        this.currentOrder = this.pos.get_order();
        this.client = this.currentOrder.get_partner();
        this.changes = {
            delivery_phone: this.client.mobile || this.client.phone,
            delivery_address: this.currentOrder.delivery_address || this.client.address,
            delivery_date: this.currentOrder.delivery_date || "",
            note: this.currentOrder.note,
            signature: null,
            payment_partial_amount: this.currentOrder.payment_partial_amount || 0,
            payment_partial_method_id: this.currentOrder.payment_partial_method_id || null,
            pricelist_id: this.currentOrder.pricelist.id,
            sale_order_auto_confirm: this.pos.config.sale_order_auto_confirm,
            sale_order_auto_invoice: this.pos.config.sale_order_auto_invoice,
            sale_order_auto_delivery: this.pos.config.sale_order_auto_delivery,
        }
        if (this.currentOrder.delivery_phone) {
            this.changes['delivery_phone'] = this.currentOrder.delivery_phone
        }
        if (this.currentOrder.delivery_address) {
            this.changes['delivery_address'] = this.currentOrder.delivery_address
        }
        this.orderUiState = this.currentOrder.uiState.ReceiptScreen;
        this.signature_div = useRef("signature-div");
        onMounted(this.mounted);
        this.numberBuffer = useService("number_buffer");
        this.numberBuffer.use({
            triggerAtEnter: () => this.confirm(),
            triggerAtEscape: () => this.cancel(),
            state: this.changes,
        });
    }


    mounted() {
        var self = this;
        $(this.signature_div.el).jSignature();
        this.signed = false;
        $(this.signature_div.el).bind('change', function (e) {
            self.signed = true;
            self.verifyChanges(e);
        });
    }

    OnChange(event) {
        let target_name = event.target.name;
        if (event.target.type == 'checkbox') {
            this.changes[event.target.name] = event.target.checked;
        } else {
            this.changes[event.target.name] = event.target.value;
        }
        if (target_name == 'payment_partial_amount') {
            this.changes[event.target.name] = parseFloat(event.target.value);
        }
        if (target_name == 'pricelist_id' || target_name == 'payment_partial_method_id') {
            this.changes[event.target.name] = parseInt(event.target.value);
        }
        console.log(target_name + ' change to ' + this.changes[event.target.name])
        console.log(this.changes.payment_partial_amount)
        this.verifyChanges(event)
    }

    verifyChanges(event) {
        let changes = this.changes;
        // todo: may no need required it
        // if (changes.delivery_phone == '') {
        //     this.orderUiState.isSuccessful = false;
        //     this.orderUiState.hasNotice = _t('Phone is required')
        //     return;
        // } else {
        //     this.orderUiState.isSuccessful = true;
        // }
        // if (changes.delivery_address == '') {
        //     this.orderUiState.isSuccessful = false;
        //     this.orderUiState.hasNotice = _t('Missing Delivery Address')
        //     return;
        // } else {
        //     this.orderUiState.isSuccessful = true;
        // }
        // if (changes.delivery_date == '') {
        //     this.orderUiState.isSuccessful = false;
        //     this.orderUiState.hasNotice = _t('Delivery Date is required');
        //     return;
        // } else {
        //     this.orderUiState.isSuccessful = true;
        // }
        if (!this.env.utils.isValidFloat(changes.payment_partial_amount)) {
            this.orderUiState.isSuccessful = false;
            this.orderUiState.hasNotice = _t('Partial amount required number');
            return
        }
        if (changes.payment_partial_amount < 0) {
            this.orderUiState.isSuccessful = false;
            this.orderUiState.hasNotice = _t('Partial amount required bigger than or equal 0');
            return;
        } else {
            this.orderUiState.isSuccessful = true;
        }
        const sign_datas = $(this.signature_div.el).jSignature("getData", "image");
        if (this.pos.config.sale_order_required_signature) {
            if (sign_datas && sign_datas[1] && this.signed) {
                changes['signature'] = sign_datas[1];
                this.orderUiState.isSuccessful = true;
                this.orderUiState.hasNotice = _t('Signature succeed')
            } else {
                this.orderUiState.isSuccessful = false;
                this.orderUiState.hasNotice = _t('Please signature');
            }
        } else {
            this.orderUiState.isSuccessful = true;
            this.orderUiState.hasNotice = _t('Not required signature')
        }
    }

    async action_confirm() {
        if (!this.orderUiState.isSuccessful) {
            if (this.orderUiState.hasNotice) {
                this.orderUiState.hasNotice = _t("Please check: ") + this.orderUiState.hasNotice
            } else {
                this.orderUiState.hasNotice = _t("Please full fill information of order")
            }
            return true
        } else {
            return await this.confirm()
        }
    }

    getPayload() {
        this.verifyChanges();
        if (this.orderUiState.isSuccessful) {
            return this.changes
        } else {
            return {
                values: {}, error: this.orderUiState.hasNotice
            };
        }
    }
}
