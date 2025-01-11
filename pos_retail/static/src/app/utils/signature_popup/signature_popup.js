/** @odoo-module */

import {AbstractAwaitablePopup} from "@point_of_sale/app/popup/abstract_awaitable_popup";
import {_t} from "@web/core/l10n/translation";
import {onMounted, useRef} from "@odoo/owl";
import {usePos} from "@point_of_sale/app/store/pos_hook";
import {useService} from "@web/core/utils/hooks";

export class SignaturePopup extends AbstractAwaitablePopup {
    static template = "pos_retail.SignaturePopup"
    static defaultProps = {
        confirmText: _t("Signature"),
        cancelText: _t("Close"),
        title: _t("Signature to Order"),
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
            signature: null,
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
            self.OnChange(e);
        });
    }

    OnChange(event) {
        let target_name = event.target.name;
        const sign_datas = $(this.signature_div.el).jSignature("getData", "image");
        this.changes.signature = sign_datas
        this.orderUiState.isSuccessful = true
    }

    async action_confirm() {
        if (!this.orderUiState.isSuccessful) {
            if (this.orderUiState.hasNotice) {
                this.orderUiState.hasNotice = _t("Please check: %s", this.orderUiState.hasNotice)
            } else {
                this.orderUiState.hasNotice = _t("Please full fill information of order")
            }
            return true
        } else {
            return await this.confirm()
        }
    }

    getPayload() {
        if (this.orderUiState.isSuccessful) {
            return this.changes
        } else {
            return {
                values: {}, error: this.orderUiState.hasNotice
            };
        }
    }
}
