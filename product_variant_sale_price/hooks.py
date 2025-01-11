def set_sale_price_on_variant(self, template_id=None):
    cr = self.cr  # Get the cursor from the environment

    sql = """
        UPDATE product_product pp
        SET fix_price = pt.list_price + (
            SELECT COALESCE(SUM(ptav.price_extra), 0)
            FROM product_variant_combination pvc
            LEFT JOIN product_template_attribute_value ptav ON
                ptav.id = pvc.product_template_attribute_value_id
            WHERE pvc.product_product_id = pp.id
            AND ptav.product_tmpl_id = pt.id
        )
        FROM product_template pt
        WHERE pt.id = pp.product_tmpl_id
    """
    if template_id:
        sql += " AND pt.id = %s"
        cr.execute(sql, (template_id,))
    else:
        cr.execute(sql)
