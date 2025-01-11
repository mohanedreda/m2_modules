/** @odoo-module */

import {PosDB} from "@point_of_sale/app/store/db";
import {patch} from "@web/core/utils/patch";

PosDB.prototype.products_by_product_tmpl_id = {}

patch(PosDB.prototype, {

    add_products(products) {
        const res = super.add_products(products)
        let new_write_date = '';
        for (let i = 0; i < products.length; i++) {
            let product = products[i]
            if (product.product_tmpl_id) {
                if (!this.products_by_product_tmpl_id[product.product_tmpl_id]) {
                    this.products_by_product_tmpl_id[product.product_tmpl_id] = [product]
                } else {
                    this.products_by_product_tmpl_id[product.product_tmpl_id].push(product)
                }
            }
            var local_product_date = (this.product_write_date || '').replace(/^(\d{4}-\d{2}-\d{2}) ((\d{2}:?){3})$/, '$1T$2Z');
            var dist_product_date = (product.write_date || '').replace(/^(\d{4}-\d{2}-\d{2}) ((\d{2}:?){3})$/, '$1T$2Z');
            if (this.product_write_date && new Date(local_product_date).getTime() + 1000 >= new Date(dist_product_date).getTime()) {
                continue
            } else if (new_write_date < product.write_date) {
                new_write_date = product.write_date;
            }
        }
        this.product_write_date = new_write_date || this.product_write_date;
        if (!this.products_count) {
            this.products_count = 0
        }
        this.products_count += products.length
        console.log("-----> restored total products: " + this.products_count)
        console.log("product_write_date: " + this.product_write_date)
        return res
    },

    add_partners (partners) {
        if (!partners) {
            return false
        }
        if (!(partners instanceof Array)) {
            partners = [partners];
        }
        super.add_partners(partners)
        if (!this.partners_count) {
            this.partners_count = 0
        }
        this.partners_count += partners.length
        console.log("-----> restored total partners: " + this.partners_count)
        console.log("partner_write_date: " + this.partner_write_date)
    },
});
