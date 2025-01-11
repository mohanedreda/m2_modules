/** @odoo-module **/

import {ProductScreen} from "@point_of_sale/app/screens/product_screen/product_screen";
import {patch} from "@web/core/utils/patch";
import {parseFloat as oParseFloat} from "@web/views/fields/parsers";
import {ErrorPopup} from "@point_of_sale/app/errors/popups/error_popup";
import {_t} from "@web/core/l10n/translation";
import {ClearCartButton} from "@pos_retail/app/screens/product_screen/clear_cart_button/clear_cart_button"
import {SetCustomerButton} from "@pos_retail/app/screens/product_screen/set_customer_button/set_customer_button"
import {NewOrderButton} from "@pos_retail/app/screens/product_screen/new_order_button/new_order_button"

const product_components = ProductScreen.components
ProductScreen.components = {
    ...product_components,
    ClearCartButton,
    SetCustomerButton,
    NewOrderButton,
};

patch(ProductScreen.prototype, {

    // TODO: example function define new key for useBarcodeReader
    // setup() {
    //     super.setup(...arguments);
    //     this.notification = useService("pos_notification");
    //     useBarcodeReader({
    //         coupon: this._onCouponScan,
    //     });
    // },
    // _onCouponScan(code) {
    //     // IMPROVEMENT: Ability to understand if the scanned code is to be paid or to be redeemed.
    //     this.currentOrder.activateCode(code.code);
    // },

    // TODO 1 : if product not found, we checking product barcode (multi barcode)
    // TODO 2 : if product not found, we checking product lot/serial
    async _getProductByBarcode(code) {
        let product = await super._getProductByBarcode(code)
        if (!product) {
            product = this.pos.product_by_barcode[code.code]
        }
        if (!product && this.pos.stock_lots) {
            const lot = this.pos.stock_lots.find(l => l.name == code.code || l.ref == code.code)
            if (lot) {
                const product_id = lot.product_id[0]
                product = this.pos.db.get_product_by_id(product_id);
                product["modifiedPackLotLines"] = {}
                product["newPackLotLines"] = [{lot_name: lot.name}]
            }
        }
        return product
    },

    async updateSelectedOrderline({buffer, key}) {
        const val = buffer === null ? "remove" : buffer;
        const parsed_discount = typeof val === "number" ? val : isNaN(parseFloat(val)) ? 0 : oParseFloat("" + val);
        if (this.pos.numpadMode == "discount" && this.pos.config.limited_discount && val != "remove" && parsed_discount > this.pos.config.limited_discount_amount) {
            return this.env.services.popup.add(ErrorPopup, {
                title: _t("Set Discount error !"),
                body: _t(
                    "Maximum discount you can set is %s.",
                    this.env.utils.formatProductQty(this.pos.config.limited_discount_amount)
                ),
            });
        }
        return super.updateSelectedOrderline({buffer, key})
    },

    getNumpadButtons() {
        const buttons = super.getNumpadButtons()
        const discount_button = buttons.find(b => b.value == "discount")
        discount_button["disabled"] = !this.pos.config.manual_discount || this.pos.config.disable_set_discount
        const price_button = buttons.find(b => b.value == "price")
        price_button["disabled"] = !this.pos.cashierHasPriceControlRights() || this.pos.config.disable_set_price
        const backspace_button = buttons.find(b => b.value == "Backspace")
        backspace_button["disabled"] = this.pos.config.disable_remove_line
        const plus_minus_button = buttons.find(b => b.value == "-")
        plus_minus_button["disabled"] = this.pos.config.disable_plus_minus
        return buttons
    },

    showHideNumpad() {
        $(".pads").slideToggle(() => {
            // $(".numpad-toggle").toggleClass("fa-caret-down fa-caret-up");
            if ($(this).is(":visible"))
                $(".order-scroller").animate(
                    {scrollTop: $(".order-scroller").height()},
                    500,
                );
        });
        this.pos.config.display_pads = !this.pos.config.display_pads
    },

    get getStyleLeftPane() {
        if (this.ui.Small) {
            return ""
        } else {
            return 'width:' + this.pos.config.order_cart_width + 'px;max-width:'  + this.pos.config.order_cart_width + 'px'
        }
    }
});
