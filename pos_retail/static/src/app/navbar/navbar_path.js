/** @odoo-module */

import {Navbar} from "@point_of_sale/app/navbar/navbar";
import {GoInvoiceScreenButton} from "@pos_retail/app/navbar/go_invoice_screen_button/go_invoice_screen_button"
import {DisplayCounterButton} from "@pos_retail/app/navbar/display_counter_button/display_counter_button"
import {RemoveIndexDatabaseButton} from "@pos_retail/app/navbar/remove_index_database_button/remove_index_database_button"
import {LockScreenButton} from "@pos_retail/app/navbar/lock_screen_button/lock_screen_button"


Navbar.components = {
    ...Navbar.components,
    GoInvoiceScreenButton,
    DisplayCounterButton,
    RemoveIndexDatabaseButton,
    LockScreenButton,
};